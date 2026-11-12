import { ReviewStage } from '../components/ReviewStage'
import type { FrameId } from '../types'
export function EditPage(props: { photos: string[]; frameId: FrameId; mirror: boolean; code: string; background: string | null; onToggleMirror: () => void; onRetake: (index: number) => void; onReset: () => void; onBack: () => void; onSubmit: () => void }) { return <ReviewStage {...props}/> }
