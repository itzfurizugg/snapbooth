import { v2 as cloudinary } from 'cloudinary'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const maxDuration = 60

const PAGE_SIZE = 500
const MAX_PAGES = 10

function configureCloudinary(): void {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary env vars belum lengkap')
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.authorization !== `Bearer ${secret}`) {
    response.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    configureCloudinary()
    const now = Date.now()
    const expiredPublicIds: string[] = []
    let nextCursor: string | undefined
    let pages = 0

    do {
      const result = await cloudinary.api.resources_by_tag('snapbooth-expiring', {
        resource_type: 'image',
        type: 'authenticated',
        context: true,
        max_results: PAGE_SIZE,
        next_cursor: nextCursor,
      })

      for (const resource of result.resources ?? []) {
        const context = resource.context as { custom?: { expiresAt?: string } } | undefined
        const expiresAt = context?.custom?.expiresAt
        if (typeof expiresAt === 'string' && new Date(expiresAt).getTime() <= now) {
          expiredPublicIds.push(resource.public_id)
        }
      }

      nextCursor = result.next_cursor
      pages += 1
    } while (nextCursor && pages < MAX_PAGES)

    let deleted = 0
    for (let offset = 0; offset < expiredPublicIds.length; offset += 100) {
      const batch = expiredPublicIds.slice(offset, offset + 100)
      const result = await cloudinary.api.delete_resources(batch, {
        resource_type: 'image',
        type: 'authenticated',
        invalidate: true,
      })
      deleted += Object.values(result.deleted ?? {}).filter((value) => value === 'deleted').length
    }

    response.status(200).json({ deleted, scannedPages: pages, hasMore: Boolean(nextCursor) })
  } catch (error) {
    console.error('[snapbooth] Cloudinary cleanup failed:', error)
    response.status(502).json({ error: 'Gagal membersihkan strip expired' })
  }
}
