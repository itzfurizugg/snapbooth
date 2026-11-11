import type { FrameId, SavedStrip, SharedStrip } from '../types'
import { supabase, isSupabaseConfigured } from './supabase'

const EXPIRY_HOURS = 24

interface SessionRow {
  id: string
  file_path: string
  frame_id: FrameId | null
  created_at: string
  expires_at: string
}

function randomId(length: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}

function buildShareUrl(path: string): string {
  const base = import.meta.env.VITE_PUBLIC_URL?.replace(/\/$/, '') ?? window.location.origin
  return `${base}${path}`
}

async function saveWithSupabase(imageDataUrl: string, frameId: FrameId): Promise<SavedStrip> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi')
  }

  const id = randomId(10)
  const filePath = `${id}.png`
  const blob = await (await fetch(imageDataUrl)).blob()

  const { error: uploadError } = await supabase.storage.from('strips').upload(filePath, blob, {
    contentType: 'image/png',
    upsert: false,
  })

  if (uploadError) {
    throw new Error(`Upload strip gagal: ${uploadError.message}`)
  }

  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000).toISOString()

  const { error: insertError } = await supabase.from('sessions').insert({
    id,
    file_path: filePath,
    frame_id: frameId,
    expires_at: expiresAt,
  })

  if (insertError) {
    void supabase.storage.from('strips').remove([filePath])
    throw new Error(`Sesi strip gagal dicatat: ${insertError.message}`)
  }

  const publicUrl = supabase.storage.from('strips').getPublicUrl(filePath).data.publicUrl

  return {
    id,
    shareUrl: buildShareUrl(`/s/${id}`),
    imageUrl: publicUrl,
    expiresAt,
    frameId,
  }
}

async function saveWithLocalApi(imageDataUrl: string, frameId: FrameId): Promise<SavedStrip> {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl, frameId }),
  })

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const serverMessage =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: string }).error)
        : ''
    const message =
      response.status === 404
        ? 'Versi deploy belum terhubung ke penyimpanan cloud. Hubungi pengelola untuk mengatur Supabase, lalu deploy ulang.'
        : serverMessage || `Upload strip gagal (${response.status})`
    throw new Error(message)
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Respons server tidak valid')
  }

  const result = payload as Record<string, unknown>
  const id = typeof result.id === 'string' ? result.id : ''
  const shareUrl = typeof result.shareUrl === 'string' ? result.shareUrl : ''
  const imageUrl = typeof result.imageUrl === 'string' ? result.imageUrl : ''
  const expiresAt = typeof result.expiresAt === 'string' ? result.expiresAt : ''

  if (!id || !shareUrl || !imageUrl || !expiresAt) {
    throw new Error('Respons server tidak lengkap')
  }

  return { id, shareUrl, imageUrl, expiresAt, frameId }
}

export async function saveStrip(imageDataUrl: string, frameId: FrameId): Promise<SavedStrip> {
  if (isSupabaseConfigured) {
    return saveWithSupabase(imageDataUrl, frameId)
  }
  return saveWithLocalApi(imageDataUrl, frameId)
}

export type FetchResult =
  | { state: 'ready'; strip: SharedStrip }
  | { state: 'expired' }
  | { state: 'missing' }

function toSharedStrip(row: SessionRow, imageUrl: string): SharedStrip {
  return {
    id: row.id,
    imageUrl,
    expiresAt: row.expires_at,
    frameId: row.frame_id ?? 'kilat',
    createdAt: row.created_at,
  }
}

export async function fetchSharedStrip(id: string): Promise<FetchResult> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('sessions')
      .select('id,file_path,frame_id,created_at,expires_at')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(`Gagal memuat sesi: ${error.message}`)
    }

    if (!data) {
      return { state: 'missing' }
    }

    if (new Date(data.expires_at).getTime() < Date.now()) {
      return { state: 'expired' }
    }

    const imageUrl = supabase.storage.from('strips').getPublicUrl(data.file_path).data.publicUrl
    return { state: 'ready', strip: toSharedStrip(data, imageUrl) }
  }

  const response = await fetch(`/api/sessions/${encodeURIComponent(id)}`, {
    headers: { Accept: 'application/json' },
  })

  if (response.status === 404) {
    const details = await response.json().catch(() => null)
    if (details && typeof details === 'object' && 'error' in details) {
      throw new Error(String((details as { error: string }).error))
    }
    throw new Error('Tautan unduh ini tidak tersedia pada versi deploy ini.')
  }

  if (response.status === 410) {
    return { state: 'expired' }
  }

  if (response.status === 404) {
    return { state: 'missing' }
  }

  if (!response.ok) {
    throw new Error(`Gagal memuat sesi (${response.status})`)
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!payload || typeof payload !== 'object') {
    throw new Error('Respons server tidak valid')
  }

  const result = payload as Record<string, unknown>
  const filePath = typeof result.filePath === 'string' ? result.filePath : ''
  const created = typeof result.createdAt === 'string' ? result.createdAt : new Date().toISOString()

  const strip: SharedStrip = {
    id,
    imageUrl: filePath,
    expiresAt: typeof result.expiresAt === 'string' ? result.expiresAt : '',
    frameId: result.frameId === 'klasik' || result.frameId === 'bioskop' ? result.frameId : 'kilat',
    createdAt: created,
  }

  if (!strip.imageUrl || !strip.expiresAt) {
    throw new Error('Respons server tidak lengkap')
  }

  return { state: 'ready', strip }
}