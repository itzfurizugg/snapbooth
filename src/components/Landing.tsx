import { ArrowUpRight } from "lucide-react";
import { FrameMockup } from "./FrameMockup";
import { Button } from "./Button";

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-copy">
          <h1>Empat jepretan. Satu cerita.</h1>
          <p className="landing-lede">
            Buat photo strip langsung di browser. Pilih frame, ambil foto, lalu
            simpan hasil lewat QR.
          </p>
          <Button size="lg" icon={ArrowUpRight} onClick={onStart}>
            Mulai sesi
          </Button>
        </div>
        <div className="landing-art">
          <div className="paper-note">
            KILAS BALIK
            <br />
            DALAM 3…
          </div>
          <FrameMockup frameId="classc" size="small" />
          <span className="registration-mark" aria-hidden="true">
            +
          </span>
          <span className="art-caption">Simpan momen, bukan pose sempurna</span>
        </div>
      </section>
    </div>
  );
}
