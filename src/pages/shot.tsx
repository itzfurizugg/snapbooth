import { CameraStage } from '../components/CameraStage'
import { getFrame } from '../lib/frames'
import type { FrameId } from '../types'

interface ShotPageProps { frameId: FrameId; photos: Array<string | null>; retakeIndex: number | null; background: string | null; onComplete: (photos: string[]) => void; onBackgroundChange: (url: string | null) => void; onBack: () => void; onRestart: () => void }
export function ShotPage({ frameId, photos, retakeIndex, background, onComplete, onBackgroundChange, onBack, onRestart }: ShotPageProps) {
  const frame = getFrame(frameId)
  return <>{frame.virtualBackground && frame.backgrounds && <fieldset className="background-picker"><legend>Latar kamera</legend><label className="background-choice"><input type="radio" name="camera-bg" checked={!background} onChange={() => onBackgroundChange(null)}/><span className="background-original">Asli</span><span>Foto asli</span></label>{frame.backgrounds.map((url) => <label key={url} className="background-choice"><input type="radio" name="camera-bg" checked={background === url} onChange={() => onBackgroundChange(url)}/><img src={url} alt=""/><span>{decodeURIComponent(url.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'Latar').replace(/[-_]/g, ' ')}</span></label>)}</fieldset>}<CameraStage key={`${frameId}-${retakeIndex ?? 'all'}`} frameId={frameId} existing={photos} retakeIndex={retakeIndex} background={background} onComplete={onComplete} onBack={onBack} onRestart={onRestart}/></>
}
