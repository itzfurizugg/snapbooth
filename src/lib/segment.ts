import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";

const segmenterPromises = new Map<"IMAGE" | "VIDEO", Promise<ImageSegmenter>>();

function getSegmenter(
  runningMode: "IMAGE" | "VIDEO" = "IMAGE",
): Promise<ImageSegmenter> {
  let promise = segmenterPromises.get(runningMode);
  if (!promise) {
    promise = FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm",
    ).then((fileset) =>
      ImageSegmenter.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite",
          delegate: "CPU",
        },
        runningMode,
        outputConfidenceMasks: true,
      }),
    );
    segmenterPromises.set(runningMode, promise);
    promise.catch(() => segmenterPromises.delete(runningMode));
  }
  return promise;
}

function personMask(mask: Float32Array, width: number, height: number): HTMLCanvasElement {
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const sourceCtx = source.getContext("2d", { willReadFrequently: true });
  if (!sourceCtx) throw new Error("Canvas tidak tersedia di browser ini");
  const pixels = sourceCtx.createImageData(width, height);
  for (let i = 0; i < mask.length; i += 1) {
    const value = mask[i] ?? 0;
    const alpha = Math.min(1, Math.max(0, (value - 0.45) / 0.3));
    pixels.data[i * 4] = 255;
    pixels.data[i * 4 + 1] = 255;
    pixels.data[i * 4 + 2] = 255;
    pixels.data[i * 4 + 3] = Math.round(alpha * 255);
  }
  sourceCtx.putImageData(pixels, 0, 0);
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) throw new Error("Canvas tidak tersedia di browser ini");
  maskCtx.imageSmoothingEnabled = true;
  maskCtx.filter = "blur(1px)";
  maskCtx.drawImage(source, 0, 0, width, height);
  return maskCanvas;
}

export async function startBackgroundPreview(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  backgroundUrl: string,
): Promise<() => void> {
  const segmenter = await getSegmenter("VIDEO");
  const background = await loadImage(backgroundUrl);
  let stopped = false;
  let frame = 0;
  let lastSegment = 0;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia di browser ini");
  const foreground = document.createElement("canvas");
  const foregroundCtx = foreground.getContext("2d");
  if (!foregroundCtx) throw new Error("Canvas tidak tersedia di browser ini");
  const render = () => {
    if (stopped) return;
    frame = requestAnimationFrame(render);
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || performance.now() - lastSegment < 66) return;
    lastSegment = performance.now();
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    const result = segmenter.segmentForVideo(video, performance.now());
    const masks = result.confidenceMasks;
    const mask = masks?.[masks.length > 1 ? 1 : 0];
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    if (mask) {
      foreground.width = canvas.width;
      foreground.height = canvas.height;
      foregroundCtx.globalCompositeOperation = "source-over";
      foregroundCtx.clearRect(0, 0, foreground.width, foreground.height);
      foregroundCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
      foregroundCtx.globalCompositeOperation = "destination-in";
      foregroundCtx.drawImage(personMask(mask.getAsFloat32Array(), mask.width, mask.height), 0, 0, canvas.width, canvas.height);
      ctx.drawImage(foreground, 0, 0);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    result.close();
  };
  render();
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
  };
}

export async function segmentPerson(photoUrl: string, backgroundUrl: string): Promise<string> {
  const [segmenter, photo, background] = await Promise.all([
    getSegmenter(),
    loadImage(photoUrl),
    loadImage(backgroundUrl),
  ]);
  const result = segmenter.segment(photo);
  try {
    const masks = result.confidenceMasks;
    const mask = masks?.[masks.length > 1 ? 1 : 0];
    if (!mask) throw new Error("Mask orang tidak tersedia");
    const width = photo.naturalWidth;
    const height = photo.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak tersedia di browser ini");
    ctx.drawImage(background, 0, 0, width, height);
    const foreground = document.createElement("canvas");
    foreground.width = width;
    foreground.height = height;
    const foregroundCtx = foreground.getContext("2d");
    if (!foregroundCtx) throw new Error("Canvas tidak tersedia di browser ini");
    foregroundCtx.drawImage(photo, 0, 0);
    foregroundCtx.globalCompositeOperation = "destination-in";
    foregroundCtx.drawImage(personMask(mask.getAsFloat32Array(), mask.width, mask.height), 0, 0, width, height);
    ctx.drawImage(foreground, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  } finally {
    result.close();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Foto atau background gagal dimuat"));
    image.src = src;
  });
}
