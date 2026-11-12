import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { FrameId } from '../types'
import { FRAMES, getFrame } from '../lib/frames'
import { Button } from './Button'
import { FrameMockup } from './FrameMockup'
import { StepHeader } from './StepHeader'

export function FramePicker({ selected, onSelect, onBack, onNext }: { selected: FrameId; onSelect: (id: FrameId) => void; onBack: () => void; onNext: () => void }) {
  const active = getFrame(selected)
  return <section className="workflow-page"><StepHeader index="01" title="Pilih frame" lede="Pilih desain untuk strip fotomu." meta={`${FRAMES.length} desain`} action={<Button variant="ghost" icon={ArrowLeft} iconSide="left" onClick={onBack}>Kembali</Button>} />
    <div className="frame-workspace"><div className="frame-preview"><div className="preview-label"><span>Pratinjau</span><span>{active.name}</span></div><FrameMockup frameId={active.id} /><p className="preview-spec">{active.slotCount} foto <span>·</span> {active.width} × {active.height} px</p></div>
      <div className="frame-selection"><p className="eyebrow">Pilih tampilan</p><div className="frame-list" role="radiogroup" aria-label="Pilihan frame">{FRAMES.map((frame) => <button key={frame.id} type="button" role="radio" aria-checked={frame.id === selected} className="frame-choice" onClick={() => onSelect(frame.id)}><span className="frame-choice-number">{frame.index}</span><span className="frame-choice-copy"><strong>{frame.name}</strong><small>{frame.slotCount} foto · {frame.description}</small><small>{frame.note}</small></span><span className="frame-choice-mark" aria-hidden="true">{frame.id === selected && <Check size={18}/>}</span></button>)}</div><div className="frame-controls"><span className="technical-meta">PNG · resolusi penuh</span><Button size="lg" icon={ArrowRight} onClick={onNext}>Lanjut ke kamera</Button></div></div></div>
  </section>
}
