export interface Fraction {
  numerator: number
  denominator: number
}

export type CakeKind = 'shortcake' | 'chocolate'

export interface CakePieceModel {
  id: string
  fraction: Fraction
  cutDenominator: number
  startAngle: number
  endAngle: number
  color: string
  cutToppingIds: string[]
  pendingCutAngles: number[]
}

export type ToppingKind = 'strawberry' | 'chocolate' | 'cream'

export interface Topping {
  id: string
  kind: ToppingKind
  label: string
  angle: number
  radius: number
}

export interface CakeDefinition {
  id: CakeKind
  name: string
  price: number
  description: string
  baseColor: string
  crustColor: string
  centerColor: string
  guideColor: string
  palette: string[]
  toppings: Topping[]
}

export interface Order {
  id: string
  customerName: string
  age: number
  gender: 'girl' | 'boy' | 'adult'
  cakeKind: CakeKind
  target: Fraction
  message: string
  difficulty: number
  recipePieces?: Fraction[]
}

export interface Stage {
  id: string
  title: string
  description: string
  allowedCuts: number[]
  orderIds: string[]
}

export type ResultKind = 'idle' | 'success' | 'bonus' | 'try-again' | 'warning'

export type InteractionMode = 'cut' | 'move'

export interface ResultState {
  kind: ResultKind
  title: string
  detail: string
  primaryLabel?: string
  secondaryLabel?: string
}
