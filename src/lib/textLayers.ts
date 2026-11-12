export type TextFont = "bold" | "light" | "mono";
export type TextBackground = "none" | "solid" | "translucent";
export type TextAlign = "left" | "center" | "right";

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: "#262626" | "#E2E8CE" | "#FF7F11" | "#ACBFA4";
  fontStyle: TextFont;
  background: TextBackground;
  align: TextAlign;
}

export const TEXT_COLORS: TextLayer["color"][] = ["#262626", "#E2E8CE", "#FF7F11", "#ACBFA4"];

export function drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer, width: number, height: number): void {
  const family = layer.fontStyle === "mono" ? "ui-monospace, monospace" : '"Funnel Display", system-ui, sans-serif';
  const weight = layer.fontStyle === "bold" ? 700 : 400;
  const size = 48 * layer.scale;
  const lines = layer.text.slice(0, 60).split("\n");
  ctx.save();
  ctx.translate(layer.x * width, layer.y * height);
  ctx.rotate(layer.rotation);
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = layer.align;
  ctx.textBaseline = "middle";
  const widest = Math.max(1, ...lines.map((line) => ctx.measureText(line || " ").width));
  const lineHeight = size * 1.2;
  const textColor = layer.background === "none" ? layer.color : layer.color === "#262626" || layer.color === "#ACBFA4" ? "#E2E8CE" : "#262626";
  const textX = layer.align === "left" ? -widest / 2 : layer.align === "right" ? widest / 2 : 0;
  lines.forEach((line, index) => {
    const y = (index - (lines.length - 1) / 2) * lineHeight;
    if (layer.background !== "none") {
      const lineWidth = ctx.measureText(line || " ").width;
      ctx.fillStyle = layer.background === "solid" ? layer.color : `${layer.color}CC`;
      ctx.fillRect(textX - lineWidth / 2 - size * 0.24, y - lineHeight / 2 - size * 0.14, lineWidth + size * 0.48, lineHeight + size * 0.28);
    }
      ctx.fillStyle = textColor;
    ctx.fillText(line, textX, y, width * 0.9);
  });
  ctx.restore();
}
