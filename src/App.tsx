import { useMemo, useState } from 'react'
import { CakeBoard } from './components/CakeBoard'
import { CakeSelector } from './components/CakeSelector'
import { CustomerQueue } from './components/CustomerQueue'
import { GameControls } from './components/GameControls'
import { GuidedTutorial, type GuidedTutorialStep } from './components/GuidedTutorial'
import { HelpMenu } from './components/HelpMenu'
import { FuriganaText } from './components/FuriganaText'
import { OrderBubble } from './components/OrderBubble'
import { ResultMessage } from './components/ResultMessage'
import { Tray } from './components/Tray'
import { TrophyShelf } from './components/TrophyShelf'
import {
  cakes,
  getCakeById,
  getCakeToppings,
  getToppingLayoutCount,
} from './data/cakes'
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
const tutorialStorageKey = 'fraction-cake-guided-tutorial-seen-v2'

const shouldShowTutorial = (): boolean => {
  try {
    return window.localStorage.getItem(tutorialStorageKey) !== 'true'
  } catch {
    return true
  }
}

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

const getNextToppingLayoutIndex = (cakeId: CakeKind, currentIndex: number): number => {
  const layoutCount = getToppingLayoutCount(cakeId)

  if (layoutCount <= 1) {
    return 0
  }

  return (currentIndex + 1 + Math.floor(Math.random() * (layoutCount - 1))) % layoutCount
}

const addUniqueValue = <Value extends string | number>(values: Value[], value: Value): Value[] =>
  values.includes(value) ? values : [...values, value]

const getPieceCombinationKey = (pieces: CakePieceModel[]): string =>
  pieces.map((piece) => formatFraction(piece.fraction)).sort().join('+')

const getUnlockedTrophyIds = (progress: TrophyProgress): string[] =>
  trophies
    .filter((trophy) => progress[trophy.metric] >= trophy.target)
    .map((trophy) => trophy.id)

