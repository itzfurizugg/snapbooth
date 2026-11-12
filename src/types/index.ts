export type FrameId = string;

export interface EditableTextConfig {
  label: string;
  placeholder: string;
  maxLength: number;
  x: number;
  y: number;
  width: number;
  height: number;
  align: "left" | "center" | "right";
  fontFamily: string;
  fontSize: number;
  color: string;
}

export interface SlotRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FramePalette {
  background: string;
  ink: string;
  accent: string;
  paper: string;
  muted: string;
}

export interface FrameConfig {
  id: FrameId;
  name: string;
  index: string;
  description: string;
  note: string;
  author?: string;
  slotCount: number;
  width: number;
  height: number;
  image: string;
  virtualBackground?: boolean;
  backgrounds?: string[];
  editableText?: EditableTextConfig;
  palette: FramePalette;
  slots: SlotRect[];
  sampleImages: string[];
}

export interface CameraErrorInfo {
  code:
    "permission" | "missing" | "busy" | "insecure" | "unsupported" | "unknown";
  title: string;
  message: string;
  steps: string[];
}

export interface SavedStrip {
  id: string;
  shareUrl: string;
  imageUrl: string;
  expiresAt: string;
  frameId: FrameId;
}

export interface SharedStrip {
  id: string;
  imageUrl: string;
  expiresAt: string;
  frameId: FrameId;
  createdAt?: string;
}

export type SessionState =
  | { status: "loading" }
  | { status: "ready"; strip: SharedStrip }
  | { status: "expired" }
  | { status: "missing" }
  | { status: "error"; message: string };

export type BoothStep =
  "intro" | "frames" | "camera" | "review" | "processing" | "qr";
