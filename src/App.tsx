import { useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import type { BoothStep, FrameId, SavedStrip } from "./types";
import { LandingPage } from "./pages/landing";
import { FramePage } from "./pages/frame";
import { ShotPage } from "./pages/shot";
import { EditPage } from "./pages/edit";
import { ResultPage } from "./pages/ResultPage";
import { DownloadPage } from "./pages/DownloadPage";
import { DEFAULT_FRAME_ID, getFrameSlots } from "./lib/frames";
import { createStripCode, renderStrip } from "./lib/canvas";
import type { TextLayer } from "./lib/textLayers";
import { saveStrip } from "./lib/storage";

function DownloadRoute() {
  const { id = "" } = useParams();
  return <DownloadPage id={id} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="masthead">
        <a href="/" className="wordmark">
          Snapbooth<span aria-hidden="true">/</span>
        </a>
        {/* <a className="masthead-note" href="/#cara-kerja">
          Photobooth di browser
        </a> */}
      </header>
      <main className="main-content">{children}</main>
      <footer className="site-footer">
      </footer>
    </div>
  );
}

function BoothApp() {
  const navigate = useNavigate();
  const editorTest = import.meta.env.DEV && new URLSearchParams(window.location.search).has("editor-test");
  const testPhotos = editorTest ? ["#FF7F11", "#ACBFA4", "#E2E8CE"].map((color, index) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="440"><rect width="100%" height="100%" fill="${color}"/><text x="320" y="230" text-anchor="middle" fill="#262626" font-family="sans-serif" font-size="42">FOTO ${index + 1}</text></svg>`)}`) : [];
  const [step, setStep] = useState<BoothStep>(editorTest ? "review" : "intro");
  const [frameId, setFrameId] = useState<FrameId>(DEFAULT_FRAME_ID);
  const [photos, setPhotos] = useState<Array<string | null>>(testPhotos);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const [mirror, setMirror] = useState(false);
  const [background, setBackground] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedStrip | null>(null);
  const [processStage, setProcessStage] = useState(0);
  const [stripCode, setStripCode] = useState("");
  const [stickers, setStickers] = useState<TextLayer[]>([]);
  const [processError, setProcessError] = useState<string | null>(null);
  const [flowReady, setFlowReady] = useState(false);

  const reset = useCallback(() => {
    setStep("intro");
    navigate("/");
    setFrameId(DEFAULT_FRAME_ID);
    setPhotos([]);
    setRetakeIndex(null);
    setMirror(false);
    setBackground(null);
    setSaved(null);
    setProcessStage(0);
    setStripCode("");
    setStickers([]);
    setProcessError(null);
    setFlowReady(true);
    sessionStorage.removeItem("snapbooth-flow");
    if (window.location.hash)
      window.history.replaceState({}, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate]);

  useEffect(() => {
    document.title = "Snapbooth — Photobooth di browser";
    if (editorTest) {
      setStripCode("TEST");
      setStickers([]);
      setFlowReady(true);
      return;
    }
    const savedFlow = sessionStorage.getItem("snapbooth-flow");
    if (savedFlow) {
      try {
        const flow = JSON.parse(savedFlow) as {
          step: BoothStep;
          frameId: FrameId;
          photos: Array<string | null>;
          mirror: boolean;
          background: string | null;
          saved: SavedStrip | null;
          stripCode: string;
        };
        if (
          ["intro", "frames", "camera", "review", "processing", "qr"].includes(
            flow.step,
          )
        ) {
          setStep(flow.step);
          setFrameId(flow.frameId);
          setPhotos(flow.photos);
          setMirror(flow.mirror);
          setBackground(flow.background);
          setSaved(flow.saved);
          setStripCode(flow.stripCode);
        }
      } catch {
        sessionStorage.removeItem("snapbooth-flow");
      }
    }
    setFlowReady(true);
  }, [navigate, editorTest]);

  useEffect(() => {
    if (!flowReady) return;
    sessionStorage.setItem(
      "snapbooth-flow",
      JSON.stringify({
        step,
        frameId,
        photos,
        mirror,
        background,
        saved,
        stripCode,
        stickers,
      }),
    );
    const path: Record<BoothStep, string> = {
      intro: "/",
      frames: "/frame",
      camera: "/shot",
      review: "/edit",
      processing: "/result",
      qr: "/result",
    };
    if (window.location.pathname !== path[step])
      navigate(path[step], { replace: true });
  }, [
    flowReady,
    step,
    frameId,
    photos,
    mirror,
    background,
    saved,
    stripCode,
    stickers,
    navigate,
    editorTest,
  ]);

  function beginCamera() {
    setStripCode(createStripCode());
    setPhotos(Array.from({ length: getFrameSlots(frameId) }, () => null));
    setRetakeIndex(null);
    setStep("camera");
  }
  function completeCapture(nextPhotos: string[]) {
    if (retakeIndex !== null) {
      setPhotos((current) => {
        const next = [...current];
        next[retakeIndex] = nextPhotos[0] ?? next[retakeIndex];
        return next;
      });
      setRetakeIndex(null);
      setStep("review");
      return;
    }
    setPhotos(
      Array.from(
        { length: getFrameSlots(frameId) },
        (_, index) => nextPhotos[index] ?? null,
      ),
    );
    setStep("review");
  }
  async function makeStrip() {
    setStep("processing");
    setProcessStage(0);
    setProcessError(null);
    try {
      const code = createStripCode();
      setStripCode(code);
      const completedPhotos = photos.filter((photo): photo is string =>
        Boolean(photo),
      );
      const image = await renderStrip(frameId, completedPhotos, {
        mirror,
        code,
        stickers,
        date: new Date(),
        backgrounds: background ? completedPhotos.map(() => background) : [],
      });
      setProcessStage(1);
      const strip = await saveStrip(image, frameId);
      setProcessStage(2);
      setSaved(strip);
      setStep("qr");
    } catch (caught) {
      setProcessError(
        caught instanceof Error ? caught.message : "Strip gagal diproses",
      );
      setProcessStage(1);
    }
  }

  if (!flowReady)
    return (
      <Shell>
        <div className="loading-page" role="status">
          <div className="skeleton skeleton-wide" />
          <div className="skeleton skeleton-tall" />
        </div>
      </Shell>
    );
  let content;
  if (step === "intro")
    content = <LandingPage onStart={() => setStep("frames")} />;
  else if (step === "frames")
    content = (
      <FramePage
        selected={frameId}
        onSelect={(id) => {
          setFrameId(id);
          setBackground(null);
        }}
        onBack={() => setStep("intro")}
        onNext={beginCamera}
      />
    );
  else if (step === "camera")
    content = (
      <ShotPage
        frameId={frameId}
        photos={photos}
        retakeIndex={retakeIndex}
        background={background}
        onComplete={completeCapture}
        onBackgroundChange={setBackground}
        onBack={() => setStep(retakeIndex === null ? "frames" : "review")}
        onRestart={reset}
      />
    );
  else if (step === "review")
    content = (
      <EditPage
        photos={photos.filter((photo): photo is string => Boolean(photo))}
        frameId={frameId}
        mirror={mirror}
        onToggleMirror={() => setMirror((current) => !current)}
        onRetake={(index) => {
          setRetakeIndex(index);
          setStep("camera");
        }}
        onReset={reset}
        onBack={() => setStep("camera")}
        onSubmit={() => void makeStrip()}
        onStickerChange={setStickers}
        initialStickers={stickers}
        code={stripCode || "BERSIAP"}
        background={background}
      />
    );
  else if (step === "processing")
    content = (
      <ResultPage
        saved={null}
        stage={processStage}
        error={processError}
        onRetry={() => void makeStrip()}
        onBack={() => setStep("review")}
        onFinish={reset}
      />
    );
  else
    content = (
      <ResultPage
        saved={saved}
        stage={2}
        error={null}
        onRetry={() => void makeStrip()}
        onBack={() => setStep("review")}
        onFinish={reset}
      />
    );
  return <Shell key={step}>{content}</Shell>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/s/:id" element={<DownloadRoute />} />
        <Route path="/" element={<BoothApp />} />
        <Route path="/frame" element={<BoothApp />} />
        <Route path="/shot" element={<BoothApp />} />
        <Route path="/edit" element={<BoothApp />} />
        <Route path="/result" element={<BoothApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
