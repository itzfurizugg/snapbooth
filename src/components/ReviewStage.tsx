import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, RefreshCw, Wand2 } from 'lucide-react'
import type { FrameId } from '../types'
import { getFrame } from '../lib/frames'
import { formatStripDate, renderStrip } from '../lib/canvas'
import { Button } from './Button'
import { StepHeader } from './StepHeader'

interface ReviewStageProps { photos: string[]; frameId: FrameId; mirror: boolean; onToggleMirror: () => void; onRetake: (index: number) => void; onReset: () => void; onBack: () => void; onSubmit: () => void; code: string; background: string | null }
export function ReviewStage({ photos, frameId, mirror, onToggleMirror, onRetake, onReset, onBack, onSubmit, code, background }: ReviewStageProps) {
  const frame = getFrame(frameId)
  const [result, setResult] = useState<{ key: string; preview: string | null; error: string | null; notice: string | null } | null>(null)
  const renderKey = `${frameId}-${mirror}-${code}-${photos.length}-${photos.map((photo) => photo.slice(0, 24)).join('|')}`
  const rendering = result?.key !== renderKey
  const preview = rendering ? null : result.preview
  const error = rendering ? null : result.error
  const notice = rendering ? null : result.notice
  useEffect(() => {
    let cancelled = false
    const render = async () => {
      let processedPhotos = photos; let segmentationFailed = false
      if (background) try { const { segmentPerson } = await import('../lib/segment'); processedPhotos = await Promise.all(photos.map((photo) => segmentPerson(photo, background))) } catch { segmentationFailed = true }
      const dataUrl = await renderStrip(frameId, processedPhotos, { mirror, code, date: new Date(), backgrounds: background && !segmentationFailed ? photos.map(() => background) : [] })
      if (!cancelled) setResult({ key: renderKey, preview: dataUrl, error: null, notice: segmentationFailed ? 'Pemisahan latar gagal. Pratinjau memakai foto asli.' : null })
    }
    void render().catch((caught: unknown) => { if (!cancelled) setResult({ key: renderKey, preview: null, error: caught instanceof Error ? caught.message : 'Gagal merender strip', notice: null }) })
    return () => { cancelled = true }
  }, [frameId, photos, mirror, code, renderKey, background])
  return <section className="workflow-page"><StepHeader index="03" title="Periksa strip" lede="Ambil ulang foto yang ingin diganti sebelum membuat hasil akhir." meta={`${frame.name} · ${frame.width} × ${frame.height} px`} action={<Button variant="ghost" icon={ArrowLeft} iconSide="left" onClick={onBack}>Kembali</Button>} />
    <div className="edit-layout"><section className="strip-canvas" aria-label="Pratinjau hasil strip">{rendering && !error && <div className="skeleton skeleton-strip" role="status">Merender strip…</div>}{error && <div className="inline-error" role="alert"><AlertCircle size={32}/><h2>Strip gagal dirender</h2><p>{error}</p><Button icon={RefreshCw} onClick={() => window.location.reload()}>Muat ulang</Button></div>}{!rendering && !error && preview && <img src={preview} alt="Pratinjau strip hasil foto" className="rendered-strip"/>}</section>
      <aside className="edit-rail">{notice && <p className="notice" role="status">{notice}</p>}{background && !notice && <p className="notice">Latar pilihan diproses di perangkat ini.</p>}<div className="photo-edit-list"><div className="rail-heading"><span className="eyebrow">Foto dalam strip</span><span className="technical-meta">{photos.length} foto</span></div>{photos.map((photo, index) => <div key={index} className="edit-photo"><span>{String(index + 1).padStart(2, '0')}</span><img src={photo} alt={`Foto ke-${index + 1}`}/><button type="button" onClick={() => onRetake(index)} aria-label={`Ambil ulang foto ${index + 1}`}>Ambil ulang</button></div>)}</div>
        <button type="button" role="switch" aria-checked={mirror} data-on={mirror} className="mirror-setting" onClick={onToggleMirror}><span><strong>Cerminkan strip</strong><small>Balik arah foto hasil</small></span><span className="switch-track" aria-hidden="true"><i/></span></button>
        <dl className="technical-facts"><div><dt>Kode</dt><dd>{code}</dd></div><div><dt>Tanggal</dt><dd>{formatStripDate()}</dd></div><div><dt>Resolusi</dt><dd>{frame.width} × {frame.height} px</dd></div></dl>
        <div className="edit-actions"><Button size="lg" icon={Wand2} onClick={onSubmit} disabled={rendering || Boolean(error)}>Buat strip dan QR</Button><Button variant="danger" onClick={onReset}>Buang foto dan mulai lagi</Button></div></aside></div>
  </section>
}
