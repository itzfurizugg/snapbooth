import type { ReactNode } from 'react'

export const PROCESS_STAGES = ['MERAKIT STRIP', 'MENGUNGGAH FILE', 'MEMBUAT LINK & QR'] as const
export type ProcessStage = (typeof PROCESS_STAGES)[number]

interface ProcessingViewProps {
  stage: number
  content: ReactNode
}

export function ProcessingView({ stage, content }: ProcessingViewProps) {
  const progress = ((stage + 1) / PROCESS_STAGES.length) * 100

  return (
    <section className="processing-view">
      <div className="processing-box">
        <span className="processing-kicker">MEMPROSES SESI</span>
        <ol className="process-stage-list">
          {PROCESS_STAGES.map((label, index) => {
            const state = index < stage ? 'done' : index === stage ? 'active' : 'pending'
            return (
              <li key={label} className={`process-stage process-stage--${state}`}>
                <span className="process-stage__index" aria-hidden="true">
                  {index < stage ? 'OK' : String(index + 1).padStart(2, '0')}
                </span>
                <span>{label}</span>
              </li>
            )
          })}
        </ol>
        <div className="process-bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="process-note">{content}</div>
      </div>
    </section>
  )
}