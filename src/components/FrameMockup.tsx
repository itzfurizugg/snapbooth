import type { FrameId } from '../types'
import { getFrame } from '../lib/frames'

interface FrameMockupProps {
  frameId: FrameId
  size?: 'md' | 'lg'
}

export function FrameMockup({ frameId, size = 'lg' }: FrameMockupProps) {
  const frame = getFrame(frameId)
  return (
    <img
      className={`strip-mock strip-mock--${size}`}
      src={frame.image}
      alt={`Preview template ${frame.name}, ${frame.slotCount} foto`}
      width={frame.width}
      height={frame.height}
      style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
    />
  )
}
