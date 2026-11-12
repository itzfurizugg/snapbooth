import type { CSSProperties } from "react";
import type { FrameId } from "../types";
import { getFrame } from "../lib/frames";

const sampleFallback = (index: number) => {
  const colors = ["#d7b59b", "#b7c6bc", "#c7b2a4", "#c9c8ad"];
  const color = colors[index % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 440"><rect width="640" height="440" fill="${color}"/><circle cx="320" cy="155" r="82" fill="#d69e7e"/><path d="M230 152c0-78 34-118 90-118s92 45 92 118l-27-30c-40 15-86 12-128-4z" fill="#49372f"/><path d="M145 440c14-120 75-180 175-180s161 60 175 180" fill="#617b72"/><path d="M286 168h14m40 0h14" stroke="#322b27" stroke-width="7" stroke-linecap="round"/><path d="M300 205q20 15 40 0" fill="none" stroke="#99544a" stroke-width="6" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export function FrameMockup({
  frameId,
  size = "large",
}: {
  frameId: FrameId;
  size?: "small" | "large";
}) {
  const frame = getFrame(frameId);
  return (
    <div
      className={`strip-art strip-art-${size}`}
      role="img"
      aria-label={`${frame.name}, bingkai strip ${frame.slotCount} foto`}
      style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
    >
      {frame.slots.map((slot, index) => (
        <img
          className="frame-sample"
          key={index}
          src={frame.sampleImages[index % frame.sampleImages.length]}
          alt=""
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = sampleFallback(index);
          }}
          style={{
            left: `${(slot.x / frame.width) * 100}%`,
            top: `${(slot.y / frame.height) * 100}%`,
            width: `${(slot.width / frame.width) * 100}%`,
            height: `${(slot.height / frame.height) * 100}%`,
          } as CSSProperties}
        />
      ))}
      <img className="frame-template" src={frame.image} alt="" />
    </div>
  );
}
