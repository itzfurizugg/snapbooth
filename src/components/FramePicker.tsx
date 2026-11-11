import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { FrameId } from '../types'
import { FRAMES, getFrame } from '../lib/frames'
import { Button } from './Button'
import { FrameMockup } from './FrameMockup'
import { StepHeader } from './StepHeader'

interface FramePickerProps {
  selected: FrameId
  onSelect: (id: FrameId) => void
  onBack: () => void
  onNext: () => void
}

export function FramePicker({ selected, onSelect, onBack, onNext }: FramePickerProps) {
  const active = getFrame(selected)

  return (
    <section className="page-section">
      <StepHeader
        index="02"
        title="PILIH FRAME"
        lede="Template tidak mengubah foto Anda. Foto tetap utuh, bingkai yang berganti."
        meta={`${FRAMES.length} TEMPLATE / PNG`}
        action={
          <Button variant="ghost" icon={ArrowLeft} iconSide="left" onClick={onBack}>
            KEMBALI
          </Button>
        }
      />

      <div className="picker-layout">
        <div className="frame-stage">
          <span className="stage-label">PREVIEW / {active.name.toUpperCase()}</span>
          <FrameMockup frameId={active.id} />
          <span className="stage-output">
            OUTPUT {active.width}×{active.height} PX / PNG
          </span>
        </div>

        <div className="frame-options" role="radiogroup" aria-label="Pilihan template frame">
          {FRAMES.map((frame) => {
            const isSelected = frame.id === selected
            return (
              <button
                key={frame.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className="frame-option"
                onClick={() => onSelect(frame.id)}
              >
                <span className="frame-option__index" aria-hidden="true">
                  {frame.index}
                </span>
                <span className="frame-option__body">
                  <strong>{frame.name}</strong>
                  <small>
                    {frame.slotCount} FOTO · {frame.description}
                  </small>
                  <em>{frame.note}</em>
                </span>
                <span className="frame-option__check" aria-hidden="true">
                  {isSelected && <Check size={18} strokeWidth={2.5} />}
                </span>
              </button>
            )
          })}

          <p className="frame-hint">
            Frame berpola sama dipakai semua sesi. Ingin frame berbeda untuk tiap sesi? Itu ada di versi berikutnya.
          </p>
        </div>
      </div>

      <div className="picker-actions">
        <span className="picker-facts">4 FOTO / COUNTDOWN 3 DETIK / LINK 24 JAM</span>
        <Button size="lg" icon={ArrowRight} onClick={onNext}>
          LANJUT KE KAMERA
        </Button>
      </div>
    </section>
  )
}