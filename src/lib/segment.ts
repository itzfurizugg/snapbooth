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
  const person = document.createElement("canvas");
  const personCtx = person.getContext("2d");
  const ctx = canvas.getContext("2d");
  if (!ctx || !personCtx)
    throw new Error("Canvas tidak tersedia di browser ini");

  const render = () => {
    if (stopped) return;
    frame = requestAnimationFrame(render);
    if (
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      performance.now() - lastSegment < 66
    )
      return;
    lastSegment = performance.now();
    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    const result = segmenter.segmentForVideo(video, performance.now());
    const mask =
      result.confidenceMasks?.[result.confidenceMasks.length > 1 ? 1 : 0];
    if (!mask) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      person.width = mask.width;
      person.height = mask.height;
      personCtx.drawImage(video, 0, 0, person.width, person.height);
      const pixels = personCtx.getImageData(0, 0, person.width, person.height);
      const confidence = mask.getAsFloat32Array();
      for (let i = 0; i < confidence.length; i += 1) {
        const alpha = Math.min(
          1,
          Math.max(0, ((confidence[i] ?? 0) - 0.15) / 0.7),
        );
        pixels.data[i * 4 + 3] = Math.round(
          alpha * alpha * (3 - 2 * alpha) * 255,
        );
      }
      personCtx.putImageData(pixels, 0, 0);
      ctx.drawImage(person, 0, 0, canvas.width, canvas.height);
    }
    result.close();
  };
  render();
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
  };
}

export async function segmentPerson(
  photoUrl: string,
  backgroundUrl: string,
): Promise<string> {
  const [segmenter, photo, background] = await Promise.all([
    getSegmenter(),
    loadImage(photoUrl),
    loadImage(backgroundUrl),
  ]);
  const result = segmenter.segment(photo);
  const masks = result.confidenceMasks;
  const mask = masks?.[masks.length > 1 ? 1 : 0];
  if (!mask) {
    result.close();
    throw new Error("Mask orang tidak tersedia");
  }

  const width = photo.naturalWidth;
  const height = photo.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    result.close();
    throw new Error("Canvas tidak tersedia di browser ini");
  }

  ctx.drawImage(background, 0, 0, width, height);
  const person = document.createElement("canvas");
  person.width = width;
  person.height = height;
  const personCtx = person.getContext("2d");
  if (!personCtx) {
    result.close();
    throw new Error("Canvas tidak tersedia di browser ini");
  }
  personCtx.drawImage(photo, 0, 0);
  const pixels = personCtx.getImageData(0, 0, width, height);
  const maskWidth = mask.width;
  const maskHeight = mask.height;
  const confidence = mask.getAsFloat32Array();
  for (let y = 0; y < height; y += 1) {
    const maskY = Math.min(
      maskHeight - 1,
      Math.floor((y / height) * maskHeight),
    );
    for (let x = 0; x < width; x += 1) {
      const maskX = Math.min(
        maskWidth - 1,
        Math.floor((x / width) * maskWidth),
      );
      const alpha = confidence[maskY * maskWidth + maskX] ?? 0;
      pixels.data[(y * width + x) * 4 + 3] = Math.round(
        Math.min(1, Math.max(0, (alpha - 0.15) / 0.7)) * 255,
      );
    }
  }
  personCtx.putImageData(pixels, 0, 0);
  ctx.drawImage(person, 0, 0);
  result.close();
  return canvas.toDataURL("image/jpeg", 0.92);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Foto atau background gagal dimuat"));
    image.src = src;
  });
}
