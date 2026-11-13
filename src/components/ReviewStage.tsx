import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, RefreshCw, Wand2, Type, Trash2, Bold, CaseUpper } from "lucide-react";
import type { FrameId } from "../types";
import { getFrame } from "../lib/frames";
import { formatStripDate, renderStrip } from "../lib/canvas";
import { TEXT_COLORS, type TextLayer, type TextFont } from "../lib/textLayers";
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
  const [layers, setLayers] = useState<TextLayer[]>(() => initialStickers.filter((layer) => layer.text.trim()));
  const [selected, setSelected] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [dragging, setDragging] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ layerId: string; distance: number; angle: number; scale: number; rotation: number } | null>(null);
  const [snapX, setSnapX] = useState(false);
  const [snapY, setSnapY] = useState(false);
  const [overDelete, setOverDelete] = useState(false);
  const typingRef = useRef<HTMLTextAreaElement>(null);
  const selectedLayer = layers.find((layer) => layer.id === selected);
  const [result, setResult] = useState<{ key: string; preview: string | null; error: string | null; notice: string | null } | null>(null);
  const renderKey = `${frameId}-${mirror}-${code}-${photos.length}-${photos.map((photo) => photo.slice(0, 48)).join("|")}`;
  const [preview, setPreview] = useState<string | null>(null);
  const rendering = result?.key !== renderKey;
  const error = rendering ? null : result.error;
  const notice = rendering ? null : result.notice;
  const update = (next: TextLayer[]) => { const visible = next.filter((layer) => layer.text.trim()); setLayers(next); onStickerChange(visible); };
  const deleteLayer = (id: string) => { update(layers.filter((layer) => layer.id !== id)); setSelected(null); };
  const finishTyping = () => {
    if (!selectedLayer) { setTyping(false); return; }
    const next = selectedLayer.text.trim() ? layers : layers.filter((layer) => layer.id !== selectedLayer.id);
    update(next); setTyping(false); if (!selectedLayer.text.trim()) setSelected(null);
  };
  const cancelTyping = () => {
    if (selectedLayer && !selectedLayer.text.trim()) deleteLayer(selectedLayer.id);
    setTyping(false);
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
      if (!cancelled) { setPreview(dataUrl); setResult({ key: renderKey, preview: dataUrl, error: null, notice: segmentationFailed ? "Pemisahan latar gagal. Pratinjau memakai foto asli." : null }); }
    };
    void render().catch((caught: unknown) => { if (!cancelled) setResult({ key: renderKey, preview: null, error: caught instanceof Error ? caught.message : "Gagal merender strip", notice: null }); });
    return () => { cancelled = true; };
  }, [frameId, photos, mirror, code, renderKey, background]);
  useEffect(() => {
    if (!typing) return;
    const viewport = window.visualViewport;
    const adjust = () => {
      const editor = typingRef.current;
      if (!editor || !viewport) return;
      const rect = editor.getBoundingClientRect();
      const visibleBottom = viewport.offsetTop + viewport.height - 24;
      if (rect.bottom > visibleBottom) stripRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    viewport?.addEventListener("resize", adjust);
    viewport?.addEventListener("scroll", adjust);
    adjust();
    return () => { viewport?.removeEventListener("resize", adjust); viewport?.removeEventListener("scroll", adjust); };
  }, [typing]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (typing && event.key === "Escape") { event.preventDefault(); cancelTyping(); }
      if (!typing && selected && (event.key === "Delete" || event.key === "Backspace") && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault(); update(layers.filter((layer) => layer.id !== selected)); setSelected(null);
      }
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  });
  const addLayer = () => {
    if (layers.length >= 3 || !stripRef.current) return;
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; const next = [...layers, { ...BASE_LAYER(id), x: 0.5, y: 0.42 }];
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
          <div className={`text-tools ${typing ? "is-typing" : ""}`}>
            {typing ? <div className="text-typing-bar">
              <div className="text-style-toolbar" aria-label="Gaya teks">
                <button type="button" className="style-cycle" aria-label="Ganti gaya font" onClick={() => selectedLayer && changeSelected({ fontStyle: selectedLayer.fontStyle === "bold" ? "light" : selectedLayer.fontStyle === "light" ? "mono" : "bold" })}><Bold size={18} /></button>
                <button type="button" className="style-cycle" aria-label="Ganti latar teks" onClick={() => selectedLayer && changeSelected({ background: selectedLayer.background === "none" ? "solid" : selectedLayer.background === "solid" ? "translucent" : "none" })}><CaseUpper size={18} /></button>
                <div className="text-swatches">{TEXT_COLORS.map((color) => <button key={color} type="button" aria-label={`Warna ${color}`} className={selectedLayer?.color === color ? "active" : ""} style={{ background: color }} onClick={() => changeSelected({ color })} />)}</div>
              </div>
              <button className="text-done-button" type="button" onPointerDown={(event) => event.preventDefault()} onClick={finishTyping}>Selesai</button>
            </div> : <div className="text-toolbar-row">
              <button className="add-text-button" type="button" onClick={addLayer} disabled={layers.filter((layer) => layer.text.trim()).length >= 3} title={layers.filter((layer) => layer.text.trim()).length >= 3 ? "Batas 3 teks tercapai" : "Tambah teks"}><Type size={18} /> Tambah teks <span>{layers.filter((layer) => layer.text.trim()).length}/3</span></button>
            </div>}
            {selectedLayer && !typing && <label className="text-size-control"><span>Ukuran</span><input aria-label="Ukuran teks" type="range" min=".5" max="2.5" step=".05" value={selectedLayer.scale} onChange={(event) => changeSelected({ scale: Number(event.target.value) })} /></label>}
          </div>
          <div className={`sticker-preview sticker-preview-${frameId}`} ref={stripRef} onPointerDown={(event) => { if (event.target === event.currentTarget || (event.target as HTMLElement).classList.contains("rendered-strip")) { if (typing) finishTyping(); else setSelected(null); }} }>
            <img src={preview} alt="Pratinjau strip hasil foto" className="rendered-strip" />
            {snapX && <div className="text-snap-guide snap-x" aria-hidden="true" />}{snapY && <div className="text-snap-guide snap-y" aria-hidden="true" />}
            {layers.map((layer) => <div key={layer.id} className={`text-layer ${selected === layer.id ? "is-selected" : ""} ${typing && selected === layer.id ? "is-typing" : ""}`} style={{ left: `${layer.x * 100}%`, top: `${layer.y * 100}%`, fontSize: `${48 * layer.scale / frame.width * 100}cqw`, transform: `translate(-50%, -50%) rotate(${layer.rotation}rad)`, color: layer.background === "none" ? layer.color : layer.color === "#262626" || layer.color === "#ACBFA4" ? "#E2E8CE" : "#262626", background: layer.background === "solid" ? layer.color : layer.background === "translucent" ? `${layer.color}CC` : "transparent", fontFamily: fontFamily(layer.fontStyle), fontWeight: layer.fontStyle === "bold" ? 700 : 400, textAlign: layer.align }}>
              {typing && selected === layer.id ? <textarea ref={typingRef} aria-label="Teks di strip" placeholder="Ketik di sini" rows={Math.max(1, layer.text.split("\n").length)} maxLength={60} value={layer.text} onChange={(event) => setText(layer.id, event.target.value)} autoFocus /> : <button type="button" aria-label={`Teks: ${layer.text || "teks baru"}. Ketuk untuk memilih atau mengedit`} onClick={() => { if (selected === layer.id) setTyping(true); else setSelected(layer.id); }} onWheel={(event) => { if (event.ctrlKey || event.altKey) { event.preventDefault(); changeSelected({ scale: Math.max(.4, Math.min(3, layer.scale + (event.deltaY < 0 ? .08 : -.08))) }); } }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY }); setSelected(layer.id); setDragging(true); setTyping(false); }} onPointerMove={(event) => { const old = pointers.current.get(event.pointerId); if (!old || !stripRef.current) return; pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY }); const rect = stripRef.current.getBoundingClientRect(); const points = [...pointers.current.values()]; if (points.length >= 2) { const [a, b] = points; const dx = b.x - a.x; const dy = b.y - a.y; const distance = Math.hypot(dx, dy); const angle = Math.atan2(dy, dx); const current = layers.find((item) => item.id === layer.id); if (!current) return; if (!gesture.current || gesture.current.layerId !== layer.id) gesture.current = { layerId: layer.id, distance, angle, scale: current.scale, rotation: current.rotation }; changeSelected({ scale: Math.max(.4, Math.min(3, gesture.current.scale * distance / Math.max(1, gesture.current.distance))), rotation: gesture.current.rotation + angle - gesture.current.angle }); return; } const point = pointers.current.get(event.pointerId)!; const x = Math.max(0, Math.min(1, (point.x - rect.left) / rect.width)); const y = Math.max(0, Math.min(1, (point.y - rect.top) / rect.height)); const centerX = Math.abs(x - .5) < .025; const centerY = Math.abs(y - .5) < .025; setSnapX(centerX); setSnapY(centerY); const deleteRect = stripRef.current.querySelector(".text-delete-zone")?.getBoundingClientRect(); const deleting = Boolean(deleteRect && event.clientY >= deleteRect.top && event.clientY <= deleteRect.bottom && event.clientX >= deleteRect.left && event.clientX <= deleteRect.right); setOverDelete(deleting); changeSelected({ x: centerX ? .5 : x, y: centerY ? .5 : y }); }} onPointerUp={(event) => { pointers.current.delete(event.pointerId); if (pointers.current.size < 2) gesture.current = null; if (pointers.current.size === 0) { setDragging(false); if (overDelete) deleteLayer(layer.id); setOverDelete(false); setSnapX(false); setSnapY(false); } }} onDoubleClick={() => setTyping(true)}>{layer.text || "Ketik di sini"}</button>}
            </div>)}
            {selectedLayer && !typing && <button type="button" className="text-rotate-handle" aria-label="Putar teks dengan menyeret" onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); const box = stripRef.current?.getBoundingClientRect(); if (!box) return; event.currentTarget.dataset.origin = `${box.left + selectedLayer.x * box.width},${box.top + selectedLayer.y * box.height}`; }} onPointerMove={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) return; const [x, y] = (event.currentTarget.dataset.origin || "0,0").split(",").map(Number); changeSelected({ rotation: Math.atan2(event.clientY - y, event.clientX - x) + Math.PI / 4 }); }}><span /></button>}
            {dragging && <div className={`text-delete-zone ${overDelete ? "is-over" : ""}`}><Trash2 size={18} /> Lepas untuk hapus</div>}
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
