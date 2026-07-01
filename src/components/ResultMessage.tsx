import type { ResultState } from '../types/game'
import { feedbackImages } from '../data/assets'

interface ResultMessageProps {
  result: ResultState
  onDismiss: () => void
  onConfirm?: () => void
}

export function ResultMessage({ result, onDismiss, onConfirm }: ResultMessageProps) {
  if (result.kind === 'idle') {
    return <p className="result-message">まな板のピースをトレイへ移したら「販売する」を押そう。</p>
  }

  const isWarning = result.kind === 'warning'
  const reactionImage =
    result.kind === 'try-again'
      ? feedbackImages.dissatisfied
      : result.kind === 'bonus'
        ? feedbackImages.happy
        : feedbackImages.normal
  const reactionLabel =
    result.kind === 'try-again'
      ? '不満そうな表情'
      : result.kind === 'bonus'
        ? '嬉しそうな表情'
        : '落ち着いた表情'

  return (
    <div className="result-overlay" role="alertdialog" aria-modal="true" aria-labelledby="result-title">
      <section className={`result-message result-message--${result.kind}`} aria-live="polite">
        <div className="result-message__scene">
          <img className="result-message__face" src={reactionImage} alt={reactionLabel} />
          <div className="result-message__bubble">
            <img src={feedbackImages.speechBubble} alt="" aria-hidden="true" />
            <div className="result-message__content">
              <strong id="result-title">{result.title}</strong>
              <span>{result.detail}</span>
              <div className="result-message__actions">
                {isWarning ? (
                  <button type="button" className="button button--secondary" onClick={onDismiss}>
                    {result.secondaryLabel ?? '戻る'}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="button button--primary"
                  onClick={isWarning ? onConfirm : onDismiss}
                >
                  {result.primaryLabel ?? 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
