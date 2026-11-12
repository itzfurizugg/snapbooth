import { FramePicker } from '../components/FramePicker'
import type { FrameId } from '../types'

interface FramePageProps {
  selected: FrameId
  onSelect: (id: FrameId) => void
  onBack: () => void
  onNext: () => void
}

export function FramePage(props: FramePageProps) {
  return <FramePicker {...props} />
}
