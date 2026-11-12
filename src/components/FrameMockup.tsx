import type { CSSProperties } from "react";
import type { FrameId } from "../types";
import { getFrame } from "../lib/frames";
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
