import { ReviewStage } from "../components/ReviewStage";
import type { FrameId } from "../types";
import type { TextLayer } from "../lib/textLayers";
export function EditPage(props: {
  photos: string[];
  frameId: FrameId;
  mirror: boolean;
  code: string;
  background: string | null;
  onToggleMirror: () => void;
  onRetake: (index: number) => void;
  onReset: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onStickerChange: (stickers: TextLayer[]) => void;
  initialStickers: TextLayer[];
}) {
  return <ReviewStage {...props} />;
}
