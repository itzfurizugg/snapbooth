import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, RefreshCw, Wand2, Type, Trash2 } from "lucide-react";
import type { FrameId } from "../types";
import { getFrame } from "../lib/frames";
import { formatStripDate, renderStrip } from "../lib/canvas";
import { TEXT_COLORS, type TextLayer, type TextFont, type TextBackground, type TextAlign } from "../lib/textLayers";
import { Button } from "./Button";

interface ReviewStageProps {
  photos: string[]; frameId: FrameId; mirror: boolean; onToggleMirror: () => void;
  onRetake: (index: number) => void; onReset: () => void; onBack: () => void;
  onSubmit: () => void; onStickerChange: (stickers: TextLayer[]) => void;
  initialStickers: TextLayer[]; code: string; background: string | null;
}
const BASE_LAYER = (id: string): TextLayer => ({ id, text: "", x: .5, y: .5, scale: 1, rotation: 0, color: "#E2E8CE", fontStyle: "bold", background: "translucent", align: "center" });

export function ReviewStage({ photos, frameId, mirror, onToggleMirror, onRetake, onReset, onBack, onSubmit, onStickerChange, initialStickers, code, background }: ReviewStageProps) {
  const frame = getFrame(frameId);
  const [layers, setLayers] = useState<TextLayer[]>(initialStickers);
  const [selected, setSelected] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [dragging, setDragging] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const selectedLayer = layers.find((layer) => layer.id === selected);
  const [result, setResult] = useState<{ key: string; preview: string | null; error: string | null; notice: string | null } | null>(null);
  const renderKey = `${frameId}-${mirror}-${code}-${photos.length}-${photos.map((photo) => photo.slice(0, 24)).join("|")}`;
  const rendering = result?.key !== renderKey;
  const preview = rendering ? null : result.preview;
  const error = rendering ? null : result.error;
  const notice = rendering ? null : result.notice;
  const update = (next: TextLayer[]) => { setLayers(next); onStickerChange(next); };
  const finishTyping = () => {
    if (!selectedLayer) { setTyping(false); return; }
    const next = selectedLayer.text.trim() ? layers : layers.filter((layer) => layer.id !== selectedLayer.id);
    update(next); setTyping(false); if (!selectedLayer.text.trim()) setSelected(null);
  };
  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      let processedPhotos = photos;
      let segmentationFailed = false;
      if (background) try {
        const { segmentPerson } = await import("../lib/segment");
        processedPhotos = await Promise.all(photos.map((photo) => segmentPerson(photo, background)));
      } catch { segmentationFailed = true; }
      const dataUrl = await renderStrip(frameId, processedPhotos, { mirror, code, date: new Date(), backgrounds: background && !segmentationFailed ? photos.map(() => background) : [] });
      if (!cancelled) setResult({ key: renderKey, preview: dataUrl, error: null, notice: segmentationFailed ? "Pemisahan latar gagal. Pratinjau memakai foto asli." : null });
    };
    void render().catch((caught: unknown) => { if (!cancelled) setResult({ key: renderKey, preview: null, error: caught instanceof Error ? caught.message : "Gagal merender strip", notice: null }); });
    return () => { cancelled = true; };
  }, [frameId, photos, mirror, code, renderKey, background]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (typing && event.key === "Escape") { event.preventDefault(); finishTyping(); }
      if (!typing && selected && (event.key === "Delete" || event.key === "Backspace") && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault(); update(layers.filter((layer) => layer.id !== selected)); setSelected(null);
      }
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  });
  const addLayer = () => {
    if (layers.length >= 3 || !stripRef.current) return;
    const id = crypto.randomUUID(); const next = [...layers, BASE_LAYER(id)];
    update(next); setSelected(id); setTyping(true);
  };
  const changeSelected = (patch: Partial<TextLayer>) => { if (selected) update(layers.map((layer) => layer.id === selected ? { ...layer, ...patch } : layer)); };
  const setText = (id: string, text: string) => update(layers.map((layer) => layer.id === id ? { ...layer, text: text.slice(0, 60) } : layer));
  const fontFamily = (font: TextFont) => font === "mono" ? "ui-monospace, monospace" : '"Funnel Display", system-ui, sans-serif';
  return <section className="workflow-page">
    <div className="page-heading"><div className="heading-back"><Button variant="ghost" icon={ArrowLeft} onClick={onBack} aria-label="Kembali" /></div><div className="heading-copy"><h1>Periksa strip</h1><p>Ambil ulang foto yang ingin diganti sebelum membuat hasil akhir.</p></div></div>
    <div className="edit-layout">
      <section className="strip-canvas" aria-label="Pratinjau hasil strip">
        {rendering && !error && <div className="skeleton skeleton-strip" role="status">Merender strip…</div>}
        {error && <div className="inline-error" role="alert"><AlertCircle size={32} /><h2>Strip gagal dirender</h2><p>{error}</p><Button icon={RefreshCw} onClick={() => window.location.reload()}>Muat ulang</Button></div>}
        {!rendering && !error && preview && <div className="sticker-preview-wrap">
          <div className="sticker-preview" ref={stripRef} onPointerDown={(event) => { if (event.target === event.currentTarget || (event.target as HTMLElement).classList.contains("rendered-strip")) { if (typing) finishTyping(); else setSelected(null); } }}>
            <img src={preview} alt="Pratinjau strip hasil foto" className="rendered-strip" />
            {layers.map((layer) => <div key={layer.id} className={`text-layer ${selected === layer.id ? "is-selected" : ""} ${typing && selected === layer.id ? "is-typing" : ""}`} style={{ left: `${layer.x * 100}%`, top: `${layer.y * 100}%`, transform: `translate(-50%, -50%) rotate(${layer.rotation}rad) scale(${layer.scale})`, color: layer.background === "none" ? layer.color : layer.color === "#262626" || layer.color === "#ACBFA4" ? "#E2E8CE" : "#262626", background: layer.background === "solid" ? layer.color : layer.background === "translucent" ? `${layer.color}CC` : "transparent", fontFamily: fontFamily(layer.fontStyle), fontWeight: layer.fontStyle === "bold" ? 700 : 400, textAlign: layer.align }}>
              {typing && selected === layer.id ? <textarea aria-label="Teks di strip" rows={Math.max(1, layer.text.split("\n").length)} maxLength={60} value={layer.text} onChange={(event) => setText(layer.id, event.target.value)} onBlur={finishTyping} autoFocus /> : <button type="button" aria-label={`Teks: ${layer.text || "teks baru"}. Ketuk untuk memilih atau mengedit`} onClick={() => { if (selected === layer.id) setTyping(true); else setSelected(layer.id); }} onWheel={(event) => { if (event.ctrlKey || event.altKey) { event.preventDefault(); changeSelected({ scale: Math.max(.4, Math.min(3, layer.scale + (event.deltaY < 0 ? .08 : -.08))) }); } }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); pointerStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId }; setSelected(layer.id); setDragging(true); }} onPointerMove={(event) => { if (!dragging || pointerStart.current?.id !== event.pointerId || !stripRef.current) return; const rect = stripRef.current.getBoundingClientRect(); const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)); const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)); changeSelected({ x: Math.abs(x - .5) < .025 ? .5 : x, y: Math.abs(y - .5) < .025 ? .5 : y }); }} onPointerUp={() => { setDragging(false); pointerStart.current = null; }} onDoubleClick={() => setTyping(true)}>{layer.text || "Ketik di sini"}</button>}
            </div>)}
            {dragging && <div className="text-delete-zone"><Trash2 size={18} /> Lepas untuk hapus</div>}
          </div>
          <div className="text-tools">
            <button className="add-text-button" type="button" onClick={addLayer} disabled={layers.length >= 3} title={layers.length >= 3 ? "Batas 3 teks tercapai" : "Tambah teks"}><Type size={20} /> Tambah teks <span>{layers.length}/3</span></button>
            {selectedLayer && <div className="text-style-toolbar" aria-label="Gaya teks">
              <select aria-label="Gaya font" value={selectedLayer.fontStyle} onChange={(event) => changeSelected({ fontStyle: event.target.value as TextFont })}><option value="bold">Tebal</option><option value="light">Tipis</option><option value="mono">Ketikan</option></select>
              <div className="text-swatches">{TEXT_COLORS.map((color) => <button key={color} type="button" aria-label={`Warna ${color}`} className={selectedLayer.color === color ? "active" : ""} style={{ background: color }} onClick={() => changeSelected({ color })} />)}</div>
              <select aria-label="Latar teks" value={selectedLayer.background} onChange={(event) => changeSelected({ background: event.target.value as TextBackground })}><option value="none">Tanpa latar</option><option value="solid">Latar solid</option><option value="translucent">Sorot</option></select>
              <select aria-label="Perataan teks" value={selectedLayer.align} onChange={(event) => changeSelected({ align: event.target.value as TextAlign })}><option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option></select>
              <label>Ukuran <input aria-label="Ukuran teks" type="range" min=".5" max="2.5" step=".05" value={selectedLayer.scale} onChange={(event) => changeSelected({ scale: Number(event.target.value) })} /></label>
              <label>Putar <input aria-label="Putar teks" type="range" min={-180} max={180} value={selectedLayer.rotation * 180 / Math.PI} onChange={(event) => changeSelected({ rotation: Number(event.target.value) * Math.PI / 180 })} /></label>
              {typing && <button type="button" onClick={finishTyping}>Selesai</button>}
            </div>}
            <p className="text-limit-note">{layers.length >= 3 ? "Batas 3 teks tercapai." : "Pilih teks untuk mengubah gaya; seret untuk memindahkan."}</p>
          </div>
        </div>}
      </section>
      <aside className="edit-rail">{notice && <p className="notice" role="status">{notice}</p>}
        <div className="photo-edit-list"><div className="rail-heading"><span className="eyebrow">Foto dalam strip</span><span className="technical-meta">{photos.length} foto</span></div>{photos.map((photo, index) => <div key={index} className="edit-photo"><span>{String(index + 1).padStart(2, "0")}</span><img src={photo} alt={`Foto ke-${index + 1}`} /><button type="button" onClick={() => onRetake(index)} aria-label={`Ambil ulang foto ${index + 1}`}>Ambil ulang</button></div>)}</div>
        <button type="button" role="switch" aria-checked={mirror} data-on={mirror} className="mirror-setting" onClick={onToggleMirror}><span><strong>Cerminkan strip</strong><small>Balik arah foto hasil</small></span><span className="switch-track" aria-hidden="true"><i /></span></button>
        <dl className="technical-facts"><div><dt>Kode</dt><dd>{code}</dd></div><div><dt>Tanggal</dt><dd>{formatStripDate()}</dd></div><div><dt>Resolusi</dt><dd>{frame.width} × {frame.height} px</dd></div></dl>
        <div className="edit-actions"><Button size="lg" icon={Wand2} onClick={onSubmit} disabled={rendering || Boolean(error) || typing}>Buat strip dan QR</Button><Button variant="danger" onClick={onReset}>Buang foto dan mulai lagi</Button></div>
      </aside>
    </div>
  </section>;
}
