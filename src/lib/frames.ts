import type { FrameConfig, FrameId } from '../types'

const sample = (seed: string): string => `https://picsum.photos/seed/${seed}/640/440?grayscale`

// Background choices mirror supported image files in template/background.
const backgroundFiles = Object.keys(import.meta.glob('/template/background/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }))
  .map((path) => `/backgrounds/${path.split('/').pop()}`)

export const FRAMES: FrameConfig[] = [
  {
    id: 'kilat', name: 'Kilat', index: '01', description: 'Tiga foto dalam strip Snapbooth.', note: 'Template dari repo',
    slotCount: 3, width: 480, height: 1034, image: '/templates/origin.png', virtualBackground: true, backgrounds: backgroundFiles,
    palette: { background: '#E4E9D1', ink: '#11100E', accent: '#FF7A00', paper: '#E4E9D1', muted: '#635F54' },
    slots: [
      { x: 20, y: 20, width: 440, height: 266 }, { x: 20, y: 306, width: 440, height: 266 },
      { x: 20, y: 592, width: 440, height: 266 },
    ], sampleImages: [sample('snapbooth-kilat-1'), sample('snapbooth-kilat-2'), sample('snapbooth-kilat-3'), sample('snapbooth-kilat-4')],
  },
  {
    id: 'cute-animal', name: 'Cute Animal', index: '02', description: 'Tiga foto dengan dekorasi hewan lucu.', note: 'Template baru',
    slotCount: 4, width: 602, height: 1795, image: '/templates/cute-animal.png', virtualBackground: true, backgrounds: backgroundFiles,
    palette: { background: '#FFF1F5', ink: '#342532', accent: '#F28CAE', paper: '#FFF1F5', muted: '#8A7180' },
    slots: [
      { x: 0, y: 95, width: 516, height: 364 }, { x: 86, y: 509, width: 516, height: 364 },
      { x: 0, y: 922, width: 516, height: 364 }, { x: 86, y: 1335, width: 516, height: 364 },
    ], sampleImages: [sample('snapbooth-animal-1'), sample('snapbooth-animal-2'), sample('snapbooth-animal-3'), sample('snapbooth-animal-4')],
  },
  {
    id: 'klasik', name: 'Klasik', index: '03', description: 'Empat foto dengan margin lega.', note: 'Kertas terang',
    slotCount: 4, width: 720, height: 2160, image: '/templates/klasik.png',
    palette: { background: '#F5F2E9', ink: '#11100E', accent: '#E33B2E', paper: '#F5F2E9', muted: '#6C685D' },
    slots: [
      { x: 62, y: 206, width: 596, height: 392 }, { x: 62, y: 626, width: 596, height: 392 },
      { x: 62, y: 1046, width: 596, height: 392 }, { x: 62, y: 1466, width: 596, height: 392 },
    ], sampleImages: [sample('snapbooth-klasik-1'), sample('snapbooth-klasik-2'), sample('snapbooth-klasik-3'), sample('snapbooth-klasik-4')],
  },
  {
    id: 'bioskop', name: 'Bioskop', index: '03', description: 'Tiga foto lebar bergaya film.', note: 'Gelap',
    slotCount: 3, width: 800, height: 2000, image: '/templates/bioskop.png',
    palette: { background: '#151513', ink: '#F5F2E9', accent: '#EFE73A', paper: '#F5F2E9', muted: '#98948A' },
    slots: [
      { x: 84, y: 150, width: 632, height: 444 }, { x: 84, y: 622, width: 632, height: 444 },
      { x: 84, y: 1094, width: 632, height: 444 },
    ], sampleImages: [sample('snapbooth-bioskop-1'), sample('snapbooth-bioskop-2'), sample('snapbooth-bioskop-3')],
  },
]

export const DEFAULT_FRAME_ID: FrameId = 'kilat'
export function getFrame(id: FrameId): FrameConfig { return FRAMES.find((frame) => frame.id === id) ?? FRAMES[0] }
export function getFrameSlots(id: FrameId): number { return getFrame(id).slotCount }
