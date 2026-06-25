import type { ResultState } from '../types/game'

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

  return (
    <div className="result-overlay" role="alertdialog" aria-modal="true" aria-labelledby="result-title">
      <section className={`result-message result-message--${result.kind}`} aria-live="polite">
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
      </section>
    </div>
  )
}
