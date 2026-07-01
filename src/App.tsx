import { useMemo, useState } from 'react'
import { CakeBoard } from './components/CakeBoard'
import { CakeSelector } from './components/CakeSelector'
import { CustomerQueue } from './components/CustomerQueue'
import { GameControls } from './components/GameControls'
import { OrderBubble } from './components/OrderBubble'
import { ResultMessage } from './components/ResultMessage'
import { Tray } from './components/Tray'
import { TrophyShelf } from './components/TrophyShelf'
import { cakes, getCakeById } from './data/cakes'
import { orders } from './data/orders'
import { stages } from './data/stages'
import { trophies } from './data/trophies'
import { toolImages } from './data/assets'
import type {
  CakeKind,
  CakePieceModel,
  Fraction,
  InteractionMode,
  Order,
  ResultState,
  TrophyProgress,
} from './types/game'
import { createWholeCakePiece, cutCakePieces, normalizeAngle } from './utils/cakeGeometry'
import {
  addFractions,
  areFractionsEqual,
  compareFractions,
  formatFraction,
} from './utils/fraction'
import './styles/global.css'
import './styles/game.css'

const maxTrayPieces = 3
const visibleCustomerCount = 5
const stage = stages[0]
const stageOrders = orders.filter((order) => stage.orderIds.includes(order.id))
const initialCake = getCakeById('shortcake')

const idleResult: ResultState = {
  kind: 'idle',
  title: '',
  detail: '',
}

const baseReward = 300
const toppingBonusReward = 120
const compactPieceBonusReward = 80
const recipeBonusReward = 180

interface DifficultyRange {
  min: number
  max: number
}

interface CarriedPieceState {
  fraction: Fraction
  x: number
  y: number
}

const getVisibleQueueOrders = (activeOrder: Order): Order[] => {
  const activeIndex = stageOrders.findIndex((order) => order.id === activeOrder.id)
  const startIndex = activeIndex === -1 ? 0 : activeIndex

  return Array.from(
    { length: visibleCustomerCount },
    (_, index) => stageOrders[(startIndex + index) % stageOrders.length],
  )
}

const getCutAngleKey = (angle: number): string => normalizeAngle(angle).toFixed(3)

const mergeCutMarkAngles = (currentAngles: number[], nextAngles: number[]): number[] => {
  const angleMap = new Map<string, number>()

  ;[...currentAngles, ...nextAngles].forEach((angle) => {
    const normalizedAngle = normalizeAngle(angle)
    angleMap.set(getCutAngleKey(normalizedAngle), normalizedAngle)
  })

  return Array.from(angleMap.values()).sort((left, right) => left - right)
}

const getDifficultyRange = (servedCount: number, comboCount: number): DifficultyRange => {
  if (comboCount >= 5) {
    return { min: 4, max: 4 }
  }

  if (comboCount >= 3) {
    return { min: 3, max: 4 }
  }

  if (servedCount < 2) {
    return { min: 1, max: 1 }
  }

  if (servedCount < 5) {
    return { min: 1, max: 2 }
  }

  if (servedCount < 8) {
    return { min: 2, max: 3 }
  }

  return { min: 3, max: 4 }
}

const getOrderPool = (
  unlockedCakeIds: CakeKind[],
  servedCount: number,
  comboCount: number,
): Order[] => {
  const difficultyRange = getDifficultyRange(servedCount, comboCount)

  return stageOrders.filter(
    (order) =>
      unlockedCakeIds.includes(order.cakeKind) &&
      order.difficulty >= difficultyRange.min &&
      order.difficulty <= difficultyRange.max,
  )
}

