import type { CakePieceModel, Topping } from '../types/game'
import { normalizeAngle, polarToCartesian } from '../utils/cakeGeometry'

interface ToppingLayerProps {
  toppings: Topping[]
  cutToppingIds: string[]
  pieces: CakePieceModel[]
}

const center = 120

const isToppingOnBoard = (topping: Topping, pieces: CakePieceModel[]): boolean =>
  pieces.some((piece) => {
    const angle = normalizeAngle(topping.angle)
    const pieceEndAngle = piece.endAngle

    if (pieceEndAngle > 360) {
      const comparableAngle = angle < piece.startAngle ? angle + 360 : angle
      return comparableAngle >= piece.startAngle - 0.001 && comparableAngle <= pieceEndAngle + 0.001
    }

    return angle >= piece.startAngle - 0.001 && angle <= pieceEndAngle + 0.001
  })

export function ToppingLayer({ toppings, cutToppingIds, pieces }: ToppingLayerProps) {
  return (
    <g className="topping-layer" aria-label="トッピング">
      {toppings.filter((topping) => isToppingOnBoard(topping, pieces)).map((topping) => {
        const point = polarToCartesian(center, center, topping.radius, topping.angle)
        const isCut = cutToppingIds.includes(topping.id)

        if (topping.kind === 'strawberry') {
          return (
            <g
              key={topping.id}
              className={isCut ? 'topping topping--cut' : 'topping'}
              aria-label={topping.label}
            >
              <path
                d={`M ${point.x} ${point.y - 12} C ${point.x + 16} ${point.y - 8}, ${point.x + 12} ${point.y + 14}, ${point.x} ${point.y + 18} C ${point.x - 12} ${point.y + 14}, ${point.x - 16} ${point.y - 8}, ${point.x} ${point.y - 12} Z`}
                className="topping__strawberry"
              />
              <circle cx={point.x - 4} cy={point.y + 1} r="1.8" className="topping__seed" />
              <circle cx={point.x + 4} cy={point.y + 4} r="1.8" className="topping__seed" />
              <path
                d={`M ${point.x - 8} ${point.y - 13} L ${point.x} ${point.y - 20} L ${point.x + 8} ${point.y - 13}`}
                className="topping__leaf"
              />
              {isCut ? <line x1={point.x} y1={point.y - 17} x2={point.x} y2={point.y + 19} /> : null}
            </g>
          )
        }

        if (topping.kind === 'chocolate') {
          return (
            <g
              key={topping.id}
              className={isCut ? 'topping topping--cut' : 'topping'}
              aria-label={topping.label}
            >
              <rect
                x={point.x - 13}
                y={point.y - 10}
                width="26"
                height="20"
                rx="4"
                className="topping__chocolate"
              />
              <line x1={point.x} y1={point.y - 9} x2={point.x} y2={point.y + 9} className="topping__chocolate-line" />
              {isCut ? <line x1={point.x - 15} y1={point.y - 12} x2={point.x + 15} y2={point.y + 12} /> : null}
            </g>
          )
        }

        return (
          <g
            key={topping.id}
            className={isCut ? 'topping topping--cut' : 'topping'}
            aria-label={topping.label}
          >
            <circle cx={point.x} cy={point.y} r="14" className="topping__cream" />
            <circle cx={point.x - 5} cy={point.y - 3} r="4" className="topping__cream-shine" />
            {isCut ? <line x1={point.x - 15} y1={point.y} x2={point.x + 15} y2={point.y} /> : null}
          </g>
        )
      })}
    </g>
  )
}
