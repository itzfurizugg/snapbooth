import type { FrameConfig, FrameId } from "../types";

const sample = (seed: string): string =>
  `https://picsum.photos/seed/${seed}/640/440?grayscale`;

// Background choices mirror supported image files in template/background.
const backgroundFiles = Object.keys(
  import.meta.glob("/template/background/*.{jpg,jpeg,png,webp}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
);

export const FRAMES: FrameConfig[] = [
  {
    id: "classc",
    name: "Classc",
    index: "01",
    description: "Tiga foto dengan dekorasi kamera Snapbooth.",
    note: "Template baru",
    slotCount: 3,
    width: 480,
    height: 970,
    image: "/template/Classc.png",
    virtualBackground: true,
    backgrounds: backgroundFiles,
    palette: {
      background: "#E4E9D1",
      ink: "#262626",
      accent: "#FF7A00",
      paper: "#E4E9D1",
      muted: "#635F54",
    },
    slots: [
      { x: 20, y: 20, width: 440, height: 266 },
      { x: 20, y: 306, width: 440, height: 266 },
      { x: 20, y: 592, width: 440, height: 266 },
    ],
    sampleImages: [sample("snapbooth-kilat-1"), sample("snapbooth-kilat-2"), sample("snapbooth-kilat-3")],
  },
  {
    id: "hypr",
    name: "Hypr",
    index: "02",
    description: "Empat foto dengan tipografi berani.",
    note: "Template baru",
    slotCount: 4,
    width: 480,
    height: 1256,
    image: "/template/Hypr.png",
    virtualBackground: true,
    backgrounds: backgroundFiles,
    palette: {
      background: "#087F70",
      ink: "#262626",
      accent: "#FF7A00",
      paper: "#087F70",
      muted: "#565B51",
    },
    slots: [
      { x: 20, y: 66, width: 440, height: 266 },
      { x: 20, y: 352, width: 440, height: 266 },
      { x: 20, y: 638, width: 440, height: 266 },
      { x: 20, y: 924, width: 440, height: 266 },
    ],
    sampleImages: [sample("snapbooth-hypr-1"), sample("snapbooth-hypr-2"), sample("snapbooth-hypr-3"), sample("snapbooth-hypr-4")],
  },
  {
    id: "wav",
    name: "Wav",
    index: "03",
    description: "Empat foto dengan dekorasi gelombang.",
    note: "Template baru",
    slotCount: 4,
    width: 480,
    height: 1256,
    image: "/template/Wav.png",
    virtualBackground: true,
    backgrounds: backgroundFiles,
    palette: {
      background: "#F4F0E2",
      ink: "#262626",
      accent: "#609CC2",
      paper: "#F4F0E2",
      muted: "#54777D",
    },
    slots: [
      { x: 20, y: 66, width: 440, height: 266 },
      { x: 20, y: 352, width: 440, height: 266 },
      { x: 20, y: 638, width: 440, height: 266 },
      { x: 20, y: 924, width: 440, height: 266 },
    ],
    sampleImages: [sample("snapbooth-wav-1"), sample("snapbooth-wav-2"), sample("snapbooth-wav-3"), sample("snapbooth-wav-4")],
  },
];

export const DEFAULT_FRAME_ID: FrameId = "classc";
export function getFrame(id: FrameId): FrameConfig {
  return FRAMES.find((frame) => frame.id === id) ?? FRAMES[0];
}
export function getFrameSlots(id: FrameId): number {
  return getFrame(id).slotCount;
}
