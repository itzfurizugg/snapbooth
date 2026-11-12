import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Download, RefreshCw, TimerOff } from 'lucide-react'
import type { SessionState } from '../types'
import { fetchSharedStrip } from '../lib/storage'
import { getFrame } from '../lib/frames'
import { formatRemaining } from '../lib/format'
import { Button, ButtonLink } from '../components/Button'

interface DownloadPageProps {
  id: string
}

async function downloadStrip(url: string, id: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Unduhan gagal. Coba lagi.')
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = `snapbooth-${id}.png`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export function DownloadPage({ id }: DownloadPageProps) {
  const [session, setSession] = useState<SessionState>({ status: 'loading' })
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setSession({ status: 'loading' })
    try {
      const result = await fetchSharedStrip(id)
      if (result.state === 'ready') {
        setSession({ status: 'ready', strip: result.strip })
      } else {
        setSession({ status: result.state })
      }
    } catch (caught) {
      setSession({
        status: 'error',
        message: caught instanceof Error ? caught.message : 'Terjadi masalah jaringan',
      })
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <main className="download-page">
      <div className="download-head">
        <div>
          <span className="download-eyebrow">SNAPBOOTH / HASIL SCAN</span>
          <h1>{session.status === 'ready' ? 'STRIP ANDA' : 'MEMUAT STRIP'}</h1>
        </div>
        <a className="download-brand" href="/">
          MULAI DI BOOTH LAGI
        </a>
      </div>

      {session.status === 'loading' && (
        <div className="download-loading">
          <div className="skeleton skeleton--strip" role="status" aria-label="Memuat strip">
            <span>MEMUATΓÇª</span>
          </div>
          <div className="skeleton skeleton--copy" aria-hidden="true" />
        </div>
      )}

      {session.status === 'ready' && (
        <div className="download-layout">
          <div className="download-visual">
            <img src={session.strip.imageUrl} alt="Strip fotomu yang sudah jadi" className="download-strip" />
          </div>

          <div className="download-info">
            <div className="download-status">
              <CheckCircle2 aria-hidden="true" size={20} strokeWidth={2} />
              <span>Strip ini aktif {formatRemaining(session.strip.expiresAt)} lagi.</span>
            </div>

            <dl className="download-facts">
              <div>
                <dt>FRAME</dt>
                <dd>{getFrame(session.strip.frameId).name.toUpperCase()}</dd>
              </div>
              <div>
                <dt>DIBUAT</dt>
                <dd>BARU SAJA DI BOOTH</dd>
              </div>
              <div>
                <dt>KODE</dt>
                <dd>{session.strip.id.toUpperCase()}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => {
                setDownloadError(null)
                void downloadStrip(session.strip.imageUrl, session.strip.id).catch((error: unknown) => {
                  setDownloadError(error instanceof Error ? error.message : 'Unduhan gagal. Coba lagi.')
                })
              }}
              className="btn btn--primary btn--lg download-cta"
            >
              <Download aria-hidden="true" size={20} strokeWidth={2} />
              <span>UNDUH STRIP</span>
            </button>
            {downloadError && <p role="alert">{downloadError}</p>}

            <p className="download-note">
              File strip tersimpan di Cloudinary. Unduh dan simpan salinan sebelum masa aktif berakhir.
            </p>

            <ButtonLink href="/" icon={ArrowRight}>
              BUAT STRIP BARU
            </ButtonLink>
          </div>
        </div>
      )}

      {session.status === 'expired' && (
        <div className="download-state" role="alert">
          <TimerOff aria-hidden="true" size={48} strokeWidth={1.75} />
          <h2>LINK INI KEDALUWARSA</h2>
          <p>Link strip sudah tidak berlaku. File mungkin tetap tersimpan di Cloudinary.</p>
          <ButtonLink href="/" icon={ArrowRight}>
            BUAT STRIP BARU
          </ButtonLink>
        </div>
      )}

      {session.status === 'missing' && (
        <div className="download-state">
          <h2>LINK TIDAK DITEMUKAN</h2>
          <p>Kode ini tidak dikenali. Bisa jadi salah scan atau alamat tidak lengkap.</p>
          <ButtonLink href="/" icon={ArrowRight}>
            BUAT STRIP BARU
          </ButtonLink>
        </div>
      )}

      {session.status === 'error' && (
        <div className="download-state" role="alert">
          <h2>GAGAL MEMUAT STRIP</h2>
          <p>{session.message}</p>
          <Button icon={RefreshCw} onClick={() => void load()}>
            COBA LAGI
          </Button>
        </div>
      )}
    </main>
  )
}
