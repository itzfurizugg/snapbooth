import { randomBytes } from 'node:crypto'
import { v2 as cloudinary } from 'cloudinary'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const EXPIRY_MS = 24 * 60 * 60 * 1000
const MAX_BODY_BYTES = 16 * 1024 * 1024
const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const FRAME_IDS = new Set(['classc', 'hypr', 'wav'])

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

function makeId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = randomBytes(10)
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
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

function publicBase(request: IncomingMessage): string {
  const configured = process.env.SNAPBOOTH_PUBLIC_URL || process.env.VITE_PUBLIC_URL
  if (configured) return configured.replace(/\/$/, '')
  const forwardedProto = request.headers['x-forwarded-proto']
  const protocol = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0] : 'http'
  const forwardedHost = request.headers['x-forwarded-host']
  const host = typeof forwardedHost === 'string' ? forwardedHost.split(',')[0] : request.headers.host ?? 'localhost:5173'
  return `${protocol}://${host}`
}

function configureCloudinary(): void {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL, secure: true })
    return
  }
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new HttpError(500, 'Atur CLOUDINARY_URL atau CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET di .env')
  }
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true })
}

async function createSession(request: IncomingMessage): Promise<StoredSession & { shareUrl: string; imageUrl: string }> {
  const raw = await readBody(request)
  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'JSON tidak valid')
  }
  if (!payload || typeof payload !== 'object') throw new HttpError(400, 'Permintaan tidak valid')

  const body = payload as Record<string, unknown>
  const image = typeof body.image === 'string' ? body.image : ''
  const frameId = typeof body.frameId === 'string' && FRAME_IDS.has(body.frameId) ? body.frameId : null
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(image)
  if (!frameId) throw new HttpError(400, 'Frame tidak valid')
  if (!match) throw new HttpError(400, 'File harus berupa PNG')

  const buffer = Buffer.from(match[1], 'base64')
  if (buffer.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'Ukuran strip maksimal 12 MB')
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new HttpError(400, 'Isi file bukan PNG yang valid')

  configureCloudinary()
  const id = makeId()
  const createdAt = new Date()
  const expiresAt = new Date(createdAt.getTime() + EXPIRY_MS).toISOString()
  await cloudinary.uploader.upload(image, {
    resource_type: 'image', type: 'authenticated', public_id: `snapbooth/strips/${id}`,
    overwrite: false, format: 'png', tags: ['snapbooth-expiring', `expires-${Math.floor(new Date(expiresAt).getTime() / 1000)}`],
    context: { frameId, expiresAt },
  })
  return {
    id, frameId, createdAt: createdAt.toISOString(), expiresAt,
    shareUrl: `${publicBase(request)}/s/${id}`,
    imageUrl: cloudinary.utils.private_download_url(`snapbooth/strips/${id}`, 'png', {
      resource_type: 'image', type: 'authenticated', expires_at: Math.floor(Date.now() / 1000) + 3600,
    }),
  }
}

async function readSession(id: string): Promise<StoredSession> {
  try {
    configureCloudinary()
    const resource = await cloudinary.api.resource(`snapbooth/strips/${id}`, {
      resource_type: 'image', type: 'authenticated', context: true,
    })
    const context = resource.context?.custom ?? {}
    return {
      id,
      frameId: typeof context.frameId === 'string' ? context.frameId : 'classc',
      createdAt: resource.created_at,
      expiresAt: typeof context.expiresAt === 'string' ? context.expiresAt : '',
    }
  } catch (caught) {
    const error = caught as { http_code?: number }
    if (error.http_code === 404) throw new HttpError(404, 'Sesi tidak ditemukan')
    throw caught
  }
}

function createHandler() {
  return async (request: IncomingMessage, response: ServerResponse, next: (error?: unknown) => void): Promise<void> => {
    const pathname = new URL(request.url ?? '/', 'http://snapbooth.local').pathname
    if (!pathname.startsWith('/api/')) return next()
    try {
      if (pathname === '/api/sessions' && request.method === 'POST') {
        sendJson(response, 201, await createSession(request))
        return
      }
      const match = /^\/api\/sessions\/([A-Za-z0-9]{10})$/.exec(pathname)
      if (match && request.method === 'GET') {
        const session = await readSession(match[1])
        if (!session.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) {
          throw new HttpError(410, 'Strip sudah kedaluwarsa')
        }
        sendJson(response, 200, {
          ...session,
          imageUrl: cloudinary.utils.private_download_url(`snapbooth/strips/${session.id}`, 'png', {
            resource_type: 'image', type: 'authenticated', expires_at: Math.floor(Date.now() / 1000) + 3600,
          }),
        })
        return
      }
      if (match) throw new HttpError(405, 'Metode tidak didukung')
      throw new HttpError(404, 'Endpoint tidak ditemukan')
    } catch (caught) {
      const error = caught as { status?: number; http_code?: number; message?: string }
      const status = error instanceof HttpError ? error.status : error.http_code === 404 ? 404 : 502
      console.error('[snapbooth] Cloudinary API failed:', error.message ?? caught)
      sendJson(response, status, { error: error.message ?? 'Cloudinary request failed' })
    }
  }
}

export function snapboothLocalApi(): Plugin {
  return {
    name: 'snapbooth-local-api',
    configureServer(server) { server.middlewares.use(createHandler()) },
    configurePreviewServer(server) { server.middlewares.use(createHandler()) },
  }
}
