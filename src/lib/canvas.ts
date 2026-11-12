import type { FrameId, SlotRect } from "../types";
import { getFrame } from "./frames";
import { drawTextLayer, type TextLayer } from "./textLayers";

interface RenderOptions {
  mirror: boolean;
  backgrounds?: string[];
  name?: string;
  stickers?: TextLayer[];
  code?: string;
  date?: Date;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`Gambar template/foto gagal dimuat: ${src}`));
    image.src = src;
  });
}

export function formatStripDate(date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(/\\./g, "")
    .toUpperCase();
}

export function createStripCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  slot: SlotRect,
  mirror: boolean,
): void {
  const scale = Math.max(
    slot.width / image.naturalWidth,
    slot.height / image.naturalHeight,
  );
  const sourceWidth = slot.width / scale;
  const sourceHeight = slot.height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(slot.x, slot.y, slot.width, slot.height);
  ctx.clip();
  if (mirror) {
    ctx.translate(slot.x + slot.width, slot.y);
    ctx.scale(-1, 1);
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      slot.width,
      slot.height,
    );
  } else {
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      slot.x,
      slot.y,
      slot.width,
      slot.height,
    );
  }
  ctx.restore();
}

export async function renderStrip(
  frameId: FrameId,
  photos: string[],
  options: RenderOptions = { mirror: false },
): Promise<string> {
  const frame = getFrame(frameId);
  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia di browser ini");

  const [overlay, ...images] = await Promise.all([
    loadImage(frame.image),
    ...frame.slots.map(async (_, index) => {
      const photo = photos[index];
      return photo ? loadImage(photo) : null;
    }),
  ]);
  const backgrounds = await Promise.all(
    (options.backgrounds ?? []).map(loadImage),
  );
  frame.slots.forEach((slot, index) => {
    const image = images[index];
    if (image) {
      if (backgrounds[index]) drawCover(ctx, backgrounds[index], slot, false);
      else ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
      drawCover(ctx, image, slot, options.mirror);
    }
  });
  ctx.drawImage(overlay, 0, 0, frame.width, frame.height);
  await document.fonts.ready;
  for (const layer of options.stickers ?? []) drawTextLayer(ctx, layer, frame.width, frame.height);
  return canvas.toDataURL("image/png");
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

export function captureVideoFrame(video: HTMLVideoElement): string {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) throw new Error("Kamera belum siap");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia di browser ini");
  ctx.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.92);
}
