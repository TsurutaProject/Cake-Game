import type { Order } from '../types/game'
import { formatFraction } from '../utils/fraction'

interface CustomerQueueProps {
  orders: Order[]
  activeOrderId: string
  getCakeName: (cakeId: Order['cakeKind']) => string
  onSelectOrder: (orderId: string) => void
}

const genderLabel: Record<Order['gender'], string> = {
  girl: '女の子',
  boy: '男の子',
  adult: '大人',
}

export function CustomerQueue({ orders, activeOrderId, getCakeName, onSelectOrder }: CustomerQueueProps) {
  return (
    <aside className="customer-queue" aria-label="今のお客さん">
      {orders.map((order) => (
        <button
          key={order.id}
          type="button"
          className={
            order.id === activeOrderId ? 'customer-queue__item is-active' : 'customer-queue__item'
          }
          onClick={() => onSelectOrder(order.id)}
        >
          <span className="customer-queue__avatar" aria-hidden="true">
            {order.customerName.slice(0, 1)}
          </span>
          <span>
            <strong>{order.customerName}</strong>
            <small>{order.age}才・{genderLabel[order.gender]}・{getCakeName(order.cakeKind)}</small>
            <small>{formatFraction(order.target)}</small>
          </span>
        </button>
      ))}
    </aside>
  )
}
