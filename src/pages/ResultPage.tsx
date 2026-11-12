import type { SavedStrip } from '../types'
import { ProcessingView } from '../components/ProcessingView'
import { QRView } from '../components/QRView'

interface ResultPageProps {
  saved: SavedStrip | null
  stage: number
  error: string | null
  onRetry: () => void
  onBack: () => void
}

export function ResultPage({ saved, stage, error, onRetry, onBack }: ResultPageProps) {
  if (saved) return <QRView strip={saved} />
  return (
    <ProcessingView
      stage={stage}
      content={error ? (
        <div className="process-error" role="alert">
          <strong>STRIP GAGAL DIBUAT</strong><p>{error}</p>
          <p className="process-error-help">Jalankan backend lokal dengan `vercel dev` dan pastikan Cloudinary Environment Variables tersedia. Strip belum tersimpan; kembali ke foto untuk mencoba lagi.</p>
          <div className="process-error-actions">
            <button type="button" onClick={onRetry}>COBA LAGI</button>
            <button type="button" onClick={onBack}>KEMBALI KE FOTO</button>
          </div>
        </div>
      ) : <p>Foto mentah tidak disimpan. Tunggu sebentar, strip sedang dirakit.</p>}
    />
  )
}
