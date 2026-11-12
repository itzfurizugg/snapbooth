import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CameraOff,
  FlipHorizontal2,
  RefreshCw,
} from "lucide-react";
import type { FrameConfig } from "../types";
import { captureVideoFrame } from "../lib/canvas";
import { getFrame } from "../lib/frames";
import { useCamera } from "../hooks/useCamera";
import { Button } from "./Button";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
interface CameraStageProps {
  frameId: FrameConfig["id"];
  existing: Array<string | null>;
  retakeIndex: number | null;
  background: string | null;
  backgrounds?: string[];
  onBackgroundChange: (url: string | null) => void;
  onComplete: (photos: string[]) => void;
  onBack: () => void;
  onRestart: () => void;
}
export function CameraStage({
  frameId,
  existing,
  retakeIndex,
  background,
  backgrounds,
  onBackgroundChange,
  onComplete,
  onBack,
  onRestart: _onRestart,
}: CameraStageProps) {
  const frame = getFrame(frameId);
  const { videoRef, status, error, facing, start, stop, flip } = useCamera();
  const [photos, setPhotos] = useState<Array<string | null>>(existing);
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [backgroundReady, setBackgroundReady] = useState(false);
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const photosRef = useRef(photos);
  const videoRefLatest = useRef(videoRef);
  const aborted = useRef(false);
  const capturingRef = useRef(false);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => {
    void start();
    return () => stop();
  }, [start, stop]);
  useEffect(
    () => () => {
      aborted.current = true;
    },
    [],
  );
  useEffect(() => {
    let stopPreview: (() => void) | undefined;
    let cancelled = false;
    setBackgroundError(null);
    setBackgroundReady(!background);
    setBackgroundLoading(Boolean(background));
    if (background && videoRef.current && backgroundCanvasRef.current)
      void import("../lib/segment")
        .then(({ startBackgroundPreview }) =>
          startBackgroundPreview(
            videoRef.current!,
            backgroundCanvasRef.current!,
            background,
          ),
        )
        .then((stop) => {
          if (cancelled) stop();
          else {
            stopPreview = stop;
            setBackgroundReady(true);
            setBackgroundLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setBackgroundError(
              "Latar virtual gagal dimuat. Kamera asli tetap tersedia.",
            );
            setBackgroundReady(true);
            setBackgroundLoading(false);
          }
        });
    return () => {
      cancelled = true;
      stopPreview?.();
    };
  }, [background, status]);
  const targets =
    retakeIndex !== null ? [retakeIndex] : frame.slots.map((_, index) => index);
  async function runCapture() {
    if (
      capturingRef.current ||
      status !== "ready" ||
      !videoRef.current ||
      !backgroundReady
    )
      return;
    capturingRef.current = true;
    aborted.current = false;
    setCapturing(true);
    setFatalError(null);
    try {
      for (const index of targets) {
        if (aborted.current) return;
        for (let second = 3; second >= 1; second -= 1) {
          if (aborted.current) return;
          setCountdown(second);
          await wait(1000);
        }
        if (aborted.current) return;
        setCountdown(null);
        setFlash(true);
        await wait(140);
        const activeVideo = videoRefLatest.current.current;
        if (!activeVideo) throw new Error("Kamera belum siap");
        const backgroundCanvas = backgroundCanvasRef.current;
        const data =
          background && backgroundCanvas?.width && backgroundCanvas.height
            ? backgroundCanvas.toDataURL("image/jpeg", 0.92)
            : captureVideoFrame(activeVideo);
        const next = [...photosRef.current];
        next[index] = data;
        photosRef.current = next;
        setPhotos(next);
        setFlash(false);
        await wait(650);
      }
      if (!aborted.current)
        onComplete(
          photosRef.current.filter((photo): photo is string => Boolean(photo)),
        );
    } catch (caught) {
      setFatalError(
        caught instanceof Error ? caught.message : "Pengambilan foto gagal",
      );
    } finally {
      setCapturing(false);
      setCountdown(null);
      setFlash(false);
      capturingRef.current = false;
    }
  }
  const runRef = useRef(runCapture);
  useEffect(() => {
    runRef.current = runCapture;
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        runRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const ready = status === "ready";
  const busy = capturing || status === "requesting";
  return (
    <section className="workflow-page">
      <div className="page-heading">
        <div className="heading-back">
          <Button variant="ghost" icon={ArrowLeft} onClick={onBack} aria-label="Kembali" />
        </div>
        <div className="heading-copy">
          <h1>{retakeIndex !== null ? `Ambil ulang foto ${retakeIndex + 1}` : "Ambil foto"}</h1>
          <p>Atur pose. Kamera mengambil foto setelah hitung mundur.</p>
        </div>
        {/* <div className="heading-tools">
          <span className="technical-meta">{frame.slotCount} foto · {frame.name}</span>
        </div> */}
      </div>
      <div className="capture-layout">
        <section
          className="viewfinder"
          data-mirror={facing === "user"}
          aria-label="Jendela pratinjau kamera"
        >
          <div className="camera-frame-viewport">
            <div
              className="camera-frame-track"
              style={{
                transform: `translateY(calc(-${(frame.slots[Math.min(photos.filter(Boolean).length, frame.slotCount - 1)].y / frame.height) * 100}% + 38px)`,
              }}
            >
              <img
                src={frame.image}
                className="camera-frame-image"
                alt=""
                style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
              />
            </div>
          </div>
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className={`camera-feed ${background ? "feed-hidden" : ""}`}
            aria-label="Pratinjau kamera langsung"
          />
          {background && (
            <canvas
              ref={backgroundCanvasRef}
              className="camera-feed"
              aria-label="Pratinjau kamera dengan latar virtual"
            />
          )}
          {/* <div className="viewfinder-top">
            <span className="camera-status">
              <i />{" "}
              {ready
                ? "Kamera siap"
                : status === "requesting"
                  ? "Mengaktifkan kamera"
                  : "Menunggu kamera"}
            </span>
            <span>
              {photos.filter(Boolean).length} / {frame.slotCount}
            </span>
          </div> */}
          {backgroundLoading && (
            <p className="finder-message" role="status">
              Memuat latar virtual…
            </p>
          )}
          {backgroundError && (
            <p className="finder-message" role="status">
              {backgroundError}
            </p>
          )}
          {status === "error" && error && (
            <div className="camera-alert">
              <AlertTriangle size={32} />
              <h2>{error.title}</h2>
              <p>{error.message}</p>
              <ol>
                {error.steps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <Button icon={RefreshCw} onClick={() => void start()}>
                Coba lagi
              </Button>
            </div>
          )}
          {fatalError && (
            <div className="camera-alert" role="alert">
              <CameraOff size={32} />
              <h2>Foto tidak tersimpan</h2>
              <p>{fatalError}</p>
              <Button onClick={() => void runCapture()}>Coba lagi</Button>
            </div>
          )}
          {countdown !== null && (
            <div className="countdown-screen" aria-live="assertive">
              <span>Siap?</span>
              <strong>{countdown}</strong>
              <small>Jangan bergerak</small>
            </div>
          )}
          <div
            className={`capture-flash ${flash ? "flash-on" : ""}`}
            aria-hidden="true"
          />
          <div className="finder-controls">
            <Button
              variant="ghost"
              icon={FlipHorizontal2}
              onClick={flip}
              disabled={busy}
            >
              Balik kamera
            </Button>
            <Button
              size="lg"
              icon={Camera}
              onClick={() => void runCapture()}
              disabled={!ready || busy || !backgroundReady}
            >
              {capturing
                ? "Mengambil foto…"
                : backgroundLoading
                  ? "Memuat latar…"
                  : retakeIndex !== null
                    ? "Ambil ulang"
                    : "Ambil foto"}
            </Button>
          </div>
        </section>
        <aside className="capture-rail">
          <div className="rail-heading">
            <span className="eyebrow">Urutan foto</span>
            <span className="technical-meta">{frame.name}</span>
          </div>
          <ol className="capture-queue">
            {frame.slots.map((_, index) => (
              <li
                key={index}
                className={retakeIndex === index ? "queue-active" : ""}
              >
                <span className="queue-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {photos[index] ? (
                  <img
                    src={photos[index]!}
                    alt={`Pratinjau foto ${index + 1}`}
                  />
                ) : (
                  <span className="queue-empty" aria-hidden="true">
                    +
                  </span>
                )}
                <span>
                  {photos[index]
                    ? "Tersimpan"
                    : retakeIndex === index
                      ? "Ambil ulang"
                      : "Belum diambil"}
                </span>
              </li>
            ))}
          </ol>
          <p className="keyboard-note">
            Tekan <kbd>spasi</kbd> untuk menjepret
          </p>
          {backgrounds && (
            <fieldset className="background-picker" aria-label="Pilih latar kamera">
              <button
                type="button"
                className="background-choice"
                aria-pressed={!background}
                onClick={() => onBackgroundChange(null)}
              >
                <span className="background-original">Asli</span>
              </button>
              {backgrounds.map((url) => (
                <button
                  type="button"
                  className="background-choice"
                  key={url}
                  aria-pressed={background === url}
                  onClick={() => onBackgroundChange(url)}
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </fieldset>
          )}
        </aside>
      </div>
    </section>
  );
}
