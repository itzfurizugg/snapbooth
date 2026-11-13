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
type Filter = "none" | "bw" | "newjeans" | "sketch";
function applyFilter(ctx: CanvasRenderingContext2D, filter: Filter) {
  if (filter === "bw") ctx.filter = "grayscale(1) contrast(1.12)";
  else if (filter === "newjeans") ctx.filter = "grayscale(1) contrast(1.35) brightness(1.12)";
  else if (filter === "sketch") ctx.filter = "grayscale(1) contrast(2.4) brightness(1.18)";
}
function paintFilter(ctx: CanvasRenderingContext2D, source: CanvasImageSource, width: number, height: number, filter: Filter) {
  applyFilter(ctx, filter);
  ctx.drawImage(source, 0, 0, width, height);
  ctx.filter = "none";
  if (filter === "newjeans") {
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const blockSize = Math.max(3, Math.round(width / 180));
    const palette = [[244, 245, 250], [167, 177, 211], [91, 103, 158], [29, 39, 91]];
    for (let y = 0; y < height; y += blockSize) for (let x = 0; x < width; x += blockSize) {
      const i = (y * width + x) * 4;
      const luminance = ((pixels[i] ?? 0) * .299 + (pixels[i + 1] ?? 0) * .587 + (pixels[i + 2] ?? 0) * .114) / 255;
      const [r, g, b] = palette[Math.min(3, Math.floor((1 - luminance) * 4))];
      ctx.fillStyle = `rgb(${r} ${g} ${b})`;
      ctx.fillRect(x, y, blockSize, blockSize);
    }
  } else if (filter === "sketch") {
    ctx.globalCompositeOperation = "multiply";
    ctx.strokeStyle = "rgba(60,60,60,.28)";
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += Math.max(6, Math.round(height / 70))) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y + 3); ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }
}
function filteredPhoto(source: HTMLVideoElement | HTMLCanvasElement, filter: Filter): string {
  const canvas = document.createElement("canvas");
  canvas.width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  canvas.height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia di browser ini");
  paintFilter(ctx, source, canvas.width, canvas.height, filter);
  return canvas.toDataURL("image/jpeg", 0.92);
}
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
  const [filter, setFilter] = useState<Filter>("none");
  const filterCanvasRef = useRef<HTMLCanvasElement | null>(null);
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
  useEffect(() => {
    if (background || !videoRef.current || !filterCanvasRef.current) return;
    const video = videoRef.current;
    const canvas = filterCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    let raf = 0;
    let stopped = false;
    const draw = () => {
      if (stopped) return;
      raf = requestAnimationFrame(draw);
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      if (filter === "none") ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      else paintFilter(ctx, video, canvas.width, canvas.height, filter);
    };
    draw();
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }, [filter, background, status]);
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
        const filteredCanvas = filterCanvasRef.current;
        const source = background && backgroundCanvas?.width && backgroundCanvas.height ? backgroundCanvas : filteredCanvas?.width && filteredCanvas.height ? filteredCanvas : activeVideo;
        const data = filter === "none"
          ? source instanceof HTMLVideoElement ? captureVideoFrame(source) : source.toDataURL("image/jpeg", 0.92)
          : filteredPhoto(source, filter);
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
          data-filter={filter}
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
          {!background && <canvas ref={filterCanvasRef} className="camera-feed" aria-label="Pratinjau kamera dengan filter" />}
          {background && (
            <canvas
              ref={backgroundCanvasRef}
              className="camera-feed"
              style={{ filter: "none" }}
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
          <fieldset className="background-picker filter-picker" disabled={busy} aria-label="Pilih filter">
            <legend>Filter</legend>
            {([ ["none", "Asli"], ["bw", "B&W"], ["newjeans", "NJS"], ["sketch", "Sketch"] ] as const).map(([value, label]) => (
              <button key={value} type="button" className="background-choice" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>
            ))}
          </fieldset>
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
