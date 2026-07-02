import type { InteractionMode } from '../types/game'
import { toolImages } from '../data/assets'
import { FuriganaText } from './FuriganaText'

interface GameControlsProps {
  allowedCuts: number[]
  currentCuts: number
  interactionMode: InteractionMode
  onChangeCuts: (cuts: number) => void
  onChangeInteractionMode: (mode: InteractionMode) => void
  onServe: () => void
  onClear: () => void
}

export function GameControls({
  allowedCuts,
  currentCuts,
  interactionMode,
  onChangeCuts,
  onChangeInteractionMode,
  onServe,
  onClear,
}: GameControlsProps) {
  return (
    <section className="game-controls" aria-label="ゲーム操作">
      <div>
        <p className="control-label"><FuriganaText text="操作" /></p>
        <div className="mode-selector" role="group" aria-label="操作モード">
          <button
            type="button"
            className={`mode-button--cut${interactionMode === 'cut' ? ' is-active' : ''}`}
            onClick={() => onChangeInteractionMode('cut')}
          >
            <img src={toolImages.cut} alt="" aria-hidden="true" />
            <span>カット</span>
          </button>
          <button
            type="button"
            className={`mode-button--move${interactionMode === 'move' ? ' is-active' : ''}`}
            onClick={() => onChangeInteractionMode('move')}
          >
            <img src={toolImages.move} alt="" aria-hidden="true" />
            <span><FuriganaText text="移す" /></span>
          </button>
        </div>
      </div>
      <div>
        <p className="control-label"><FuriganaText text="補助線" /></p>
        <div className="cut-selector" role="group" aria-label="補助線">
          {allowedCuts.map((cuts) => (
            <button
              key={cuts}
              type="button"
              className={cuts === currentCuts ? 'is-active' : ''}
              onClick={() => onChangeCuts(cuts)}
            >
              {cuts}<FuriganaText text="等分" />
            </button>
          ))}
        </div>
      </div>
      <div className="game-controls__actions">
        <button type="button" className="button button--secondary" onClick={onClear}>
          もどす
        </button>
        <button type="button" className="button button--primary serve-button" onClick={onServe}>
          <FuriganaText text="販売する" />
        </button>
      </div>
    </section>
  )
}
