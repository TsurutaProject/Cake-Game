import type { InteractionMode } from '../types/game'

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
        <p className="control-label">操作</p>
        <div className="mode-selector" role="group" aria-label="操作モード">
          <button
            type="button"
            className={interactionMode === 'cut' ? 'is-active' : ''}
            onClick={() => onChangeInteractionMode('cut')}
          >
            カット
          </button>
          <button
            type="button"
            className={interactionMode === 'move' ? 'is-active' : ''}
            onClick={() => onChangeInteractionMode('move')}
          >
            移す
          </button>
        </div>
      </div>
      <div>
        <p className="control-label">補助線</p>
        <div className="cut-selector" role="group" aria-label="補助線">
          {allowedCuts.map((cuts) => (
            <button
              key={cuts}
              type="button"
              className={cuts === currentCuts ? 'is-active' : ''}
              onClick={() => onChangeCuts(cuts)}
            >
              {cuts}等分
            </button>
          ))}
        </div>
      </div>
      <div className="game-controls__actions">
        <button type="button" className="button button--secondary" onClick={onClear}>
          もどす
        </button>
        <button type="button" className="button button--primary" onClick={onServe}>
          販売する
        </button>
      </div>
    </section>
  )
}
