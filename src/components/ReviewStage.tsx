import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, RefreshCw, Wand2 } from 'lucide-react'
import type { FrameId } from '../types'
import { getFrame } from '../lib/frames'
import { formatStripDate, renderStrip } from '../lib/canvas'
import { Button } from './Button'
import { StepHeader } from './StepHeader'

interface ReviewStageProps {
  photos: string[]
  frameId: FrameId
  mirror: boolean
  onToggleMirror: () => void
  onRetake: (index: number) => void
  onReset: () => void
  onBack: () => void
  onSubmit: () => void
  code: string
  background: string | null
}

export function ReviewStage({
  photos,
  frameId,
  mirror,
  onToggleMirror,
  onRetake,
  onReset,
  onBack,
  onSubmit,
  code,
  background,
}: ReviewStageProps) {
  const frame = getFrame(frameId)
  const [renderResult, setRenderResult] = useState<{ key: string; preview: string | null; error: string | null; notice: string | null } | null>(null)
  const renderKey = `${frameId}-${mirror}-${code}-${photos.length}-${photos.map((photo) => photo.slice(0, 24)).join('|')}`
  const rendering = renderResult?.key !== renderKey
  const preview = rendering ? null : renderResult.preview
  const error = rendering ? null : renderResult.error
  const segmentationNotice = rendering ? null : renderResult.notice
  const dateLabel = formatStripDate()

  useEffect(() => {
    let cancelled = false
    const render = async () => {
      let processedPhotos = photos
      let segmentationFailed = false
      if (background) {
        try {
          const { segmentPerson } = await import('../lib/segment')
          processedPhotos = await Promise.all(photos.map((photo) => segmentPerson(photo, background)))
        } catch {
          segmentationFailed = true
        }
      }
      const dataUrl = await renderStrip(frameId, processedPhotos, {
        mirror,
        code,
        date: new Date(),
        backgrounds: background && !segmentationFailed ? photos.map(() => background) : [],
      })
      if (!cancelled) {
        setRenderResult({ key: renderKey, preview: dataUrl, error: null, notice: segmentationFailed ? 'Pemisahan latar gagal. Pratinjau memakai foto asli.' : null })
      }
    }

    void render().catch((caught: unknown) => {
      if (!cancelled) {
        setRenderResult({ key: renderKey, preview: null, error: caught instanceof Error ? caught.message : 'Gagal merender strip', notice: null })
      }
    })
    return () => { cancelled = true }
  }, [frameId, photos, mirror, code, renderKey, background])

  return (
    <section className="page-section">
      <StepHeader
        index="03"
        title="PERIKSA HASIL"
        lede="Semua foto tertangkap. Cermati, ganti yang kurang, lalu tutup sesi untuk membuat strip."
        meta={`${frame.name.toUpperCase()} / ${frame.width}×${frame.height}`}
        action={
          <Button variant="ghost" icon={ArrowLeft} iconSide="left" onClick={onBack}>
            KEMBALI
          </Button>
        }
      />

      <div className="review-layout">
        <div className="review-stage">
          {rendering && !error && (
            <div className="skeleton skeleton--strip" role="status" aria-label="Merender strip">
              <span>MERENDER STRIP…</span>
            </div>
          )}
          {error && (
            <div className="review-error" role="alert">
              <AlertCircle aria-hidden="true" size={40} strokeWidth={1.75} />
              <h2>Strip gagal dirender</h2>
              <p>{error}</p>
              <Button icon={RefreshCw} onClick={() => window.location.reload()}>
                MUAT ULANG
              </Button>
            </div>
          )}
          {!rendering && !error && preview && (
            <img src={preview} alt="Pratinjau strip hasil foto" className="review-strip" />
          )}
        </div>

        <aside className="review-side">
          {segmentationNotice && <p className="side-note" role="status">{segmentationNotice}</p>}
          {background && !segmentationNotice && <p className="side-note">Foto dan viewfinder memakai latar pilihan. Pemrosesan berjalan di perangkat ini.</p>}
          <div className="side-block">
            <span className="side-label">SLOT FOTO</span>
            <ul className="shot-list">
              {photos.map((photo, index) => (
                <li key={index} className="shot-row">
                  <span className="shot-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <img src={photo} alt={`Foto ke-${index + 1}`} className="shot-thumb" />
                  <button
                    type="button"
                    className="shot-retake"
                    onClick={() => onRetake(index)}
                    aria-label={`Ulangi foto nomor ${index + 1}`}
                  >
                    ULANG
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="side-block">
            <span className="side-label">PENCERMINAN</span>
            <button
              type="button"
              role="switch"
              aria-checked={mirror}
              data-on={mirror}
              className="switch-row"
              onClick={onToggleMirror}
            >
              <span className="switch-caption">
                <strong>Cerminkan hasil strip</strong>
                <small>Pratinjau kamera sudah dicerminkan. Hasil akhir mengikuti setelan ini.</small>
              </span>
              <span className="switch" aria-hidden="true">
                <span className="switch-knob" />
              </span>
            </button>
          </div>

          <div className="side-block">
            <span className="side-label">STRIP</span>
            <dl className="strip-facts">
              <div>
                <dt>Kode</dt>
                <dd>{code}</dd>
              </div>
              <div>
                <dt>Tanggal</dt>
                <dd>{dateLabel}</dd>
              </div>
              <div>
                <dt>Resolusi</dt>
                <dd>
                  {frame.width}×{frame.height} px
                </dd>
              </div>
            </dl>
          </div>

          <div className="review-actions">
            <Button size="lg" icon={Wand2} onClick={onSubmit} disabled={rendering || Boolean(error)}>
              BUAT STRIP &amp; QR
            </Button>
            <Button variant="danger" icon={RefreshCw} onClick={onReset}>
              ULANGI SEMUA
            </Button>
          </div>
        </aside>
      </div>
    </section>
  )
}