import type { ReactNode } from 'react'
export function StepHeader({ index, title, lede, meta, action }: { index: string; title: string; lede?: string; meta?: string; action?: ReactNode }) {
  return <header className="page-heading"><span className="heading-index">{index}</span><div className="heading-copy"><h1>{title}</h1>{lede && <p>{lede}</p>}</div><div className="heading-tools">{meta && <span className="technical-meta">{meta}</span>}{action}</div></header>
}
