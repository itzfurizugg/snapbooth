import { ArrowLeft, RefreshCw } from 'lucide-react'
import type { SavedStrip } from '../types'
import { ProcessingView } from '../components/ProcessingView'
import { QRView } from '../components/QRView'

export function ResultPage({ saved, stage, error, onRetry, onBack, onFinish }: { saved: SavedStrip | null; stage: number; error: string | null; onRetry: () => void; onBack: () => void; onFinish?: () => void }) {
  if (saved) return <QRView strip={saved} onFinish={onFinish}/>
  return <ProcessingView stage={stage} content={error ? <div className="process-error" role="alert"><strong>Strip gagal dibuat</strong><p>{error}</p><p>Pastikan server dan pengaturan Cloudinary tersedia. Strip belum tersimpan.</p><div className="process-error-actions"><button type="button" onClick={onRetry}><RefreshCw size={16}/> Coba lagi</button><button type="button" onClick={onBack}><ArrowLeft size={16}/> Kembali ke edit</button></div></div> : <div className="processing-skeleton" role="status"><div className="skeleton skeleton-wide"/><p>Strip sedang dirakit dan diunggah…</p></div>}/>
}
