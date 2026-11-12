import type { FrameId } from '../types'
import { getFrame } from '../lib/frames'
export function FrameMockup({ frameId, size = 'large' }: { frameId: FrameId; size?: 'small' | 'large' }) {
  const frame = getFrame(frameId)
  return <img className={`strip-art strip-art-${size}`} src={frame.image} alt={`${frame.name}, bingkai strip ${frame.slotCount} foto`} width={frame.width} height={frame.height} style={{ aspectRatio: `${frame.width} / ${frame.height}` }} />
}