const selectNextOrderId = (
  unlockedCakeIds: CakeKind[],
  servedCount: number,
  comboCount: number,
  blockedOrderId?: string,
): string => {
  const pool = getOrderPool(unlockedCakeIds, servedCount, comboCount)

  if (pool.length === 0) {
    return stageOrders[0].id
  }

  let offset = 0

  while (offset < pool.length) {
    const order = pool[(servedCount + comboCount + offset) % pool.length]

    if (pool.length === 1 || order.id !== blockedOrderId) {
      return order.id
    }

    offset += 1
  }

  return pool[0].id
}

const formatRecipe = (recipePieces: Order['recipePieces']): string =>
  recipePieces?.map((fraction) => formatFraction(fraction)).join(' + ') ?? ''

const matchesRecipe = (pieces: CakePieceModel[], recipePieces: Order['recipePieces']): boolean => {
  if (recipePieces === undefined || pieces.length !== recipePieces.length) {
    return false
  }

  const pieceFractions = pieces.map((piece) => formatFraction(piece.fraction)).sort()
  const recipeFractions = recipePieces.map((fraction) => formatFraction(fraction)).sort()

  return pieceFractions.every((fraction, index) => fraction === recipeFractions[index])
}

const getUnlockedTrophyIds = (progress: TrophyProgress): string[] =>
  trophies
    .filter((trophy) => progress[trophy.metric] >= trophy.target)
    .map((trophy) => trophy.id)

