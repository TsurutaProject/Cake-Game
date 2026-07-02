import { useState } from 'react'
import { FuriganaText } from './FuriganaText'

type HelpView = 'guide' | 'hint'

interface HelpMenuProps {
  onOpenTutorial: () => void
}

export function HelpMenu({ onOpenTutorial }: HelpMenuProps) {
  const [openView, setOpenView] = useState<HelpView | null>(null)

  return (
    <>
      <section className="help-menu" aria-label="ヘルプ">
        <button type="button" onClick={() => setOpenView('guide')}>
          <FuriganaText text="操作ガイド" />
        </button>
        <button type="button" onClick={() => setOpenView('hint')}>
          ヒント
        </button>
        <button type="button" onClick={onOpenTutorial}>
          チュートリアル
        </button>
      </section>

      {openView !== null ? (
        <div className="help-overlay" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <section className="help-dialog">
            <button
              type="button"
              className="help-dialog__close"
              aria-label="閉じる"
              onClick={() => setOpenView(null)}
            >
              ×
            </button>
            <h2 id="help-title">
              <FuriganaText text={openView === 'guide' ? '操作ガイド' : 'ヒント'} />
            </h2>
            {openView === 'guide' ? (
              <ol>
                <li><FuriganaText text="包丁を選び、点線にそってケーキを切る。" /></li>
                <li><FuriganaText text="トングに切りかえて、ピースをトレイへ移す。" /></li>
                <li><FuriganaText text="合計をたしかめて、販売する。" /></li>
              </ol>
            ) : (
              <div className="help-dialog__hints">
                <p>1/2 は 1/4 + 1/4 でも作れます。</p>
                <p>3/4 は 1/2 + 1/4 でも作れます。</p>
                <p><FuriganaText text="トッピングを切らずに出せたらボーナスです。" /></p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  )
}
