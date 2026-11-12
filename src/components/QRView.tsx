import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, RotateCcw } from 'lucide-react'
import type { SavedStrip } from '../types'
import { generateQrDataUrl } from '../lib/qr'
import { formatRemaining } from '../lib/format'
import { Button, ButtonLink } from './Button'
import { StepHeader } from './StepHeader'

export function QRView({ strip, onFinish }: { strip: SavedStrip; onFinish?: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrError, setQrError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [remaining, setRemaining] = useState(() => formatRemaining(strip.expiresAt))
  useEffect(() => { let cancelled = false; generateQrDataUrl(strip.shareUrl).then((url) => { if (!cancelled) setQrDataUrl(url) }).catch(() => { if (!cancelled) setQrError(true) }); return () => { cancelled = true } }, [strip.shareUrl])
  useEffect(() => { const tick = () => setRemaining(formatRemaining(strip.expiresAt)); tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer) }, [strip.expiresAt])
  async function copyLink() { try { await navigator.clipboard.writeText(strip.shareUrl); setCopied(true); window.setTimeout(() => setCopied(false), 2000) } catch { window.prompt('Salin tautan strip ini:', strip.shareUrl) } }
  return <section className="workflow-page"><StepHeader index="04" title="Strip siap" lede="Pindai QR atau buka tautan untuk mengunduh hasil."/><div className="result-layout"><div className="result-qr-zone"><div className="result-label"><span>PINDAI UNTUK UNDUH</span><span>Berlaku {remaining}</span></div><div className="qr-square">{qrDataUrl && !qrError ? <img src={qrDataUrl} alt="QR menuju halaman unduhan strip"/> : <div className="qr-placeholder" role={qrError ? 'alert' : 'status'}>{qrError ? 'QR gagal dibuat' : <><div className="skeleton skeleton-qr"/>Membuat QR…</>}</div>}</div><code className="result-url">{strip.shareUrl}</code><div className="result-actions"><ButtonLink href={strip.shareUrl} target="_blank" rel="noreferrer" icon={ExternalLink}>Buka unduhan</ButtonLink><Button variant="ghost" icon={copied ? Check : Copy} onClick={() => void copyLink()}>{copied ? 'Tersalin' : 'Salin tautan'}</Button>{onFinish && <Button variant="ghost" icon={RotateCcw} onClick={onFinish}>Sesi baru</Button>}</div></div><div className="result-strip-zone"><span className="eyebrow">Hasil akhir</span><img src={strip.imageUrl} alt="Strip foto yang sudah jadi" className="result-strip"/></div></div></section>
}
