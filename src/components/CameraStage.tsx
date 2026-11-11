import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, Camera, CameraOff, FlipHorizontal2, RefreshCw } from 'lucide-react'
import type { FrameConfig } from '../types'
import { captureVideoFrame } from '../lib/canvas'
import { getFrame } from '../lib/frames'
import { useCamera } from '../hooks/useCamera'
import { Button } from './Button'
import { StepHeader } from './StepHeader'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface CameraStageProps {
  frameId: FrameConfig['id']
  existing: Array<string | null>
  retakeIndex: number | null
  onComplete: (photos: string[]) => void
  onBack: () => void
  onRestart: () => void
}

export function CameraStage({ frameId, existing, retakeIndex, onComplete, onBack, onRestart }: CameraStageProps) {
  const frame = getFrame(frameId)
  const { videoRef, status, error, facing, start, stop, flip } = useCamera()
  const [photos, setPhotos] = useState<Array<string | null>>(existing)
  const [capturing, setCapturing] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const [fatalError, setFatalError] = useState<string | null>(null)

  const photosRef = useRef(photos)
  const videoRefLatest = useRef(videoRef)
  const aborted = useRef(false)
  const capturingRef = useRef(false)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    void start()
    return () => stop()
  }, [start, stop])

  useEffect(() => {
    return () => {
      aborted.current = true
    }
  }, [])

  const targets = retakeIndex !== null ? [retakeIndex] : frame.slots.map((_, index) => index)

  async function runCapture() {
    if (capturingRef.current || status !== 'ready' || !videoRef.current) return
    capturingRef.current = true
    aborted.current = false
    setCapturing(true)
    setFatalError(null)

    try {
      for (const index of targets) {
        if (aborted.current) return
        for (let second = 3; second >= 1; second -= 1) {
          if (aborted.current) return
          setCountdown(second)
          await wait(1000)
        }
        if (aborted.current) return

        setCountdown(null)
        setFlash(true)
        await wait(140)

        const activeVideo = videoRefLatest.current.current
        if (!activeVideo) throw new Error('Kamera belum siap')
        const data = captureVideoFrame(activeVideo)
        const next = [...photosRef.current]
        next[index] = data
        photosRef.current = next
        setPhotos(next)
        setFlash(false)
        await wait(650)
      }

      if (!aborted.current) {
        const result = photosRef.current.filter((photo): photo is string => Boolean(photo))
        onComplete(result)
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Pengambilan foto gagal'
      setFatalError(message)
    } finally {
      setCapturing(false)
      setCountdown(null)
      setFlash(false)
      capturingRef.current = false
    }
  }

  const runRef = useRef(runCapture)
  useEffect(() => {
    runRef.current = runCapture
  })

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        runRef.current()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const ready = status === 'ready'
  const busy = capturing || status === 'requesting'
  const showCountdown = countdown !== null && capturing
  const title = retakeIndex !== null ? `RETAKS FOTO 0${retakeIndex + 1}` : 'AMBIL FOTO'

  return (
    <section className="page-section">
      <StepHeader
        index="03"
        title={title}
        lede={
          retakeIndex !== null
            ? `Kamera menangkap ulang foto nomor ${retakeIndex + 1}. Empat hitungan mundur, lalu lanjut ke hasil.`
            : 'Tekan tombol besar atau spasi. Kamera berhitung tiga detik lalu menjepret otomatis.'
        }
        meta={`${frame.slotCount} FOTO / ${frame.name.toUpperCase()}`}
        action={
          <Button variant="ghost" icon={ArrowLeft} iconSide="left" onClick={onBack}>
            KEMBALI
          </Button>
        }
      />

      <div className="camera-layout">
        <div className="camera-viewport" data-mirror={facing === 'user'}>
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className="camera-video"
            aria-label="Pratinjau kamera langsung"
          />

          <div className="camera-grid" aria-hidden="true" />
          <div className="camera-cross camera-cross--tl" aria-hidden="true" />
          <div className="camera-cross camera-cross--tr" aria-hidden="true" />
          <div className="camera-cross camera-cross--bl" aria-hidden="true" />
          <div className="camera-cross camera-cross--br" aria-hidden="true" />

          <div className="camera-topbar" aria-live="polite">
            <span className={`cam-label ${ready ? 'cam-label--live' : ''}`}>
              <span className="cam-dot" aria-hidden="true" />
              {ready ? 'LIVE' : status === 'requesting' ? 'MENYALA' : 'SIAGA'}
            </span>
            <span>720P / {frame.slots.length} FRAME</span>
          </div>

          {status === 'error' && error && (
            <div className="camera-error">
              <AlertTriangle aria-hidden="true" size={48} strokeWidth={1.75} />
              <h2>{error.title}</h2>
              <p>{error.message}</p>
              <ol>
                {error.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Button icon={RefreshCw} onClick={() => void start()}>
                COBA LAGI
              </Button>
            </div>
          )}

          {fatalError && (
            <div className="camera-error" role="alert">
              <CameraOff aria-hidden="true" size={48} strokeWidth={1.75} />
              <h2>Gagal mengambil foto</h2>
              <p>{fatalError}</p>
              <Button onClick={() => void runCapture()}>ULANGI</Button>
            </div>
          )}

          {showCountdown && (
            <div className="camera-countdown" aria-live="assertive">
              <span className="countdown-label">BERSIAP</span>
              <span className="countdown-number">{countdown}</span>
              <span className="countdown-hint">JANGAN BERGERAK</span>
            </div>
          )}

          <div className={`camera-flash ${flash ? 'is-on' : ''}`} aria-hidden="true" />

          <div className="camera-controls">
            <Button variant="ghost" icon={FlipHorizontal2} onClick={flip} disabled={busy}>
              GANTI KAMERA
            </Button>
            <Button
              size="lg"
              icon={Camera}
              onClick={() => void runCapture()}
              disabled={!ready || busy}
              className="capture-button"
              aria-label={retakeIndex !== null ? 'Mulai retake foto' : 'Mulai mengambil foto'}
            >
              {capturing ? 'MENJEPRET…' : retakeIndex !== null ? 'RETAKS LAH' : 'MULAI JEPRET'}
            </Button>
            <span className="capture-hint" aria-hidden="true">
              [SPASI]
            </span>
          </div>
        </div>

        <aside className="camera-side">
          <div className="side-block">
            <span className="side-label">FRAME TERPILIH</span>
            <p className="side-frame-name">{frame.name}</p>
            <ul className="shot-list">
              {frame.slots.map((_, index) => {
                const photo = photos[index]
                const isTarget = retakeIndex === index
                return (
                  <li key={index} className={`shot-row ${isTarget ? 'shot-row--active' : ''}`}>
                    <span className="shot-index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {photo ? (
                      <img src={photo} alt={`Hasil sementara foto ${index + 1}`} className="shot-thumb" />
                    ) : (
                      <span className="shot-empty" aria-hidden="true">
                        -
                      </span>
                    )}
                    <span className="shot-state">
                      {photo ? 'TERTANGKAP' : isTarget ? 'DITAGIH' : 'MENUNGGU'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="side-block">
            <span className="side-label">CATATAN</span>
            <p className="side-note">
              Pratinjau dicerminkan seperti kaca. Foto akhir tersimpan apa adanya tanpa pencerminan.
            </p>
            <p className="side-note">
              Foto mentah tidak pernah keluar dari perangkat. Yang diunggah hanya strip jadi, dan hanya jika Anda menutup sesi.
            </p>
          </div>

          <div className="side-block side-block--danger">
            <span className="side-label">ULANGI SEMUA</span>
            <p className="side-note">Semua foto dihapus dan sesi berjalan dari awal.</p>
            <Button variant="danger" onClick={onRestart}>
              BATALKAN &amp; ULANGI
            </Button>
          </div>

          <p className="camera-shortcut">
            <kbd>SPASI</kbd> untuk menjepret tanpa menyentuh layar.
          </p>
        </aside>
      </div>
    </section>
  )
}