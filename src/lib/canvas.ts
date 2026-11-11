import type { FrameConfig, FrameId } from '../types'
import { getFrame } from './frames'

interface RenderOptions {
  mirror: boolean
  date?: Date
  code?: string
}

const MONO = '"Courier New", Courier, monospace'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Foto tidak dapat dimuat'))
    image.src = src
  })
}

export function createStripCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}

export function formatStripDate(date = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .replace(/\./g, '')
    .toUpperCase()
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  mirror: boolean,
): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()

  if (mirror) {
    ctx.translate(x + width, y)
    ctx.scale(-1, 1)
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height)
  } else {
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
  }

  ctx.restore()
}

function drawMissingSlot(
  ctx: CanvasRenderingContext2D,
  frame: FrameConfig,
  x: number,
  y: number,
  width: number,
  height: number,
  index: number,
): void {
  ctx.fillStyle = '#23221E'
  ctx.fillRect(x, y, width, height)
  ctx.strokeStyle = '#49463D'
  ctx.lineWidth = 1
  for (let offset = -height; offset < width; offset += 24) {
    ctx.beginPath()
    ctx.moveTo(x + offset, y + height)
    ctx.lineTo(x + offset + height, y)
    ctx.stroke()
  }
  ctx.fillStyle = frame.palette.muted
  ctx.font = `700 18px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText(`FOTO ${String(index + 1).padStart(2, '0')} / KOSONG`, x + width / 2, y + height / 2 + 6)
  ctx.textAlign = 'left'
}

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = '400',
): void {
  ctx.fillStyle = color
  ctx.font = `${weight} ${size}px ${MONO}`
  ctx.fillText(text, x, y)
}

function rightLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = '400',
): void {
  ctx.fillStyle = color
  ctx.font = `${weight} ${size}px ${MONO}`
  ctx.textAlign = 'right'
  ctx.fillText(text, x, y)
  ctx.textAlign = 'left'
}

function drawSprockets(ctx: CanvasRenderingContext2D, frame: FrameConfig): void {
  ctx.fillStyle = '#3B3932'
  const start = 112
  const end = frame.height - 132
  for (let y = start; y < end; y += 48) {
    ctx.fillRect(18, y, 32, 22)
    ctx.fillRect(frame.width - 50, y, 32, 22)
  }
  ctx.fillStyle = frame.palette.accent
  ctx.fillRect(26, start - 12, 16, 2)
  ctx.fillRect(frame.width - 42, start - 12, 16, 2)
}

function drawHeaderTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  index: number,
  background: string,
  color: string,
): void {
  ctx.fillStyle = background
  ctx.fillRect(x, y, 46, 26)
  label(ctx, String(index + 1).padStart(2, '0'), x + 7, y + 18, 13, color, '700')
}

function drawKilat(
  ctx: CanvasRenderingContext2D,
  frame: FrameConfig,
  images: Array<HTMLImageElement | null>,
  options: Required<RenderOptions>,
): void {
  const { background, ink, accent, paper } = frame.palette
  ctx.fillStyle = background
  ctx.fillRect(0, 0, frame.width, frame.height)

  ctx.fillStyle = ink
  ctx.fillRect(0, 0, frame.width, 104)
  ctx.fillStyle = accent
  ctx.fillRect(0, 104, frame.width, 10)
  label(ctx, 'SNAPBOOTH', 56, 66, 34, paper, '700')
  rightLabel(ctx, 'STRIP 001 / 24H', frame.width - 56, 62, 16, paper)

  frame.slots.forEach((slot, index) => {
    const image = images[index]
    if (image) {
      drawCover(ctx, image, slot.x, slot.y, slot.width, slot.height, options.mirror)
    } else {
      drawMissingSlot(ctx, frame, slot.x, slot.y, slot.width, slot.height, index)
    }
    ctx.strokeStyle = ink
    ctx.lineWidth = 4
    ctx.strokeRect(slot.x, slot.y, slot.width, slot.height)
    drawHeaderTag(ctx, slot.x + 10, slot.y + 10, index, ink, paper)
  })

  ctx.fillStyle = ink
  ctx.fillRect(0, 1740, frame.width, frame.height - 1740)
  ctx.fillStyle = accent
  ctx.fillRect(56, 1772, 216, 40)
  label(ctx, 'SIMPAN →', 72, 1799, 18, paper, '700')
  label(ctx, options.code, 56, 1852, 22, paper, '700')
  rightLabel(ctx, formatStripDate(options.date), frame.width - 56, 1799, 18, paper, '700')
  rightLabel(ctx, 'SCAN / CETAK / ULANGI', frame.width - 56, 1852, 13, '#A5A096')
  ctx.strokeStyle = '#4B483F'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(56, 1816)
  ctx.lineTo(frame.width - 56, 1816)
  ctx.stroke()
}

function drawKlasik(
  ctx: CanvasRenderingContext2D,
  frame: FrameConfig,
  images: Array<HTMLImageElement | null>,
  options: Required<RenderOptions>,
): void {
  const { background, ink, accent, paper, muted } = frame.palette
  ctx.fillStyle = background
  ctx.fillRect(0, 0, frame.width, frame.height)

  ctx.strokeStyle = ink
  ctx.lineWidth = 6
  ctx.strokeRect(12, 12, frame.width - 24, frame.height - 24)
  ctx.lineWidth = 1
  ctx.strokeRect(24, 24, frame.width - 48, frame.height - 48)

  label(ctx, 'SNAPBOOTH', 62, 112, 62, ink, '700')
  rightLabel(ctx, 'NO. 001', frame.width - 62, 72, 16, ink, '700')
  label(ctx, 'PHOTOBOOTH CLIENT / EMPAT FRAME', 62, 146, 14, muted)
  ctx.strokeStyle = ink
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(62, 166)
  ctx.lineTo(frame.width - 62, 166)
  ctx.stroke()

  frame.slots.forEach((slot, index) => {
    const image = images[index]
    if (image) {
      drawCover(ctx, image, slot.x, slot.y, slot.width, slot.height, options.mirror)
    } else {
      drawMissingSlot(ctx, frame, slot.x, slot.y, slot.width, slot.height, index)
    }
    ctx.strokeStyle = ink
    ctx.lineWidth = 3
    ctx.strokeRect(slot.x, slot.y, slot.width, slot.height)
    drawHeaderTag(ctx, slot.x + 10, slot.y + 10, index, paper, ink)
  })

  ctx.strokeStyle = ink
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(62, 1902)
  ctx.lineTo(frame.width - 62, 1902)
  ctx.stroke()

  label(ctx, 'TERIMA KASIH', 62, 1958, 17, accent, '700')
  label(ctx, 'SUDAH BERPOSE', 62, 1982, 17, ink, '700')
  label(ctx, options.code, 62, 2056, 32, ink, '700')
  label(ctx, formatStripDate(options.date), 62, 2090, 16, muted)
  rightLabel(ctx, 'SIMPAN', frame.width - 62, 1958, 15, muted)
  rightLabel(ctx, 'CETAK', frame.width - 62, 1984, 15, muted)
  rightLabel(ctx, 'ULANGI', frame.width - 62, 2010, 15, muted)

  ctx.fillStyle = accent
  ctx.fillRect(frame.width - 230, 2040, 168, 50)
  label(ctx, '24 JAM', frame.width - 214, 2072, 22, paper, '700')
}

function drawBioskop(
  ctx: CanvasRenderingContext2D,
  frame: FrameConfig,
  images: Array<HTMLImageElement | null>,
  options: Required<RenderOptions>,
): void {
  const { background, ink, accent, muted } = frame.palette
  ctx.fillStyle = background
  ctx.fillRect(0, 0, frame.width, frame.height)
  drawSprockets(ctx, frame)

  ctx.fillStyle = accent
  ctx.fillRect(84, 76, 16, 16)
  label(ctx, 'SNAPBOOTH', 116, 92, 30, ink, '700')
  rightLabel(ctx, 'SUPER 8 / 003', frame.width - 84, 92, 14, muted)

  ctx.strokeStyle = ink
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(84, 112)
  ctx.lineTo(frame.width - 84, 112)
  ctx.stroke()

  frame.slots.forEach((slot, index) => {
    const image = images[index]
    if (image) {
      drawCover(ctx, image, slot.x, slot.y, slot.width, slot.height, options.mirror)
    } else {
      drawMissingSlot(ctx, frame, slot.x, slot.y, slot.width, slot.height, index)
    }
    ctx.strokeStyle = ink
    ctx.lineWidth = 2
    ctx.strokeRect(slot.x, slot.y, slot.width, slot.height)
    ctx.fillStyle = accent
    ctx.fillRect(slot.x + 12, slot.y + 12, 46, 26)
    label(ctx, String(index + 1).padStart(2, '0'), slot.x + 19, slot.y + 30, 13, background, '700')
  })

  const footerTop = 1580
  ctx.fillStyle = accent
  ctx.fillRect(84, footerTop, 120, 8)
  label(ctx, 'SNAPBOOTH', 84, footerTop + 72, 52, ink, '700')
  label(ctx, 'FOTO LEBIH BAIK DIBAGIKAN DARIPADA DISIMPAN.', 84, footerTop + 106, 13, muted)
  label(ctx, options.code, 84, footerTop + 178, 28, ink, '700')
  label(ctx, formatStripDate(options.date), 84, footerTop + 212, 15, muted)
  rightLabel(ctx, 'SCAN', frame.width - 84, footerTop + 72, 14, muted)
  rightLabel(ctx, 'SIMPAN', frame.width - 84, footerTop + 98, 14, muted)
  rightLabel(ctx, 'ULANGI', frame.width - 84, footerTop + 124, 14, muted)
  ctx.strokeStyle = muted
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(frame.width - 224, footerTop + 148)
  ctx.lineTo(frame.width - 84, footerTop + 148)
  ctx.stroke()
  rightLabel(ctx, '24 JAM', frame.width - 84, footerTop + 180, 24, accent, '700')
}

export async function renderStrip(
  frameId: FrameId,
  photos: string[],
  options: RenderOptions = { mirror: false },
): Promise<string> {
  const frame = getFrame(frameId)
  const canvas = document.createElement('canvas')
  canvas.width = frame.width
  canvas.height = frame.height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas tidak tersedia di browser ini')
  }

  const images = await Promise.all(
    frame.slots.map(async (_, index) => {
      const photo = photos[index]
      if (!photo) return null
      try {
        return await loadImage(photo)
      } catch {
        return null
      }
    }),
  )

  const resolvedOptions: Required<RenderOptions> = {
    mirror: options.mirror,
    date: options.date ?? new Date(),
    code: options.code ?? createStripCode(),
  }

  if (frame.id === 'kilat') drawKilat(ctx, frame, images, resolvedOptions)
  if (frame.id === 'klasik') drawKlasik(ctx, frame, images, resolvedOptions)
  if (frame.id === 'bioskop') drawBioskop(ctx, frame, images, resolvedOptions)

  return canvas.toDataURL('image/png')
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

export function captureVideoFrame(video: HTMLVideoElement): string {
  const width = video.videoWidth
  const height = video.videoHeight

  if (!width || !height) {
    throw new Error('Kamera belum siap')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas tidak tersedia di browser ini')
  }

  ctx.drawImage(video, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', 0.92)
}
