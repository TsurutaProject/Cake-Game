import type { Fraction, Order } from '../types/game'
import { formatFraction } from '../utils/fraction'
import { FuriganaText } from './FuriganaText'

interface OrderBubbleProps {
  order: Order
  cakeName: string
}

const getPiecePlan = (order: Order): Fraction[] => {
  if (order.recipePieces !== undefined) {
    return order.recipePieces
  }

  if (order.target.numerator <= 3) {
    return Array.from({ length: order.target.numerator }, () => ({
      numerator: 1,
      denominator: order.target.denominator,
    }))
  }

  return [order.target]
}

export function OrderBubble({ order, cakeName }: OrderBubbleProps) {
  const piecePlan = getPiecePlan(order)
  const hasSeveralPieces = piecePlan.length > 1

  return (
    <section className="order-bubble" aria-label="注文">
      <div className="order-bubble__body">
        <div className="order-bubble__header">
          <p className="order-bubble__name">{order.customerName}さんの<FuriganaText text="注文" /></p>
          <p className={`order-bubble__cake order-bubble__cake--${order.cakeKind}`}>
            <span aria-hidden="true" />
            <FuriganaText text={cakeName} />
          </p>
        </div>
        <p className="order-bubble__message">
          <span><FuriganaText text="注文" /></span>
          <strong className="order-bubble__message-text">
            <FuriganaText text={order.message} />
          </strong>
        </p>
        <div className="order-bubble__plan">
          <span className="order-bubble__label"><FuriganaText text="作るピース" /></span>
          <div className="order-bubble__pieces" aria-label={`作るピースは ${piecePlan.map(formatFraction).join(' と ')}`}>
            {piecePlan.map((fraction, index) => (
              <span key={`${formatFraction(fraction)}-${index}`} className="order-piece-chip">
                {formatFraction(fraction)}
              </span>
            ))}
          </div>
          <small>
            {hasSeveralPieces ? 'このピースを合わせて販売します' : 'このピースを1つ販売します'}
          </small>
        </div>
      </div>
      <div className="fraction-card" aria-label={`目標は ${formatFraction(order.target)}`}>
        <small><FuriganaText text="目標" /></small>
        <span>{order.target.numerator}</span>
        <span>{order.target.denominator}</span>
      </div>
    </section>
  )
}
