import type { Order } from '../types/game'
import { formatFraction } from '../utils/fraction'
import { FuriganaText } from './FuriganaText'

interface OrderBubbleProps {
  order: Order
  cakeName: string
}

const genderLabel: Record<Order['gender'], string> = {
  girl: '女の子',
  boy: '男の子',
  adult: '大人',
}

export function OrderBubble({ order, cakeName }: OrderBubbleProps) {
  return (
    <section className="order-bubble" aria-label="注文">
      <div>
        <p className="order-bubble__name">{order.customerName}さんの<FuriganaText text="注文" /></p>
        <p className="order-bubble__profile">
          {order.age}<FuriganaText text="才" />・<FuriganaText text={genderLabel[order.gender]} />・<FuriganaText text={cakeName} />
        </p>
        <p className="order-bubble__message"><FuriganaText text={order.message} /></p>
      </div>
      <div className="fraction-card" aria-label={`目標は ${formatFraction(order.target)}`}>
        <span>{order.target.numerator}</span>
        <span>{order.target.denominator}</span>
      </div>
    </section>
  )
}
