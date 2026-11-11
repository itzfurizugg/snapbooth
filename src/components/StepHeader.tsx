import type { ReactNode } from 'react'

interface StepHeaderProps {
  index: string
  title: string
  lede?: string
  meta?: string
  action?: ReactNode
}

export function StepHeader({ index, title, lede, meta, action }: StepHeaderProps) {
  return (
    <div className="step-header">
      <div className="step-index" aria-hidden="true">
        {index}
      </div>
      <div className="step-titles">
        <h1>{title}</h1>
        {lede && <p>{lede}</p>}
      </div>
      <div className="step-side">
        {meta && <span className="step-meta">{meta}</span>}
        {action}
      </div>
    </div>
  )
}