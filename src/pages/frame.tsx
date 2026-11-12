import { FramePicker } from '../components/FramePicker'
import type { FrameId } from '../types'
export function FramePage(props: { selected: FrameId; onSelect: (id: FrameId) => void; onBack: () => void; onNext: () => void }) { return <FramePicker {...props}/> }
