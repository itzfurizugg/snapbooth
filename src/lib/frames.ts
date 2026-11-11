import type { FrameConfig, FrameId } from '../types'

const sample = (seed: string): string =>
  `https://picsum.photos/seed/${seed}/640/440?grayscale`

export const FRAMES: FrameConfig[] = [
  {
    id: 'kilat',
    name: 'Kilat',
    index: '01',
    description: 'Kuning penuh, bingkai hitam, empat frame rapat.',
    note: 'Paling berisik. Paling terlihat dari seberang ruangan.',
    slotCount: 4,
    width: 720,
    height: 1920,
    palette: {
      background: '#EFE73A',
      ink: '#11100E',
      accent: '#E33B2E',
      paper: '#F5F2E9',
      muted: '#635F54',
    },
    slots: [
      { x: 56, y: 136, width: 608, height: 380 },
      { x: 56, y: 540, width: 608, height: 380 },
      { x: 56, y: 944, width: 608, height: 380 },
      { x: 56, y: 1348, width: 608, height: 380 },
    ],
    sampleImages: [sample('snapbooth-kilat-1'), sample('snapbooth-kilat-2'), sample('snapbooth-kilat-3'), sample('snapbooth-kilat-4')],
  },
  {
    id: 'klasik',
    name: 'Klasik',
    index: '02',
    description: 'Kertas terang, margin lega, satu cap merah.',
    note: 'Strip photobooth lama yang tidak pernah salah.',
    slotCount: 4,
    width: 720,
    height: 2160,
    palette: {
      background: '#F5F2E9',
      ink: '#11100E',
      accent: '#E33B2E',
      paper: '#F5F2E9',
      muted: '#6C685D',
    },
    slots: [
      { x: 62, y: 206, width: 596, height: 392 },
      { x: 62, y: 626, width: 596, height: 392 },
      { x: 62, y: 1046, width: 596, height: 392 },
      { x: 62, y: 1466, width: 596, height: 392 },
    ],
    sampleImages: [sample('snapbooth-klasik-1'), sample('snapbooth-klasik-2'), sample('snapbooth-klasik-3'), sample('snapbooth-klasik-4')],
  },
  {
    id: 'bioskop',
    name: 'Bioskop',
    index: '03',
    description: 'Tiga frame lebar dengan perforasi film.',
    note: 'Untuk pose berdua, bertiga, atau satu orang yang percaya diri.',
    slotCount: 3,
    width: 800,
    height: 2000,
    palette: {
      background: '#151513',
      ink: '#F5F2E9',
      accent: '#EFE73A',
      paper: '#F5F2E9',
      muted: '#98948A',
    },
    slots: [
      { x: 84, y: 150, width: 632, height: 444 },
      { x: 84, y: 622, width: 632, height: 444 },
      { x: 84, y: 1094, width: 632, height: 444 },
    ],
    sampleImages: [sample('snapbooth-bioskop-1'), sample('snapbooth-bioskop-2'), sample('snapbooth-bioskop-3')],
  },
]

export const DEFAULT_FRAME_ID: FrameId = 'kilat'

export function getFrame(id: FrameId): FrameConfig {
  return FRAMES.find((frame) => frame.id === id) ?? FRAMES[0]
}

export function getFrameSlots(id: FrameId): number {
  return getFrame(id).slotCount
}
