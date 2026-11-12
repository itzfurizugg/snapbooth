import { ArrowUpRight } from 'lucide-react'
import { Button } from './Button'

export function Landing({ onStart }: { onStart: () => void }) {
  return <div className="landing-page">
    <section className="landing-hero">
      <div className="landing-copy"><p className="eyebrow">Kamera · frame · kenangan</p><h1>Empat jepretan. Satu cerita.</h1><p className="landing-lede">Buat photo strip langsung di browser. Pilih frame, ambil foto, lalu simpan hasil lewat QR.</p><Button size="lg" icon={ArrowUpRight} onClick={onStart}>Mulai sesi</Button><p className="privacy-line">Foto mentah tetap di perangkatmu</p></div>
      <div className="landing-art"><div className="paper-note">KILAS BALIK<br/>DALAM 3…</div><div className="art-index">SB—01 / PHOTO STRIP</div><img src="/templates/origin.png" alt="Contoh hasil strip foto Snapbooth" className="landing-strip" /><span className="registration-mark" aria-hidden="true">+</span><span className="art-caption">Simpan momen, bukan pose sempurna</span></div>
    </section>
    <section className="how-section" id="cara-kerja"><header><span className="eyebrow">Mulai sampai selesai</span><h2>Tiga langkah, tanpa aplikasi</h2></header><ol className="how-steps"><li><span>01</span><div><h3>Pilih frame</h3><p>Tentukan desain strip dan jumlah foto.</p></div></li><li><span>02</span><div><h3>Ambil foto</h3><p>Gunakan kamera perangkat dengan hitung mundur.</p></div></li><li><span>03</span><div><h3>Simpan hasil</h3><p>Pindai QR untuk membuka strip di ponsel.</p></div></li></ol></section>
  </div>
}
