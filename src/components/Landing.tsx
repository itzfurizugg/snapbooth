import { ArrowRight } from 'lucide-react'
import { Button } from './Button'
import { FrameMockup } from './FrameMockup'

interface LandingProps {
  onStart: () => void
}

const HOW = [
  { title: 'Pilih frame', body: 'Pilih salah satu dari tiga frame strip.' },
  { title: 'Ambil foto', body: 'Berpose untuk empat foto otomatis.' },
  { title: 'Pindai QR', body: 'Buka tautan dan unduh strip di ponsel.' },
]

export function Landing({ onStart }: LandingProps) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Foto booth, siap dibawa.</h1>
          <p className="hero-lede">
            Ambil empat foto, pilih frame, lalu unduh strip lewat QR. Foto mentah diproses di browser.
          </p>

          <Button size="lg" icon={ArrowRight} onClick={onStart}>
            Mulai sesi
          </Button>
        </div>

        <div className="hero-visual">
          <FrameMockup frameId="kilat" />
        </div>
      </section>

      <section className="how" id="cara-kerja">
        <div className="how-copy">
          <h2>Tiga langkah, satu strip.</h2>
          <p className="how-lede">Pilih frame, berpose, lalu pindai QR untuk mengunduh foto.</p>
        </div>

        <ol className="how-list">
          {HOW.map((item, index) => (
            <li key={item.title}>
              <span className="how-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="how-step">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}