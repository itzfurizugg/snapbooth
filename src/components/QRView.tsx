import { useEffect, useState } from 'react'
import { Check, Copy, Download, ExternalLink, RefreshCw, Smartphone } from 'lucide-react'
import type { SavedStrip } from '../types'
import { generateQrDataUrl } from '../lib/qr'
import { formatRemaining } from '../lib/format'
import { Button, ButtonLink } from './Button'
import { StepHeader } from './StepHeader'

interface QRViewProps {
  strip: SavedStrip
  onRestart: () => void
}

export function QRView({ strip, onRestart }: QRViewProps) {
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
        title="BAGIKAN STRIP"
        lede="Scan kode di ponsel untuk membuka halaman unduhan. Link aktif selama 24 jam sejak strip dibuat."
        meta={`ID ${strip.id.toUpperCase()}`}
        action={
          <Button variant="ghost" icon={RefreshCw} onClick={onRestart}>
            SESI BARU
          </Button>
        }
      />

      <div className="qr-layout">
        <div className="qr-panel" aria-live="polite">
          <span className="qr-caption">SCAN UNTUK SIMPAN</span>
          <div className="qr-frame">
            {qrDataUrl && !qrError ? (
              <img src={qrDataUrl} alt="QR Code menuju halaman unduhan strip" width={1024} height={1024} />
            ) : (
              <div className="qr-error">
                <Smartphone aria-hidden="true" size={40} strokeWidth={1.75} />
                <span>{qrError ? 'QR gagal dibuat' : 'Membuat QR…'}</span>
              </div>
            )}
          </div>
          <div className="qr-meta">
            <span>SCAN DENGAN KAMERA PONSEL</span>
            <strong>{remaining}</strong>
          </div>
          <p className="qr-note">
            File tersimpan di Cloudinary. Link strip aktif 24 jam; URL gambar bertanda tangan berlaku 1 jam.
          </p>
        </div>

        <div className="qr-details">
          <div className="side-block">
            <span className="side-label">HASIL STRIP</span>
            <div className="qr-strip-wrap">
              <img src={strip.imageUrl} alt="Strip fotomu yang sudah jadi" className="qr-strip-img" />
            </div>
          </div>

          <div className="side-block">
            <span className="side-label">TAUTAN</span>
            <code className="qr-link">{strip.shareUrl}</code>
            <div className="qr-actions">
              <ButtonLink href={strip.shareUrl} target="_blank" rel="noreferrer" icon={ExternalLink} iconSide="left">
                BUKA HALAMAN
              </ButtonLink>
              <Button variant="ghost" icon={copied ? Check : Copy} onClick={() => void copyLink()}>
                {copied ? 'TERSALIN' : 'SALIN LINK'}
              </Button>
              <a href={strip.imageUrl} download={`snapbooth-${strip.id}.png`} className="btn btn--paper btn--md">
                <Download aria-hidden="true" size={18} strokeWidth={2} />
                <span>UNDUH DI SINI</span>
              </a>
            </div>
          </div>

          <div className="side-block side-block--yellow">
            <strong>Strip ini kedaluwarsa dalam {remaining}.</strong>
            <p>Link aktif 24 jam. Simpan strip sekarang; file dapat tetap tersimpan di Cloudinary setelah link kedaluwarsa.</p>
            <Button variant="dark" onClick={onRestart}>
              MULAI SESI BARU
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}