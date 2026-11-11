import { ArrowDown, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from './Button'
import { FrameMockup } from './FrameMockup'

interface LandingProps {
  onStart: () => void
}

const HOW: Array<{ index: string; title: string; body: string }> = [
  {
    index: '01',
    title: 'HIDUPKAN KAMERA',
    body: 'Klik mulai, beri izin kamera sekali. Pratinjau tampil seperti kaca: kiri dan kanan sudah dibalik.',
  },
  {
    index: '02',
    title: 'JEPRET OTOMATIS',
    body: 'Tiga hitungan, satu kilat, foto masuk sendiri ke frame. Empat pose, tanpa harus balik-balik menekan tombol.',
  },
  {
    index: '03',
    title: 'SCAN & SIMPAN',
    body: 'Strip jadi, muncul QR. Ponsel teman scan, file langsung kebawa tanpa kabel, aplikasi, atau akun.',
  },
]

export function Landing({ onStart }: LandingProps) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            WEB PHOTOBOOTH / TANPA INSTAL
          </p>
          <h1>
            JEPRET<span className="hero-tick">.</span>
            <br />
            <span className="hero-accent">SUSUN.</span>
            <br />
            BAGIKAN<span className="hero-tick">.</span>
            <br />
            <span className="hero-outline">SELESAI.</span>
          </h1>
          <p className="hero-lede">
            Empat foto, satu strip siap dibagikan lewat QR. Semua diproses di browser, tidak ada akun dan tidak ada
            kabel.
          </p>

          <div className="hero-actions">
            <Button size="lg" icon={ArrowRight} onClick={onStart}>
              MULAI SESI
            </Button>
            <a className="under-link" href="#cara-kerja">
              CARA KERJA
              <ArrowDown aria-hidden="true" size={16} strokeWidth={2} />
            </a>
          </div>

          <ul className="hero-facts" aria-label="Fakta cepat">
            <li>
              <strong>4</strong>
              <span>FOTO</span>
            </li>
            <li>
              <strong>3</strong>
              <span>FRAME</span>
            </li>
            <li>
              <strong>24</strong>
              <span>JAM LINK</span>
            </li>
          </ul>
        </div>

        <div className="hero-visual">
          <span className="visual-tag visual-tag--top">HASIL AKHIR / 720×1920 PX</span>
          <div className="hero-strip">
            <FrameMockup frameId="kilat" />
          </div>
          <span className="visual-tag visual-tag--side">
            SCAN &amp; SIMPAN
            <ArrowRight aria-hidden="true" size={14} strokeWidth={2.5} />
          </span>
          <span className="visual-stamp">GRATIS / TANPA AKUN</span>
          <span className="crop-mark crop-mark--tl" aria-hidden="true" />
          <span className="crop-mark crop-mark--tr" aria-hidden="true" />
          <span className="crop-mark crop-mark--bl" aria-hidden="true" />
          <span className="crop-mark crop-mark--br" aria-hidden="true" />
        </div>
      </section>

      <section className="how" id="cara-kerja">
        <div className="how-copy">
          <p className="section-kicker">
            <span className="kicker-index" aria-hidden="true">
              02
            </span>
            CARA KERJA
          </p>
          <h2>Langkahnya tiga, hasilnya satu.</h2>
          <p className="how-lede">
            Booth berdiri di laptop atau tablet. Tamu cukup berdiri, berpose, dan pulang dengan foto di ponsel masing.
          </p>
          <Button variant="dark" icon={ArrowRight} onClick={onStart}>
            BUKA BOOTH
          </Button>
        </div>

        <ol className="how-list">
          {HOW.map((item) => (
            <li key={item.index}>
              <span className="how-index" aria-hidden="true">
                {item.index}
              </span>
              <div className="how-step">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="privacy-band">
        <div className="privacy-inner">
          <span className="privacy-icon" aria-hidden="true">
            <ShieldCheck size={28} strokeWidth={2} />
          </span>
          <p>
            Foto mentah <strong>tidak pernah meninggalkan perangkat</strong>.
          </p>
          <small>Yang diunggah hanya strip jadi, dan otomatis dihapus 24 jam kemudian.</small>
        </div>
      </section>
    </>
  )
}