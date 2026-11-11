import { randomBytes } from 'node:crypto'
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { networkInterfaces } from 'node:os'
import path from 'node:path'
import type { Plugin } from 'vite'

const EXPIRY_MS = 24 * 60 * 60 * 1000
const MAX_BODY_BYTES = 16 * 1024 * 1024
const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const FRAME_IDS = new Set(['kilat', 'klasik', 'bioskop'])

interface StoredSession {
  id: string
  frameId: string
  createdAt: string
  expiresAt: string
}

class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function dataDirectory(): string {
  return path.resolve(process.cwd(), '.snapbooth-data')
}

function sessionPath(id: string): string {
  return path.join(dataDirectory(), `${id}.json`)
}

function imagePath(id: string): string {
  return path.join(dataDirectory(), `${id}.png`)
}

function makeId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = randomBytes(10)
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}

async function ensureDirectory(): Promise<void> {
  await mkdir(dataDirectory(), { recursive: true })
}

async function cleanupExpired(): Promise<void> {
  try {
    const entries = await readdir(dataDirectory())
    const now = Date.now()
    await Promise.all(
      entries
        .filter((entry) => entry.endsWith('.json'))
        .map(async (entry) => {
          try {
            const raw = await readFile(path.join(dataDirectory(), entry), 'utf8')
            const parsed = JSON.parse(raw) as StoredSession
            if (new Date(parsed.expiresAt).getTime() > now) return
            await Promise.all([
              unlink(path.join(dataDirectory(), entry)).catch(() => undefined),
              unlink(path.join(dataDirectory(), `${parsed.id}.png`)).catch(() => undefined),
            ])
          } catch {
            // A malformed or already-removed session must not block the API.
          }
        }),
    )
  } catch {
    // The directory may not exist yet on first request.
  }
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0

    request.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'Ukuran file terlalu besar'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', () => reject(new HttpError(400, 'Gagal membaca permintaan')))
  })
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Content-Length', Buffer.byteLength(payload))
  response.setHeader('Cache-Control', 'no-store')
  response.end(payload)
}

function localAddress(): string | null {
  const interfaces = networkInterfaces()
  const candidates: string[] = []

  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) {
        candidates.push(address.address)
      }
    }
  }

  return candidates.find((address) => address.startsWith('192.168.')) ?? candidates[0] ?? null
}

function publicBase(request: IncomingMessage, configuredUrl?: string): string {
  if (configuredUrl) return configuredUrl.replace(/\/$/, '')

  const forwarded = request.headers['x-forwarded-proto']
  const protocol = typeof forwarded === 'string' ? forwarded.split(',')[0] : 'http'
  const hostHeader = request.headers.host ?? 'localhost:5173'
  const match = /^([^:]+)(:\d+)?$/.exec(hostHeader)

  if (!match) return `${protocol}://${hostHeader}`

  const [, hostname, port] = match
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
    const lan = localAddress()
    if (lan) return `${protocol}://${lan}${port ?? ''}`
  }

  return `${protocol}://${hostHeader}`
}

async function createSession(request: IncomingMessage): Promise<{ id: string; frameId: string; createdAt: string; expiresAt: string }> {
  const raw = await readBody(request)
  let payload: unknown

  try {
    payload = JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'JSON tidak valid')
  }

  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'Permintaan tidak valid')
  }

  const body = payload as Record<string, unknown>
  const image = typeof body.image === 'string' ? body.image : ''
  const frameId = typeof body.frameId === 'string' && FRAME_IDS.has(body.frameId) ? body.frameId : null

  if (!frameId) {
    throw new HttpError(400, 'Frame tidak valid')
  }

  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(image)
  if (!match) {
    throw new HttpError(400, 'File harus berupa PNG')
  }

  const buffer = Buffer.from(match[1], 'base64')
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new HttpError(413, 'Ukuran strip maksimal 12 MB')
  }

  const pngSignature = buffer.subarray(0, 8).toString('hex')
  if (pngSignature !== '89504e470d0a1a0a') {
    throw new HttpError(400, 'Isi file bukan PNG yang valid')
  }

  const id = makeId()
  const createdAt = new Date()
  const expiresAt = new Date(createdAt.getTime() + EXPIRY_MS).toISOString()
  const session: StoredSession = {
    id,
    frameId,
    createdAt: createdAt.toISOString(),
    expiresAt,
  }

  await ensureDirectory()
  await writeFile(imagePath(id), buffer)
  await writeFile(sessionPath(id), JSON.stringify(session), 'utf8')

  return session
}

