import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  RefreshCw,
  TimerOff,
} from "lucide-react";
import type { SessionState } from "../types";
import { fetchSharedStrip } from "../lib/storage";
import { getFrame } from "../lib/frames";
import { formatRemaining } from "../lib/format";
import { Button, ButtonLink } from "../components/Button";

async function downloadStrip(url: string, id: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unduhan gagal. Coba lagi.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `snapbooth-${id}.png`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
export function DownloadPage({ id }: { id: string }) {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setSession({ status: "loading" });
    try {
      const result = await fetchSharedStrip(id);
      setSession(
        result.state === "ready"
          ? { status: "ready", strip: result.strip }
          : { status: result.state },
      );
    } catch (caught) {
      setSession({
        status: "error",
        message:
          caught instanceof Error ? caught.message : "Terjadi masalah jaringan",
      });
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <main className="download-page">
      <header className="download-masthead">
        <a href="/" className="wordmark">
          Snapbooth<span>/</span>
        </a>
        <span className="eyebrow">Tautan unduhan</span>
      </header>
      {session.status === "loading" && (
        <div className="download-loading" role="status">
          <div className="skeleton skeleton-tall" />
          <div className="skeleton skeleton-wide" />
        </div>
      )}
      {session.status === "ready" && (
        <>
          <header className="download-title">
            <div>
              <span className="eyebrow">Strip foto</span>
              <h1>Kenanganmu, siap disimpan.</h1>
            </div>
            <span className="validity">
              Aktif {formatRemaining(session.strip.expiresAt)}
            </span>
          </header>
          <div className="download-layout">
            <section className="download-art">
              <img
                src={session.strip.imageUrl}
                alt="Strip foto yang sudah jadi"
                className="download-strip"
              />
              <span className="art-caption">SB—{session.strip.id}</span>
            </section>
            <aside className="download-details">
              <div className="download-status">
                <CheckCircle2 size={20} />
                <span>File strip siap diunduh</span>
              </div>
              <dl className="technical-facts">
                <div>
                  <dt>Frame</dt>
                  <dd>{getFrame(session.strip.frameId).name}</dd>
                </div>
                <div>
                  <dt>Dibuat</dt>
                  <dd>Di booth</dd>
                </div>
                <div>
                  <dt>Kode</dt>
                  <dd>{session.strip.id}</dd>
                </div>
              </dl>
              <Button
                size="lg"
                icon={Download}
                className="download-button"
                onClick={() => {
                  setDownloadError(null);
                  void downloadStrip(
                    session.strip.imageUrl,
                    session.strip.id,
                  ).catch((caught: unknown) =>
                    setDownloadError(
                      caught instanceof Error
                        ? caught.message
                        : "Unduhan gagal. Coba lagi.",
                    ),
                  );
                }}
              >
                Unduh strip
              </Button>
              {downloadError && (
                <p role="alert" className="inline-error-text">
                  {downloadError}
                </p>
              )}
              <p className="download-note">
                Simpan salinan sebelum tautan berakhir.
              </p>
              <ButtonLink href="/" variant="ghost" icon={ArrowRight}>
                Buat strip baru
              </ButtonLink>
            </aside>
          </div>
        </>
      )}
      {session.status === "expired" && (
        <div className="download-state" role="alert">
          <TimerOff size={36} />
          <h1>Tautan sudah berakhir</h1>
          <p>Strip ini tidak lagi tersedia lewat tautan tersebut.</p>
          <ButtonLink href="/" icon={ArrowRight}>
            Buat strip baru
          </ButtonLink>
        </div>
      )}
      {session.status === "missing" && (
        <div className="download-state" role="alert">
          <h1>Strip tidak ditemukan</h1>
          <p>Periksa tautan atau minta QR baru dari booth.</p>
          <ButtonLink href="/" icon={ArrowRight}>
            Kembali ke Snapbooth
          </ButtonLink>
        </div>
      )}
      {session.status === "error" && (
        <div className="download-state" role="alert">
          <h1>Strip gagal dimuat</h1>
          <p>{session.message}</p>
          <Button icon={RefreshCw} onClick={() => void load()}>
            Coba lagi
          </Button>
        </div>
      )}
    </main>
  );
}
