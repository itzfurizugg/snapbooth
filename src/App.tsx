import { useCallback, useEffect, useState } from 'react'
import type { BoothStep, FrameId, SavedStrip } from './types'
import { Landing } from './components/Landing'
import { SiteHeader } from './components/SiteHeader'
import { FramePage } from './pages/frame'
import { ShotPage } from './pages/shot'
import { EditPage } from './pages/edit'
import { ResultPage } from './pages/ResultPage'
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
  const [background, setBackground] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedStrip | null>(null)
  const [processStage, setProcessStage] = useState(0)
  const [stripCode, setStripCode] = useState('')
  const [processError, setProcessError] = useState<string | null>(null)
  const [flowReady, setFlowReady] = useState(false)

  const reset = useCallback(() => {
    setStep('intro')
    setFrameId(DEFAULT_FRAME_ID)
    setPhotos([])
    setRetakeIndex(null)
    setMirror(false)
    setBackground(null)
    setSaved(null)
    setProcessStage(0)
    setStripCode('')
    setProcessError(null)
    sessionStorage.removeItem('snapbooth-flow')
    if (window.location.hash) {
      window.history.replaceState({}, '', window.location.pathname)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    document.title = downloadId ? 'Unduh strip — Snapbooth' : 'Snapbooth — Photobooth di browser'
    const savedFlow = sessionStorage.getItem('snapbooth-flow')
    if (savedFlow) {
      try {
        const flow = JSON.parse(savedFlow) as { step: BoothStep; frameId: FrameId; photos: Array<string | null>; mirror: boolean; background: string | null; saved: SavedStrip | null; stripCode: string }
        if (['intro', 'frames', 'camera', 'review', 'processing', 'qr'].includes(flow.step)) {
          setStep(flow.step === 'camera' || flow.step === 'review' || flow.step === 'processing' ? 'frames' : flow.step)
          setFrameId(flow.frameId)
          setPhotos(flow.photos)
          setMirror(flow.mirror)
          setBackground(flow.background)
          setSaved(flow.saved)
          setStripCode(flow.stripCode)
        }
      } catch {
        sessionStorage.removeItem('snapbooth-flow')
      }
    }
    setFlowReady(true)
  }, [])

  useEffect(() => {
    if (flowReady && !downloadId) sessionStorage.setItem('snapbooth-flow', JSON.stringify({ step, frameId, photos, mirror, background, saved, stripCode }))
  }, [flowReady, step, frameId, photos, mirror, background, saved, stripCode])

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
      const image = await renderStrip(frameId, completedPhotos, {
        mirror,
        code,
        date: new Date(),
        backgrounds: background ? completedPhotos.map(() => background) : [],
      })
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
  if (!flowReady && !downloadId) return null
  if (downloadId) {
    content = <DownloadPage id={downloadId} />
  } else if (step === 'intro') {
    content = <Landing onStart={() => setStep('frames')} />
  } else if (step === 'frames') {
    content = (
      <FramePage
        selected={frameId}
        onSelect={(id) => { setFrameId(id); setBackground(null) }}
        onBack={() => setStep('intro')}
        onNext={beginCamera}
      />
    )
  } else if (step === 'camera') {
    content = (
      <ShotPage
        frameId={frameId}
        photos={photos}
        retakeIndex={retakeIndex}
        background={background}
        onComplete={completeCapture}
        onBackgroundChange={setBackground}
        onBack={() => setStep(retakeIndex === null ? 'frames' : 'review')}
        onRestart={reset}
      />
    )
  } else if (step === 'review') {
    const code = stripCode || 'BERSIAP'
    content = (
      <EditPage
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
        background={background}
      />
    )
  } else if (step === 'processing') {
    content = <ResultPage saved={null} stage={processStage} error={processError} onRetry={() => void makeStrip()} onBack={() => setStep('review')} />
  } else {
    content = <ResultPage saved={saved} stage={2} error={null} onRetry={() => void makeStrip()} onBack={() => setStep('review')} />
  }

  if (downloadId) {
    return content
  }

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="main-content" key={step}>
        {content}
      </main>
    </div>
  )
}

export default App