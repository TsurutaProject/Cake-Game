import { useEffect } from 'react'
import { FuriganaText } from './FuriganaText'

export type GuidedTutorialStep =
  | 'intro'
  | 'order'
  | 'cut'
  | 'move-mode'
  | 'move-piece'
  | 'serve'

interface GuidedTutorialProps {
  step: GuidedTutorialStep | null
  onAdvance: () => void
  onSkip: () => void
}

const stepContent: Record<Exclude<GuidedTutorialStep, 'intro'>, { title: string; text: string }> = {
  order: {
    title: 'まずは注文を見よう',
    text: 'このお客さんは、ケーキを1/2ほしがっています。注文がわかったら次へ進もう。',
  },
  cut: {
    title: 'ケーキを半分に切ろう',
    text: '光っている点線を、ケーキの上から下までまっすぐスワイプしよう。',
  },
  'move-mode': {
    title: 'トングに持ちかえよう',
    text: '右の「移す」ボタンを押して、ピースを運ぶ準備をしよう。',
  },
  'move-piece': {
    title: '1/2のピースを運ぼう',
    text: '切れたピースをつかみ、光っているトレイまでドラッグしよう。',
  },
  serve: {
    title: 'お客さんに販売しよう',
    text: 'トレイの合計は1/2です。注文と同じなので「販売する」を押そう。',
  },
}

const focusSelectors: Partial<Record<GuidedTutorialStep, string>> = {
  order: '.order-bubble',
  cut: '.cake-board',
  'move-mode': '.mode-button--move',
  'move-piece': '.mode-button--move',
  serve: '.serve-button',
}

export function GuidedTutorial({ step, onAdvance, onSkip }: GuidedTutorialProps) {
  useEffect(() => {
    if (step === null || step === 'intro') {
      return
    }

    const focusTarget = document.querySelector(focusSelectors[step] ?? '')
    focusTarget?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [step])

  if (step === null) {
    return null
  }

  if (step === 'intro') {
    return (
      <div className="guided-intro" role="dialog" aria-modal="true" aria-labelledby="guided-intro-title">
        <section className="guided-intro__dialog">
          <p className="guided-intro__label">はじめての<FuriganaText text="接客" /></p>
          <h2 id="guided-intro-title"><FuriganaText text="いっしょに注文を完成させよう" /></h2>
          <p>
            <FuriganaText text="光っている場所を順番に操作して、ケーキを切って販売するところまで練習します。" />
          </p>
          <div className="guided-intro__actions">
            <button type="button" className="button" onClick={onSkip}>
              あとで
            </button>
            <button type="button" className="button button--primary" onClick={onAdvance}>
              <FuriganaText text="接客を始める" />
            </button>
          </div>
        </section>
      </div>
    )
  }

  const content = stepContent[step]
  const stepNumber = ['order', 'cut', 'move-mode', 'move-piece', 'serve'].indexOf(step) + 1

  return (
    <>
      <div className="guided-shade" aria-hidden="true" />
      <aside className="guided-coach" aria-live="polite">
        <div className="guided-coach__header">
          <span>{stepNumber} / 5</span>
          <button type="button" onClick={onSkip}>スキップ</button>
        </div>
        <strong><FuriganaText text={content.title} /></strong>
        <p><FuriganaText text={content.text} /></p>
        {step === 'order' ? (
          <button type="button" className="button button--primary" onClick={onAdvance}>
            <FuriganaText text="注文がわかった" />
          </button>
        ) : (
          <small><FuriganaText text="光っている場所を操作しよう" /></small>
        )}
      </aside>
    </>
  )
}