function App() {
  const [servedCount, setServedCount] = useState(0)
  const [activeOrderId, setActiveOrderId] = useState(() => selectNextOrderId(['shortcake'], 0, 0))
  const [activeCakeId, setActiveCakeId] = useState<CakeKind>('shortcake')
  const [unlockedCakeIds, setUnlockedCakeIds] = useState<CakeKind[]>(['shortcake'])
  const [currentCuts, setCurrentCuts] = useState(stage.allowedCuts[0])
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('cut')
  const [activeCuts, setActiveCuts] = useState<number | null>(null)
  const [cutBatch, setCutBatch] = useState(0)
  const [boardPieces, setBoardPieces] = useState<CakePieceModel[]>([
    createWholeCakePiece(initialCake),
  ])
  const [selectedPieces, setSelectedPieces] = useState<CakePieceModel[]>([])
  const [cutMarkAngles, setCutMarkAngles] = useState<number[]>([])
  const [carriedPiece, setCarriedPiece] = useState<CarriedPieceState | null>(null)
  const [result, setResult] = useState<ResultState>(idleResult)
  const [money, setMoney] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [cleanServes, setCleanServes] = useState(0)
  const [recipeServes, setRecipeServes] = useState(0)

  const activeCake = getCakeById(activeCakeId)
  const activeOrder = stageOrders.find((order) => order.id === activeOrderId) ?? stageOrders[0]
  const visibleQueueOrders = useMemo(() => getVisibleQueueOrders(activeOrder), [activeOrder])
  const trophyProgress: TrophyProgress = {
    servedCount,
    bestCombo,
    totalEarned,
    cleanServes,
    recipeServes,
    unlockedCakeCount: unlockedCakeIds.length,
  }
  const unlockedTrophyIds = getUnlockedTrophyIds(trophyProgress)

  const cutToppingIds = useMemo(
    () =>
      Array.from(
        new Set([...boardPieces, ...selectedPieces].flatMap((piece) => piece.cutToppingIds)),
      ),
    [boardPieces, selectedPieces],
  )
  const total = addFractions(selectedPieces.map((piece) => piece.fraction))

  const resetBoardState = (cakeId: CakeKind): void => {
    const cake = getCakeById(cakeId)

    setSelectedPieces([])
    setBoardPieces([createWholeCakePiece(cake)])
    setCutMarkAngles([])
    setCarriedPiece(null)
    setActiveCuts(null)
    setInteractionMode('cut')
  }

  const clearTray = (): void => {
    resetBoardState(activeCake.id)
    setResult(idleResult)
  }

  const resetCakeBoard = (cakeId: CakeKind): void => {
    resetBoardState(cakeId)
    setResult(idleResult)
  }

  const handleChangeCuts = (cuts: number): void => {
    setCurrentCuts(cuts)
    setInteractionMode('cut')
    setResult(idleResult)
  }

  const handleCutCake = (cuts: number, cutAngles: number[]): void => {
    const nextBatch = cutBatch + 1
    setActiveCuts(cuts)
    setCutBatch(nextBatch)
    setCutMarkAngles((currentAngles) => mergeCutMarkAngles(currentAngles, cutAngles))
    setBoardPieces((currentPieces) =>
      cutCakePieces(currentPieces, cutAngles, activeCake.toppings, nextBatch, activeCake),
    )
    setResult(idleResult)
  }

  const handleCarryPieceChange = (
    piece: CakePieceModel,
    position: { x: number; y: number } | null,
  ): void => {
    setCarriedPiece(
      position === null
        ? null
        : {
            fraction: piece.fraction,
            x: position.x,
            y: position.y,
          },
    )
  }

  const handleSelectCake = (cakeId: CakeKind): void => {
    setActiveCakeId(cakeId)
    resetCakeBoard(cakeId)
  }

  const handleBuyCake = (cakeId: CakeKind): void => {
    const cake = getCakeById(cakeId)

    if (unlockedCakeIds.includes(cakeId) || money < cake.price) {
      return
    }

    const nextUnlockedCakeIds = [...unlockedCakeIds, cakeId]

    setMoney((currentMoney) => currentMoney - cake.price)
    setUnlockedCakeIds(nextUnlockedCakeIds)
    setResult({
      kind: 'bonus',
      title: `${cake.name}を解放しました`,
      detail: '今のお客さんはそのままです。次のお客さんから、このケーキを注文することがあります。',
    })
  }

  const handleMovePieceToTray = (piece: CakePieceModel): void => {
    setResult(idleResult)

    if (!boardPieces.some((currentPiece) => currentPiece.id === piece.id)) {
      return
    }

    if (selectedPieces.length >= maxTrayPieces) {
      setResult({
        kind: 'try-again',
        title: 'トレイは3ピースまでです',
        detail: 'どれか1つを外してから、別のピースを試してみよう。',
      })
      return
    }

    setBoardPieces((currentPieces) =>
      currentPieces.filter((currentPiece) => currentPiece.id !== piece.id),
    )
    setSelectedPieces((currentPieces) => {
      if (
        currentPieces.some((currentPiece) => currentPiece.id === piece.id) ||
        currentPieces.length >= maxTrayPieces
      ) {
        return currentPieces
      }

      return [...currentPieces, piece]
    })
  }

  const handleReturnPieceToBoard = (piece: CakePieceModel): void => {
    setResult(idleResult)
    setSelectedPieces((currentPieces) =>
      currentPieces.filter((currentPiece) => currentPiece.id !== piece.id),
    )

    setBoardPieces((currentPieces) =>
      currentPieces.some((currentPiece) => currentPiece.id === piece.id)
        ? currentPieces
        : [...currentPieces, piece].sort((left, right) => left.startAngle - right.startAngle),
    )
  }

  const handleMovePieceToTrayById = (pieceId: string): void => {
    const piece = boardPieces.find((currentPiece) => currentPiece.id === pieceId)

    if (piece !== undefined) {
      handleMovePieceToTray(piece)
    }
  }

  const handleServe = (allowRecipeMismatch = false): void => {
    if (activeOrder.cakeKind !== activeCake.id) {
      setResult({
        kind: 'try-again',
        title: 'ケーキの種類が違うみたい',
        detail: `${activeOrder.customerName}さんは${getCakeById(activeOrder.cakeKind).name}を注文しています。`,
      })
      setCombo(0)
      return
    }

    if (selectedPieces.length === 0) {
      setResult({
        kind: 'try-again',
        title: 'まだケーキがありません',
        detail: '注文に合いそうなピースを1つ以上トレイにのせよう。',
      })
      setCombo(0)
      return
    }

    if (areFractionsEqual(total, activeOrder.target)) {
      const recipeMatched = matchesRecipe(selectedPieces, activeOrder.recipePieces)

      if (
        activeOrder.recipePieces !== undefined &&
        !recipeMatched &&
        !allowRecipeMismatch
      ) {
        setResult({
          kind: 'warning',
          title: '作り方ボーナスを逃します',
          detail: `量はぴったりなので販売できます。注文通り ${formatRecipe(activeOrder.recipePieces)} で作ると、さらに+${recipeBonusReward}円です。このまま販売しますか？`,
          primaryLabel: 'このまま販売',
          secondaryLabel: '作り直す',
        })
        return
      }

      const cutToppingIds = new Set(selectedPieces.flatMap((piece) => piece.cutToppingIds))
      const cutToppingLabels = activeCake.toppings
        .filter((topping) => cutToppingIds.has(topping.id))
        .map((topping) => topping.label)
      const pieceBonusText =
        selectedPieces.length <= 2 ? '少ないピースで出せたのもすてきです。' : ''
      const nextCombo = combo + 1
      const comboReward = Math.max(0, nextCombo - 1) * 50
      const compactPieceReward = selectedPieces.length <= 2 ? compactPieceBonusReward : 0
      const toppingReward = cutToppingLabels.length === 0 ? toppingBonusReward : 0
      const recipeReward = recipeMatched ? recipeBonusReward : 0
      const earnedMoney =
        baseReward + comboReward + compactPieceReward + toppingReward + recipeReward
      const nextServedCount = servedCount + 1
      const nextOrderId = selectNextOrderId(
        unlockedCakeIds,
        nextServedCount,
        nextCombo,
        activeOrder.id,
      )
      const recipeBonusText = recipeMatched
        ? `注文通りの ${formatRecipe(activeOrder.recipePieces)} で作れたので、作り方ボーナスです。`
        : ''

      setCombo(nextCombo)
      setBestCombo((currentBestCombo) => Math.max(currentBestCombo, nextCombo))
      setMoney((currentMoney) => currentMoney + earnedMoney)
      setTotalEarned((currentTotalEarned) => currentTotalEarned + earnedMoney)
      setServedCount(nextServedCount)
      setCleanServes((currentCleanServes) =>
        cutToppingLabels.length === 0 ? currentCleanServes + 1 : currentCleanServes,
      )
      setRecipeServes((currentRecipeServes) =>
        recipeMatched ? currentRecipeServes + 1 : currentRecipeServes,
      )
      setActiveOrderId(nextOrderId)
      resetBoardState(activeCake.id)

      if (cutToppingLabels.length === 0) {
        setResult({
          kind: 'bonus',
          title: 'ぴったり、きれいに提供できました',
          detail: `+${earnedMoney}円。${nextCombo}コンボ！トッピングを守れてなおよしです。${recipeBonusText}次のお客さんに進みます。${pieceBonusText}`,
        })
        return
      }

      setResult({
        kind: 'success',
        title: 'ぴったり販売できました',
        detail: `+${earnedMoney}円。${nextCombo}コンボ！${formatFraction(total)} は ${formatFraction(activeOrder.target)} と同じ大きさです。${recipeBonusText}${cutToppingLabels.join('と')}は切れたけど、注文はばっちりです。次のお客さんに進みます。`,
      })
      return
    }

    const comparison = compareFractions(total, activeOrder.target)
    setResult(
      comparison < 0
        ? {
            kind: 'try-again',
            title: 'もう少し必要みたい',
            detail: `今は ${formatFraction(total)}。あと少し足すと注文の ${formatFraction(activeOrder.target)} に近づきます。`,
          }
        : {
            kind: 'try-again',
            title: 'ちょっと多いかも',
            detail: `今は ${formatFraction(total)}。注文の ${formatFraction(activeOrder.target)} より大きくなっています。`,
          },
    )
    setCombo(0)
  }

  return (
    <main className={carriedPiece === null ? 'game-shell' : 'game-shell is-carrying-piece'}>
      <header className="game-header">
        <div>
          <p className="game-header__eyebrow">Fraction Cake Shop</p>
          <h1>{stage.title}</h1>
          <p>{stage.description}</p>
        </div>
        <dl className="score-board" aria-label="スコア">
          <div>
            <dt>売上</dt>
            <dd>{money.toLocaleString()}円</dd>
          </div>
          <div>
            <dt>コンボ</dt>
            <dd>{combo}</dd>
          </div>
        </dl>
      </header>

      <div className="game-layout">
        <div className="left-panel">
          <CustomerQueue
            orders={visibleQueueOrders}
            activeOrderId={activeOrder.id}
          />
          <TrophyShelf
            trophies={trophies}
            unlockedTrophyIds={unlockedTrophyIds}
            progress={trophyProgress}
          />
        </div>

        <section className="play-area">
          <OrderBubble order={activeOrder} cakeName={getCakeById(activeOrder.cakeKind).name} />
          <CakeSelector
            cakes={cakes}
            activeCakeId={activeCake.id}
            unlockedCakeIds={unlockedCakeIds}
            money={money}
            onSelectCake={handleSelectCake}
            onBuyCake={handleBuyCake}
          />
          <CakeBoard
            pieces={boardPieces}
            cake={activeCake}
            toppings={activeCake.toppings}
            cutToppingIds={cutToppingIds}
            cutMarkAngles={cutMarkAngles}
            isTrayFull={selectedPieces.length >= maxTrayPieces}
            isCarryingPiece={carriedPiece !== null}
            interactionMode={interactionMode}
            currentCuts={currentCuts}
            activeCuts={activeCuts}
            onCutCake={handleCutCake}
            onMovePieceToTray={handleMovePieceToTray}
            onCarryPieceChange={handleCarryPieceChange}
          />
        </section>

        <aside className="side-panel">
          <ResultMessage
            result={result}
            onDismiss={() => setResult(idleResult)}
            onConfirm={() => handleServe(true)}
          />
          <section className="hint-panel" aria-label="発見メモ">
            <h2>発見メモ</h2>
            <p>1/2 は 1/4 と 1/4 を合わせても作れます。</p>
            <p>3/4 は 1/2 + 1/4、または 1/4 + 1/4 + 1/4。</p>
            <p>補助線を選んだら、点線に沿ってケーキをスワイプ。</p>
            <p>切り方を変えて切っても、トレイのピースは残ります。</p>
            <p>トッピングを切らずに出せたら、なおよしです。</p>
          </section>
          <Tray
            selectedPieces={selectedPieces}
            total={total}
            maxPieces={maxTrayPieces}
            onRemovePiece={handleReturnPieceToBoard}
            onDropPiece={handleMovePieceToTrayById}
          />
          <GameControls
            allowedCuts={stage.allowedCuts}
            currentCuts={currentCuts}
            interactionMode={interactionMode}
            onChangeCuts={handleChangeCuts}
            onChangeInteractionMode={setInteractionMode}
            onServe={handleServe}
            onClear={clearTray}
          />
        </aside>
      </div>
      {carriedPiece !== null ? (
        <>
          <img
            className="tool-cursor tool-cursor--move tool-cursor--carrying"
            src={toolImages.move}
            alt=""
            aria-hidden="true"
            style={{ left: carriedPiece.x, top: carriedPiece.y }}
          />
          <div
            className="carry-badge"
            style={{ left: carriedPiece.x, top: carriedPiece.y }}
            aria-live="polite"
          >
            運び中: {formatFraction(carriedPiece.fraction)}
          </div>
        </>
      ) : null}
    </main>
  )
}

export default App
