import type { FrameId, SavedStrip, SharedStrip } from "../types";

async function apiError(response: Response, fallback: string): Promise<Error> {
  const payload: unknown = await response.json().catch(() => null);
  const message =
    payload && typeof payload === "object" && "error" in payload
      ? String((payload as { error: unknown }).error)
      : fallback;
  return new Error(message);
}

async function saveWithCloudinary(
  imageDataUrl: string,
  frameId: FrameId,
): Promise<SavedStrip> {
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageDataUrl, frameId }),
  });

  if (!response.ok)
    throw await apiError(response, `Upload strip gagal (${response.status})`);

  const payload: unknown = await response.json().catch(() => null);
  if (!payload || typeof payload !== "object")
    throw new Error("Respons server tidak valid");

  const result = payload as Record<string, unknown>;
  if (
    typeof result.id !== "string" ||
    typeof result.shareUrl !== "string" ||
    typeof result.imageUrl !== "string" ||
    typeof result.expiresAt !== "string"
  ) {
    throw new Error("Respons server tidak lengkap");
  }

  return {
    id: result.id,
    shareUrl: result.shareUrl,
    imageUrl: result.imageUrl,
    expiresAt: result.expiresAt,
    frameId,
  };
}

export async function saveStrip(
  imageDataUrl: string,
  frameId: FrameId,
): Promise<SavedStrip> {
  return saveWithCloudinary(imageDataUrl, frameId);
}

export type FetchResult =
  | { state: "ready"; strip: SharedStrip }
  | { state: "expired" }
  | { state: "missing" };

export async function fetchSharedStrip(id: string): Promise<FetchResult> {
  const response = await fetch(`/api/sessions/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) return { state: "missing" };
  if (response.status === 410) return { state: "expired" };
  if (!response.ok)
    throw await apiError(response, `Gagal memuat sesi (${response.status})`);

  const payload: unknown = await response.json().catch(() => null);
  if (!payload || typeof payload !== "object")
    throw new Error("Respons server tidak valid");

  const result = payload as Record<string, unknown>;
  if (
    typeof result.imageUrl !== "string" ||
    typeof result.expiresAt !== "string"
  ) {
    throw new Error("Respons server tidak lengkap");
  }

  return {
    state: "ready",
    strip: {
      id,
      imageUrl: result.imageUrl,
      expiresAt: result.expiresAt,
      frameId: typeof result.frameId === "string" ? result.frameId : "classc",
      createdAt:
        typeof result.createdAt === "string" ? result.createdAt : undefined,
    },
  };
}