async function readSession(id: string): Promise<StoredSession> {
  try {
    const raw = await readFile(sessionPath(id), 'utf8')
    return JSON.parse(raw) as StoredSession
  } catch {
    throw new HttpError(404, 'Sesi tidak ditemukan')
  }
}

async function sendImage(request: IncomingMessage, response: ServerResponse, id: string): Promise<void> {
  const session = await readSession(id)

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await Promise.all([
      unlink(sessionPath(id)).catch(() => undefined),
      unlink(imagePath(id)).catch(() => undefined),
    ])
    throw new HttpError(410, 'Strip sudah kedaluwarsa')
  }

  const file = await readFile(imagePath(id)).catch(() => {
    throw new HttpError(404, 'File strip tidak ditemukan')
  })

  response.statusCode = 200
  response.setHeader('Content-Type', 'image/png')
  response.setHeader('Content-Length', file.length)
  response.setHeader('Content-Disposition', `inline; filename="snapbooth-${id}.png"`)
  response.setHeader('Cache-Control', 'private, max-age=3600')
  response.end(request.method === 'HEAD' ? undefined : file)
}

function createHandler(configuredUrl?: string) {
  return async (request: IncomingMessage, response: ServerResponse, next: (error?: unknown) => void): Promise<void> => {
    const pathname = new URL(request.url ?? '/', 'http://snapbooth.local').pathname

    if (!pathname.startsWith('/api/')) {
      next()
      return
    }

    try {
      void cleanupExpired()

      if (pathname === '/api/sessions' && request.method === 'POST') {
        const session = await createSession(request)
        const base = publicBase(request, configuredUrl)
        sendJson(response, 201, {
          ...session,
          shareUrl: `${base}/s/${session.id}`,
          imageUrl: `/api/strips/${session.id}.png`,
        })
        return
      }

      const sessionMatch = /^\/api\/sessions\/([A-Za-z0-9]{10})$/.exec(pathname)
      if (sessionMatch) {
        if (request.method !== 'GET') throw new HttpError(405, 'Metode tidak didukung')
        const session = await readSession(sessionMatch[1])
        if (new Date(session.expiresAt).getTime() <= Date.now()) {
          throw new HttpError(410, 'Strip sudah kedaluwarsa')
        }
        sendJson(response, 200, {
          ...session,
          filePath: `/api/strips/${session.id}.png`,
        })
        return
      }

      const imageMatch = /^\/api\/strips\/([A-Za-z0-9]{10})\.png$/.exec(pathname)
      if (imageMatch) {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          throw new HttpError(405, 'Metode tidak didukung')
        }
        await sendImage(request, response, imageMatch[1])
        return
      }

      throw new HttpError(404, 'Endpoint tidak ditemukan')
    } catch (caught) {
      const status = caught instanceof HttpError ? caught.status : 500
      const message = caught instanceof Error ? caught.message : 'Terjadi kesalahan pada storage lokal'
      if (status === 500) console.error('[snapbooth] local storage error:', caught)
      sendJson(response, status, { error: message })
    }
  }
}

export function snapboothLocalApi(configuredUrl?: string): Plugin {
  return {
    name: 'snapbooth-local-api',
    configureServer(server) {
      server.middlewares.use(createHandler(configuredUrl))
    },
    configurePreviewServer(server) {
      server.middlewares.use(createHandler(configuredUrl))
    },
  }
}
