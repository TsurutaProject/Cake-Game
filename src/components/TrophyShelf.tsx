import { useState } from 'react'
import type { TrophyDefinition, TrophyProgress } from '../types/game'
import { FuriganaText } from './FuriganaText'

interface TrophyShelfProps {
  trophies: TrophyDefinition[]
  unlockedTrophyIds: string[]
  progress: TrophyProgress
}

export function TrophyShelf({ trophies, unlockedTrophyIds, progress }: TrophyShelfProps) {
  const [isEarnedListOpen, setIsEarnedListOpen] = useState(false)
  const lockedTrophies = trophies.filter((trophy) => !unlockedTrophyIds.includes(trophy.id))
  const unlockedTrophies = trophies.filter((trophy) => unlockedTrophyIds.includes(trophy.id))

  return (
    <div className="trophy-stack">
      <section className="trophy-shelf" aria-label="未開放のトロフィー">
        <div className="trophy-shelf__header">
          <h2>トロフィー</h2>
          <p>
            {unlockedTrophyIds.length}/{trophies.length}
          </p>
        </div>
        <p className="trophy-shelf__intro">
          ミッションを<FuriganaText text="達成" />するとトロフィーが<FuriganaText text="増えます" />。
        </p>
        <div className="trophy-list">
          {lockedTrophies.map((trophy) => {
            const currentValue = progress[trophy.metric]
            const progressRatio = Math.min(currentValue / trophy.target, 1)

            return (
              <article key={trophy.id} className="trophy-card">
                <span className="trophy-card__icon" aria-hidden="true">
                  ?
                </span>
                <div className="trophy-card__body">
                  <div className="trophy-card__title">
                    <h3><FuriganaText text={trophy.title} /></h3>
                    <small><FuriganaText text="未解放" /></small>
                  </div>
                  <p><FuriganaText text={trophy.description} /></p>
                  <div className="trophy-card__meter" aria-hidden="true">
                    <span style={{ width: `${progressRatio * 100}%` }} />
                  </div>
                  <small className="trophy-card__progress">
                    {Math.min(currentValue, trophy.target).toLocaleString()}/
                    {trophy.target.toLocaleString()}
                  </small>
                </div>
              </article>
            )
          })}
          {lockedTrophies.length === 0 ? (
            <p className="trophy-empty"><FuriganaText text="すべてのトロフィーを獲得しました" /></p>
          ) : null}
        </div>
      </section>

      <button
        type="button"
        className="trophy-earned-button"
        onClick={() => setIsEarnedListOpen(true)}
        aria-haspopup="dialog"
        aria-label="獲得済みのトロフィーを確認"
      >
        <span className="trophy-earned-button__icon" aria-hidden="true">★</span>
        <span><FuriganaText text="獲得済み" /></span>
        <strong>{unlockedTrophies.length}</strong>
      </button>

      {isEarnedListOpen ? (
        <div className="help-overlay" role="dialog" aria-modal="true" aria-labelledby="earned-trophy-title">
          <section className="help-dialog trophy-dialog">
            <button
              type="button"
              className="help-dialog__close"
              aria-label="閉じる"
              onClick={() => setIsEarnedListOpen(false)}
            >
              ×
            </button>
            <div className="trophy-shelf__header">
              <h2 id="earned-trophy-title"><FuriganaText text="獲得済みのトロフィー" /></h2>
              <p>{unlockedTrophies.length}/{trophies.length}</p>
            </div>
            <div className="trophy-list trophy-list--earned trophy-dialog__list">
              {unlockedTrophies.map((trophy) => (
                <article key={trophy.id} className="trophy-card is-unlocked">
                  <span className="trophy-card__icon" aria-hidden="true">★</span>
                  <div className="trophy-card__body">
                    <div className="trophy-card__title">
                      <h3><FuriganaText text={trophy.title} /></h3>
                      <small><FuriganaText text="解放済み" /></small>
                    </div>
                    <p><FuriganaText text={trophy.description} /></p>
                  </div>
                </article>
              ))}
              {unlockedTrophies.length === 0 ? (
                <p className="trophy-empty">まだありません</p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
