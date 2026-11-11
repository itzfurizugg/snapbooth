import type { FrameId } from '../types'
import { getFrame } from '../lib/frames'

interface FrameMockupProps {
  frameId: FrameId
  size?: 'md' | 'lg'
  quiet?: boolean
}

export function FrameMockup({ frameId, size = 'lg', quiet = false }: FrameMockupProps) {
  const frame = getFrame(frameId)
  return (
    <div
      className={[
        'strip-mock',
        `strip-mock--${frame.id}`,
        `strip-mock--${size}`,
        quiet ? 'strip-mock--quiet' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="img"
      aria-label={`Contoh strip frame ${frame.name} dengan ${frame.slotCount} foto`}
    >
      {frame.id === 'bioskop' && <span className="strip-mock__spool" aria-hidden="true" />}
      <div className="strip-mock__slots">
        {frame.sampleImages.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            width={frame.id === 'bioskop' ? 220 : 186}
            height={frame.id === 'bioskop' ? 155 : 124}
          />
        ))}
      </div>
    </div>
  )
}