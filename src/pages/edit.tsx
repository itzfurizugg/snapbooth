import { ReviewStage } from '../components/ReviewStage'
import type { FrameId } from '../types'

interface EditPageProps {
  photos: string[]
  frameId: FrameId
  mirror: boolean
  code: string
  background: string | null
  onToggleMirror: () => void
  onRetake: (index: number) => void
  onReset: () => void
  onBack: () => void
  onSubmit: () => void
}

export function EditPage(props: EditPageProps) {
  return <ReviewStage {...props} />
}
