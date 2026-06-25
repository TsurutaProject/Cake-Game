import type { Order } from '../types/game'

interface CustomerQueueProps {
  orders: Order[]
  activeOrderId: string
}

export function CustomerQueue({ orders, activeOrderId }: CustomerQueueProps) {
  return (
    <aside className="customer-queue" aria-label="今のお客さん">
      <ol className="customer-queue__list">
        {orders.map((order, index) => (
          <li
            key={`${order.id}-${index}`}
            className={
              order.id === activeOrderId ? 'customer-queue__item is-active' : 'customer-queue__item'
            }
          >
            <span className="customer-queue__avatar" aria-hidden="true">
              {order.customerName.slice(0, 1)}
            </span>
            <span className="customer-queue__details">
              <strong>{order.customerName}さん</strong>
              <small>{index === 0 ? '対応中' : `${index + 1}番目に待っています`}</small>
            </span>
          </li>
        ))}
      </ol>
    </aside>
  )
}
