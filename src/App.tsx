import { useCallback, useEffect, useState } from 'react'
import type { BoothStep, FrameId, SavedStrip } from './types'
import { Landing } from './components/Landing'
import { SiteHeader } from './components/SiteHeader'
import { FramePicker } from './components/FramePicker'
import { CameraStage } from './components/CameraStage'
import { ReviewStage } from './components/ReviewStage'
import { ProcessingView } from './components/ProcessingView'
import { QRView } from './components/QRView'
import { DownloadPage } from './pages/DownloadPage'
import { DEFAULT_FRAME_ID, getFrameSlots } from './lib/frames'
import { createStripCode, renderStrip } from './lib/canvas'
import { saveStrip } from './lib/storage'

const hasDownloadRoute = /^\/s\/[A-Za-z0-9]+\/?$/.test(window.location.pathname)
const downloadId = hasDownloadRoute ? window.location.pathname.split('/')[2] : null

function App() {
  const [step, setStep] = useState<BoothStep>('intro')
  const [frameId, setFrameId] = useState<FrameId>(DEFAULT_FRAME_ID)
  const [photos, setPhotos] = useState<Array<string | null>>([])
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null)
  const [mirror, setMirror] = useState(false)
  const [saved, setSaved] = useState<SavedStrip | null>(null)
  const [processStage, setProcessStage] = useState(0)
  const [stripCode, setStripCode] = useState('')
  const [processError, setProcessError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStep('intro')
    setFrameId(DEFAULT_FRAME_ID)
    setPhotos([])
    setRetakeIndex(null)
    setMirror(false)
    setSaved(null)
    setProcessStage(0)
    setStripCode('')
    setProcessError(null)
    if (window.location.hash) {
      window.history.replaceState({}, '', window.location.pathname)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    document.title = downloadId ? 'Unduh strip — Snapbooth' : 'Snapbooth — Photobooth di browser'
  }, [])

  function beginCamera() {
    setStripCode(createStripCode())
    setPhotos(Array.from({ length: getFrameSlots(frameId) }, () => null))
    setRetakeIndex(null)
    setStep('camera')
  }

  function completeCapture(nextPhotos: string[]) {
    if (retakeIndex !== null) {
      setPhotos((current) => {
        const next = [...current]
        next[retakeIndex] = nextPhotos[0] ?? next[retakeIndex]
        return next
      })
      setRetakeIndex(null)
      setStep('review')
      return
    }

    setPhotos(Array.from({ length: getFrameSlots(frameId) }, (_, index) => nextPhotos[index] ?? null))
    setStep('review')
  }

  async function makeStrip() {
    setStep('processing')
    setProcessStage(0)
    setProcessError(null)

    try {
      const code = createStripCode()
      setStripCode(code)
      const completedPhotos = photos.filter((photo): photo is string => Boolean(photo))
      const image = await renderStrip(frameId, completedPhotos, { mirror, code, date: new Date() })
      setProcessStage(1)
      const strip = await saveStrip(image, frameId)
      setProcessStage(2)
      setSaved(strip)
      setStep('qr')
    } catch (caught) {
      setProcessError(caught instanceof Error ? caught.message : 'Strip gagal diproses')
      setProcessStage(1)
    }
  }

  let content
  if (downloadId) {
    content = <DownloadPage id={downloadId} />
  } else if (step === 'intro') {
    content = <Landing onStart={() => setStep('frames')} />
  } else if (step === 'frames') {
    content = (
      <FramePicker
        selected={frameId}
        onSelect={setFrameId}
        onBack={() => setStep('intro')}
        onNext={beginCamera}
      />
    )
  } else if (step === 'camera') {
    content = (
      <CameraStage
        key={`${frameId}-${retakeIndex ?? 'all'}`}
        frameId={frameId}
        existing={photos}
        retakeIndex={retakeIndex}
        onComplete={completeCapture}
        onBack={() => setStep(retakeIndex === null ? 'frames' : 'review')}
        onRestart={reset}
      />
    )
  } else if (step === 'review') {
    const code = stripCode || 'BERSIAP'
    content = (
      <ReviewStage
        photos={photos.filter((photo): photo is string => Boolean(photo))}
        frameId={frameId}
        mirror={mirror}
        onToggleMirror={() => setMirror((current) => !current)}
        onRetake={(index) => {
          setRetakeIndex(index)
          setStep('camera')
        }}
        onReset={reset}
        onBack={() => setStep('camera')}
        onSubmit={() => void makeStrip()}
        code={code}
      />
    )
  } else if (step === 'processing') {
    content = (
      <ProcessingView
        stage={processStage}
        content={
          processError ? (
            <div className="process-error" role="alert">
              <strong>STRIP GAGAL DIBUAT</strong>
              <p>{processError}</p>
              <p className="process-error-help">
                Periksa Cloudinary Environment Variables di Vercel, lalu jalankan redeploy jika baru diubah.
              </p>
              <div className="process-error-actions">
                <button type="button" onClick={() => void makeStrip()}>
                  COBA LAGI
                </button>
                <button type="button" onClick={() => setStep('review')}>
                  KEMBALI KE FOTO
                </button>
              </div>
            </div>
          ) : (
            <p>Foto mentah tidak disimpan. Tunggu sebentar, strip sedang dirakit.</p>
          )
        }
      />
    )
  } else {
    content = saved ? <QRView strip={saved} onRestart={reset} /> : <Landing onStart={() => setStep('frames')} />
  }

  if (downloadId) {
    return content
  }

  const showFooter = step !== 'camera' && step !== 'processing'

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="main-content" key={step}>
        {content}
      </main>
      {showFooter && (

      )}
    </div>
  )
}

export default App