function App() {
  const [guidedTutorialStep, setGuidedTutorialStep] = useState<GuidedTutorialStep | null>(
    () => shouldShowTutorial() ? 'intro' : null,
  )
  const [servedCount, setServedCount] = useState(0)
  const [activeOrderId, setActiveOrderId] = useState(() =>
    shouldShowTutorial() ? 'half' : selectNextOrderId(['shortcake'], 0, 0),
  )
  const [activeCakeId, setActiveCakeId] = useState<CakeKind>('shortcake')
  const [unlockedCakeIds, setUnlockedCakeIds] = useState<CakeKind[]>(['shortcake'])
  const [currentCuts, setCurrentCuts] = useState(stage.allowedCuts[0])
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('cut')
  const [toppingLayoutIndex, setToppingLayoutIndex] = useState(() =>
    shouldShowTutorial()
      ? 0
      : Math.floor(Math.random() * getToppingLayoutCount('shortcake')),
  )
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
  const [twelfthPieceServes, setTwelfthPieceServes] = useState(0)
  const [halfRecipeSignatures, setHalfRecipeSignatures] = useState<string[]>([])
  const [threeQuarterRecipeSignatures, setThreeQuarterRecipeSignatures] = useState<string[]>([])
  const [threePieceServes, setThreePieceServes] = useState(0)
  const [servedFractionKeys, setServedFractionKeys] = useState<string[]>([])
  const [usedCutDenominators, setUsedCutDenominators] = useState<number[]>([])
  const [currentCutDenominators, setCurrentCutDenominators] = useState<number[]>([])
  const [hasExplainedCombo, setHasExplainedCombo] = useState(false)
  const [hasExplainedTrophies, setHasExplainedTrophies] = useState(false)

  const activeCake = getCakeById(activeCakeId)
  const activeToppings = useMemo(
    () => getCakeToppings(activeCake, toppingLayoutIndex),
    [activeCake, toppingLayoutIndex],
  )
  const activeOrder = stageOrders.find((order) => order.id === activeOrderId) ?? stageOrders[0]
  const visibleQueueOrders = useMemo(() => getVisibleQueueOrders(activeOrder), [activeOrder])
  const trophyProgress: TrophyProgress = {
    servedCount,
    bestCombo,
    totalEarned,
    cleanServes,
    recipeServes,
    unlockedCakeCount: unlockedCakeIds.length,
    twelfthPieceServes,
    halfRecipeVariations: halfRecipeSignatures.length,
    threeQuarterRecipeVariations: threeQuarterRecipeSignatures.length,
    threePieceServes,
    distinctFractionsServed: servedFractionKeys.length,
    distinctCutDenominators: usedCutDenominators.length,
  }
  const unlockedTrophyIds = getUnlockedTrophyIds(trophyProgress)

  const rememberTutorialCompletion = (): void => {
    try {
      window.localStorage.setItem(tutorialStorageKey, 'true')
    } catch {
      // The tutorial still closes when browser storage is unavailable.
    }
  }

  const skipGuidedTutorial = (): void => {
    setGuidedTutorialStep(null)
    rememberTutorialCompletion()
  }

  const openGuidedTutorial = (): void => {
    setGuidedTutorialStep('intro')
    setResult(idleResult)
  }

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
    setCurrentCutDenominators([])
    setCarriedPiece(null)
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

  const advanceGuidedTutorial = (): void => {
    if (guidedTutorialStep === 'intro') {
      setActiveOrderId('half')
      setActiveCakeId('shortcake')
      setToppingLayoutIndex(0)
      setCurrentCuts(2)
      resetCakeBoard('shortcake')
      setGuidedTutorialStep('order')
      return
    }

    if (guidedTutorialStep === 'order') {
      setGuidedTutorialStep('cut')
      return
    }

    if (guidedTutorialStep === 'combo') {
      setGuidedTutorialStep('trophy')
      return
    }

    if (guidedTutorialStep === 'trophy') {
      setGuidedTutorialStep(null)
      rememberTutorialCompletion()
    }
  }

  const handleChangeCuts = (cuts: number): void => {
    if (guidedTutorialStep !== null && cuts !== 2) {
      return
    }

    setCurrentCuts(cuts)
    setInteractionMode('cut')
    setResult(idleResult)
  }

  const handleCutCake = (cuts: number, cutAngles: number[]): void => {
    const nextBatch = cutBatch + 1
    setCutBatch(nextBatch)
    setCutMarkAngles((currentAngles) => mergeCutMarkAngles(currentAngles, cutAngles))
    setCurrentCutDenominators((currentDenominators) =>
      addUniqueValue(currentDenominators, cuts),
    )
    setBoardPieces((currentPieces) =>
      cutCakePieces(currentPieces, cutAngles, activeToppings, nextBatch, activeCake),
    )
    setResult(idleResult)
    if (guidedTutorialStep === 'cut') {
      setGuidedTutorialStep('move-mode')
    }
  }

  const handleChangeInteractionMode = (mode: InteractionMode): void => {
    if (guidedTutorialStep === 'move-mode' && mode !== 'move') {
      return
    }

    setInteractionMode(mode)
    if (guidedTutorialStep === 'move-mode' && mode === 'move') {
      setGuidedTutorialStep('move-piece')
    }
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
      detail: '今のお客さんはそのまま。次から注文に登場します。',
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
        detail: '1つ戻してから試してね。',
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
    if (guidedTutorialStep === 'move-piece') {
      setGuidedTutorialStep('serve')
    }
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
        title: 'ケーキを確認してね',
        detail: `${getCakeById(activeOrder.cakeKind).name}の注文です。`,
      })
      if (guidedTutorialStep === null) {
        setCombo(0)
      }
      return
    }

    if (selectedPieces.length === 0) {
      setResult({
        kind: 'try-again',
        title: 'トレイが空だよ',
        detail: 'ピースをのせてね。',
      })
      if (guidedTutorialStep === null) {
        setCombo(0)
      }
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
          title: '量はぴったり！',
          detail: `${formatRecipe(activeOrder.recipePieces)} なら+${recipeBonusReward}円。このまま販売しますか？`,
          primaryLabel: 'このまま販売',
          secondaryLabel: '作り直す',
        })
        return
      }

      if (guidedTutorialStep === 'serve') {
        const nextOrderId = selectNextOrderId(
          unlockedCakeIds,
          servedCount,
          combo,
          activeOrder.id,
        )

        setActiveOrderId(nextOrderId)
        setToppingLayoutIndex((currentIndex) =>
          getNextToppingLayoutIndex(activeCake.id, currentIndex),
        )
        resetBoardState(activeCake.id)
        setGuidedTutorialStep('combo')
        setResult(idleResult)
        return
      }

      const cutToppingIds = new Set(selectedPieces.flatMap((piece) => piece.cutToppingIds))
      const cutToppingLabels = activeToppings
        .filter((topping) => cutToppingIds.has(topping.id))
        .map((topping) => topping.label)
      const nextCombo = combo + 1
      const comboReward = Math.max(0, nextCombo - 1) * 50
      const compactPieceReward = selectedPieces.length <= 2 ? compactPieceBonusReward : 0
      const toppingReward = cutToppingLabels.length === 0 ? toppingBonusReward : 0
      const recipeReward = recipeMatched ? recipeBonusReward : 0
      const earnedMoney =
        baseReward + comboReward + compactPieceReward + toppingReward + recipeReward
      const nextServedCount = servedCount + 1
      const nextCleanServes = cleanServes + (cutToppingLabels.length === 0 ? 1 : 0)
      const nextRecipeServes = recipeServes + (recipeMatched ? 1 : 0)
      const combinationKey = getPieceCombinationKey(selectedPieces)
      const nextHalfRecipeSignatures = areFractionsEqual(
        activeOrder.target,
        { numerator: 1, denominator: 2 },
      )
        ? addUniqueValue(halfRecipeSignatures, combinationKey)
        : halfRecipeSignatures
      const nextThreeQuarterRecipeSignatures = areFractionsEqual(
        activeOrder.target,
        { numerator: 3, denominator: 4 },
      )
        ? addUniqueValue(threeQuarterRecipeSignatures, combinationKey)
        : threeQuarterRecipeSignatures
      const nextTwelfthPieceServes = twelfthPieceServes + (
        selectedPieces.some((piece) =>
          areFractionsEqual(piece.fraction, { numerator: 1, denominator: 12 }),
        ) ? 1 : 0
      )
      const nextThreePieceServes = threePieceServes + (selectedPieces.length === 3 ? 1 : 0)
      const nextServedFractionKeys = addUniqueValue(
        servedFractionKeys,
        formatFraction(activeOrder.target),
      )
      const nextUsedCutDenominators = currentCutDenominators.reduce<number[]>(
        (denominators, denominator) => addUniqueValue(denominators, denominator),
        usedCutDenominators,
      )
      const nextOrderId = selectNextOrderId(
        unlockedCakeIds,
        nextServedCount,
        nextCombo,
        activeOrder.id,
      )
      const nextProgress: TrophyProgress = {
        servedCount: nextServedCount,
        bestCombo: Math.max(bestCombo, nextCombo),
        totalEarned: totalEarned + earnedMoney,
        cleanServes: nextCleanServes,
        recipeServes: nextRecipeServes,
        unlockedCakeCount: unlockedCakeIds.length,
        twelfthPieceServes: nextTwelfthPieceServes,
        halfRecipeVariations: nextHalfRecipeSignatures.length,
        threeQuarterRecipeVariations: nextThreeQuarterRecipeSignatures.length,
        threePieceServes: nextThreePieceServes,
        distinctFractionsServed: nextServedFractionKeys.length,
        distinctCutDenominators: nextUsedCutDenominators.length,
      }
      const currentUnlockedTrophyIds = new Set(unlockedTrophyIds)
      const nextUnlockedTrophyIds = new Set(getUnlockedTrophyIds(nextProgress))
      const newlyUnlockedTrophies = trophies.filter(
        (trophy) =>
          nextUnlockedTrophyIds.has(trophy.id) &&
          !currentUnlockedTrophyIds.has(trophy.id),
      )
      const resultHighlights: string[] = []

      if (!hasExplainedCombo) {
        resultHighlights.push('コンボ開始！続けて成功すると売上ボーナスが増えるよ。')
        setHasExplainedCombo(true)
      }

      if (!hasExplainedTrophies && newlyUnlockedTrophies.length > 0) {
        resultHighlights.push(
          `トロフィーを${newlyUnlockedTrophies.length}個獲得！左の「獲得済み」で見られるよ。`,
        )
        setHasExplainedTrophies(true)
      }

      setCombo(nextCombo)
      setBestCombo((currentBestCombo) => Math.max(currentBestCombo, nextCombo))
      setMoney((currentMoney) => currentMoney + earnedMoney)
      setTotalEarned((currentTotalEarned) => currentTotalEarned + earnedMoney)
      setServedCount(nextServedCount)
      setCleanServes(nextCleanServes)
      setRecipeServes(nextRecipeServes)
      setTwelfthPieceServes(nextTwelfthPieceServes)
      setHalfRecipeSignatures(nextHalfRecipeSignatures)
      setThreeQuarterRecipeSignatures(nextThreeQuarterRecipeSignatures)
      setThreePieceServes(nextThreePieceServes)
      setServedFractionKeys(nextServedFractionKeys)
      setUsedCutDenominators(nextUsedCutDenominators)
      setActiveOrderId(nextOrderId)
      setToppingLayoutIndex((currentIndex) =>
        getNextToppingLayoutIndex(activeCake.id, currentIndex),
      )
      resetBoardState(activeCake.id)

      if (cutToppingLabels.length === 0) {
        setResult({
          kind: 'bonus',
          title: 'ありがとう！',
          detail: recipeMatched ? 'お願いどおりの作り方だね！' : 'きれいに切れているね！',
          earnedMoney,
          combo: nextCombo,
          highlights: resultHighlights,
          primaryLabel: '次へ',
        })
        return
      }

      setResult({
        kind: 'success',
        title: 'ありがとう！',
        detail: 'ぴったりの量だね。',
        earnedMoney,
        combo: nextCombo,
        highlights: resultHighlights,
        primaryLabel: '次へ',
      })
      return
    }

    const comparison = compareFractions(total, activeOrder.target)
    setResult(
      comparison < 0
        ? {
            kind: 'try-again',
            title: 'もう少しほしいな',
            detail: `今 ${formatFraction(total)} ／ 注文 ${formatFraction(activeOrder.target)}`,
          }
        : {
            kind: 'try-again',
            title: '少し多いみたい',
            detail: `今 ${formatFraction(total)} ／ 注文 ${formatFraction(activeOrder.target)}`,
          },
    )
    if (guidedTutorialStep === null) {
      setCombo(0)
    }
  }

  const mainClassName = [
    'game-shell',
    carriedPiece === null ? '' : 'is-carrying-piece',
    guidedTutorialStep === null ? '' : `is-guided guided-step-${guidedTutorialStep}`,
  ].filter(Boolean).join(' ')

  return (
    <main className={mainClassName}>
      <header className="game-header">
        <div>
          <h1><FuriganaText text={stage.title} /></h1>
          <p><FuriganaText text={stage.description} /></p>
        </div>
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
            key={`${activeOrder.id}-${activeCake.id}-${toppingLayoutIndex}`}
            pieces={boardPieces}
            cake={activeCake}
            toppings={activeToppings}
            cutToppingIds={cutToppingIds}
            cutMarkAngles={cutMarkAngles}
            isTrayFull={selectedPieces.length >= maxTrayPieces}
            isCarryingPiece={carriedPiece !== null}
            interactionMode={interactionMode}
            currentCuts={currentCuts}
            onCutCake={handleCutCake}
            onMovePieceToTray={handleMovePieceToTray}
            onCarryPieceChange={handleCarryPieceChange}
          />
        </section>

        <aside className="side-panel">
          <dl className="score-board" aria-label="スコア">
            <div className="score-card score-card--sales">
              <dt><FuriganaText text="売上" /></dt>
              <dd>{money.toLocaleString()}<FuriganaText text="円" /></dd>
            </div>
            <div className={`score-card score-card--combo${combo > 0 ? ' is-active' : ''}${combo >= 5 ? ' is-hot' : ''}`}>
              <dt>コンボ</dt>
              <dd key={combo} className="combo-value">
                <span>{combo}</span>
                <small>COMBO</small>
              </dd>
              <span className="combo-candles" aria-hidden="true">
                {Array.from({ length: Math.min(combo, 5) }, (_, index) => (
                  <i key={index} />
                ))}
              </span>
            </div>
          </dl>
          <HelpMenu onOpenTutorial={openGuidedTutorial} />
          <ResultMessage
            result={result}
            onDismiss={() => setResult(idleResult)}
            onConfirm={() => handleServe(true)}
          />
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
            onChangeInteractionMode={handleChangeInteractionMode}
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
            <FuriganaText text="運び中" />: {formatFraction(carriedPiece.fraction)}
          </div>
        </>
      ) : null}
      <GuidedTutorial
        step={guidedTutorialStep}
        onAdvance={advanceGuidedTutorial}
        onSkip={skipGuidedTutorial}
      />
    </main>
  )
}

export default App
