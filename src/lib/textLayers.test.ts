import { drawTextLayer, type TextLayer } from "./textLayers";

const calls: string[] = [];
const ctx = {
  save: () => calls.push("save"), restore: () => calls.push("restore"),
  translate: () => calls.push("translate"), rotate: () => calls.push("rotate"),
  measureText: () => ({ width: 10 }), fillRect: () => calls.push("background"),
  fillText: (text: string) => calls.push(text),
} as unknown as CanvasRenderingContext2D;
const layer: TextLayer = { id: "test", text: "one\ntwo", x: .5, y: .5, scale: 1, rotation: 0, color: "#E2E8CE", fontStyle: "bold", background: "solid", align: "center" };
drawTextLayer(ctx, layer, 480, 970);
if (!calls.includes("background") || !calls.includes("one") || !calls.includes("two") || calls.at(-1) !== "restore") throw new Error("Text layer render contract failed");
