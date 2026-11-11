import { v2 as cloudinary } from 'cloudinary'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const ID_PATTERN = /^[A-HJ-NP-Za-km-z2-9]{16}$/

function configureCloudinary(): void {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary belum dikonfigurasi di Vercel Environment Variables')
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
}

function sendError(response: VercelResponse, status: number, message: string): void {
  response.status(status).json({ error: message })
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const id = request.query.id
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    sendError(response, 404, 'Strip tidak ditemukan')
    return
  }

  if (request.method !== 'GET' && request.method !== 'DELETE') {
    response.setHeader('Allow', 'GET, DELETE')
    sendError(response, 405, 'Metode tidak didukung')
    return
  }

  try {
    configureCloudinary()
    const publicId = `snapbooth/${id}`

    if (request.method === 'DELETE') {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', type: 'authenticated', invalidate: true })
      response.status(result.result === 'ok' || result.result === 'not found' ? 200 : 502).json({ deleted: result.result === 'ok' })
      return
    }

    const resource = await cloudinary.api.resource(publicId, { resource_type: 'image', type: 'authenticated', context: true })
    const context = resource.context?.custom ?? {}
    const expiresAt = typeof context.expiresAt === 'string' ? context.expiresAt : ''
    const frameId = typeof context.frameId === 'string' ? context.frameId : 'kilat'

    if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) {
      if (expiresAt) void cloudinary.uploader.destroy(publicId, { resource_type: 'image', type: 'authenticated', invalidate: true })
      sendError(response, 410, 'Strip sudah kedaluwarsa')
      return
    }

    response.status(200).json({
      id,
      frameId,
      imageUrl: cloudinary.utils.private_download_url(publicId, 'png', {
        resource_type: 'image',
        type: 'authenticated',
        expires_at: Math.min(new Date(expiresAt).getTime(), Date.now() + 60 * 60 * 1000) / 1000,
      }),
      expiresAt,
      createdAt: resource.created_at,
    })
  } catch (error) {
    const cloudinaryError = error as { http_code?: number; message?: string }
    if (cloudinaryError.http_code === 404) {
      sendError(response, 404, 'Strip tidak ditemukan')
      return
    }
    console.error('[snapbooth] Cloudinary session lookup failed:', error)
    sendError(response, 502, 'Gagal memuat strip dari Cloudinary')
  }
}
