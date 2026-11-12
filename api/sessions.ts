import { randomBytes } from 'node:crypto'
import { v2 as cloudinary } from 'cloudinary'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const ID_LENGTH = 16
const MAX_BODY_BYTES = 16 * 1024 * 1024
const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
const VALID_FRAMES = new Set(['origin', 'cute-animal', 'desain-tanpa-judul'])

function configureCloudinary(): void {
  const cloudinaryUrl = process.env.CLOUDINARY_URL
  if (cloudinaryUrl) {
    cloudinary.config({ cloudinary_url: cloudinaryUrl, secure: true })
    return
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Set CLOUDINARY_URL atau CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET di Vercel.')
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
}

function createId(): string {
  const bytes = randomBytes(ID_LENGTH)
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
}

function sendError(response: VercelResponse, status: number, message: string): void {
  response.status(status).json({ error: message })
}

function requestOrigin(request: VercelRequest): string {
  const configured = process.env.VITE_PUBLIC_URL?.replace(/\/$/, '')
  if (configured) return configured
  const host = request.headers['x-forwarded-host'] ?? request.headers.host
  const proto = request.headers['x-forwarded-proto'] ?? 'https'
  return `${proto}://${host}`
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendError(response, 405, 'Metode tidak didukung')
    return
  }

  const contentLength = Number(request.headers['content-length'] ?? 0)
  if (contentLength > MAX_BODY_BYTES) {
    sendError(response, 413, 'Ukuran strip maksimal 12 MB')
    return
  }

  const body = request.body as unknown
  if (!body || typeof body !== 'object') {
    sendError(response, 400, 'Permintaan tidak valid')
    return
  }

  const payload = body as Record<string, unknown>
  const frameId = typeof payload.frameId === 'string' && VALID_FRAMES.has(payload.frameId) ? payload.frameId : null
  const image = typeof payload.image === 'string' ? payload.image : ''
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=\r\n]+)$/.exec(image)

  if (!frameId || !match) {
    sendError(response, 400, 'Data strip atau frame tidak valid')
    return
  }

  const imageBuffer = Buffer.from(match[1], 'base64')
  if (imageBuffer.length > MAX_IMAGE_BYTES || imageBuffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    sendError(response, imageBuffer.length > MAX_IMAGE_BYTES ? 413 : 400, 'File PNG tidak valid atau melebihi 12 MB')
    return
  }

  try {
    configureCloudinary()
    const id = createId()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await cloudinary.uploader.upload(image, {
      resource_type: 'image',
      type: 'authenticated',
      public_id: `snapbooth/strips/${id}`,
      overwrite: false,
      format: 'png',
      tags: ['snapbooth-expiring', `expires-${Math.floor(expiresAt.getTime() / 1000)}`],
      context: { frameId, expiresAt: expiresAt.toISOString() },
    })

    response.status(201).json({
      id,
      frameId,
      shareUrl: `${requestOrigin(request)}/s/${id}`,
      imageUrl: cloudinary.utils.private_download_url(`snapbooth/strips/${id}`, 'png', {
        resource_type: 'image',
        type: 'authenticated',
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      }),
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    const cloudinaryError = error as { http_code?: number; message?: string; name?: string }
    console.error('[snapbooth] Cloudinary upload failed:', {
      name: cloudinaryError.name,
      http_code: cloudinaryError.http_code,
      message: cloudinaryError.message,
    })
    const message = cloudinaryError.message ?? 'Upload Cloudinary gagal'
    sendError(response, cloudinaryError.http_code === 400 ? 400 : 502, message)
  }
}
