import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import type { SavedStrip } from '../types'
import { generateQrDataUrl } from '../lib/qr'
import { formatRemaining } from '../lib/format'
import { ButtonLink } from './Button'
import { StepHeader } from './StepHeader'

interface QRViewProps {
  strip: SavedStrip
}

export function QRView({ strip }: QRViewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrError, setQrError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [remaining, setRemaining] = useState(() => formatRemaining(strip.expiresAt))

  useEffect(() => {
    let cancelled = false
    generateQrDataUrl(strip.shareUrl)
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl)
      })
      .catch(() => {
        if (!cancelled) setQrError(true)
      })
    return () => {
      cancelled = true
    }
  }, [strip.shareUrl])

  useEffect(() => {
    const tick = () => setRemaining(formatRemaining(strip.expiresAt))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [strip.expiresAt])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(strip.shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Salin tautan strip ini:', strip.shareUrl)
    }
  }

  return (
    <section className="page-section">
      <StepHeader
        index="04"
        title="Bagikan strip"
        lede="Pindai QR dengan ponsel untuk mengunduh strip. Link aktif 24 jam."
      />

      <div className="qr-layout">
        <div className="qr-panel" aria-live="polite">
          <div className="qr-frame">
            {qrDataUrl && !qrError ? (
              <img src={qrDataUrl} alt="QR Code menuju halaman unduhan strip" width={1024} height={1024} />
            ) : (
              <div className="qr-error" role={qrError ? 'alert' : 'status'}>
                <span>{qrError ? 'QR gagal dibuat' : 'Membuat QR…'}</span>
              </div>
            )}
          </div>
          <div className="qr-meta">
            <span>Link berlaku</span>
            <strong>{remaining}</strong>
          </div>
        </div>

        <div className="qr-details">
          <div className="side-block">
            <div className="qr-strip-wrap">
              <img src={strip.imageUrl} alt="Strip fotomu yang sudah jadi" className="qr-strip-img" />
            </div>
          </div>

          <div className="side-block">
            <code className="qr-link">{strip.shareUrl}</code>
            <div className="qr-actions">
              <ButtonLink href={strip.shareUrl} target="_blank" rel="noreferrer" icon={ExternalLink} iconSide="left">
                Buka halaman unduhan
              </ButtonLink>
              <ButtonLink href="#salin" onClick={(event) => { event.preventDefault(); void copyLink() }} icon={copied ? Check : Copy} iconSide="left">
                {copied ? 'Tautan tersalin' : 'Salin tautan'}
              </ButtonLink>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}