import type { FrameConfig, FrameId } from '../types'

const sample = (seed: string): string => `https://picsum.photos/seed/${seed}/640/440?grayscale`

// Background choices mirror supported image files in template/background.
const backgroundFiles = Object.keys(import.meta.glob('/template/background/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }))

export const FRAMES: FrameConfig[] = [
  {
    id: 'origin', name: 'Origin', index: '01', description: 'Tiga foto dalam strip Snapbooth.', note: 'Template dari repo',
    slotCount: 3, width: 480, height: 1034, image: '/templates/origin.png', virtualBackground: true, backgrounds: backgroundFiles,
    palette: { background: '#E4E9D1', ink: '#11100E', accent: '#FF7A00', paper: '#E4E9D1', muted: '#635F54' },
    slots: [
      { x: 20, y: 20, width: 440, height: 266 }, { x: 20, y: 306, width: 440, height: 266 },
      { x: 20, y: 592, width: 440, height: 266 },
    ], sampleImages: [sample('snapbooth-kilat-1'), sample('snapbooth-kilat-2'), sample('snapbooth-kilat-3'), sample('snapbooth-kilat-4')],
  },
  {
    id: 'cute-animal', name: 'Cute Animal', index: '02', description: 'Empat foto dengan dekorasi hewan lucu.', note: 'Template baru',
    slotCount: 4, width: 602, height: 1795, image: '/templates/cute-animal.png', virtualBackground: true, backgrounds: backgroundFiles,
    palette: { background: '#ACBFA4', ink: '#262626', accent: '#FF7F11', paper: '#ACBFA4', muted: '#565B51' },
    slots: [
      { x: 43, y: 93, width: 516, height: 364 }, { x: 43, y: 507, width: 516, height: 364 },
      { x: 43, y: 921, width: 516, height: 364 }, { x: 43, y: 1335, width: 516, height: 364 },
    ], sampleImages: [sample('snapbooth-animal-1'), sample('snapbooth-animal-2'), sample('snapbooth-animal-3'), sample('snapbooth-animal-4')],
  },
  {
    id: 'desain-tanpa-judul', name: 'Desain Tanpa Judul', index: '03', description: 'Empat foto dengan dekorasi pita.', note: 'Template baru',
    slotCount: 4, width: 602, height: 1795, image: '/templates/Desain Tanpa Judul.png',
    palette: { background: '#DDF0F2', ink: '#17343A', accent: '#F47E73', paper: '#DDF0F2', muted: '#54777D' },
    slots: [
      { x: 40, y: 60, width: 522, height: 345 }, { x: 40, y: 451, width: 522, height: 345 },
      { x: 40, y: 844, width: 522, height: 345 }, { x: 40, y: 1236, width: 522, height: 345 },
    ], sampleImages: [sample('snapbooth-design-1'), sample('snapbooth-design-2'), sample('snapbooth-design-3'), sample('snapbooth-design-4')],
  },
]

export const DEFAULT_FRAME_ID: FrameId = 'origin'
export function getFrame(id: FrameId): FrameConfig { return FRAMES.find((frame) => frame.id === id) ?? FRAMES[0] }
export function getFrameSlots(id: FrameId): number { return getFrame(id).slotCount }
