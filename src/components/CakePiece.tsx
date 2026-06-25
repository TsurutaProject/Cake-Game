import type { PointerEvent } from 'react'
import type { CakePieceModel } from '../types/game'
import { describeCakeSlice } from '../utils/cakeGeometry'

interface CakePieceProps {
  piece: CakePieceModel
  isTrayFull: boolean
  canMove: boolean
  onMoveToTray: (piece: CakePieceModel) => void
}

const center = 120
const radius = 104

export function CakePiece({ piece, isTrayFull, canMove, onMoveToTray }: CakePieceProps) {
  const middleAngle = (piece.startAngle + piece.endAngle) / 2
  const isWholePiece = piece.endAngle - piece.startAngle >= 359.999
  const offsetAngle = ((middleAngle - 90) * Math.PI) / 180
  const offsetPoint = {
    x: (isWholePiece ? 0 : 4) * Math.cos(offsetAngle),
    y: (isWholePiece ? 0 : 4) * Math.sin(offsetAngle),
  }
  const handlePointerDown = (event: PointerEvent<SVGPathElement>): void => {
    if (!canMove) {
      return
    }

    event.preventDefault()
    window.getSelection()?.removeAllRanges()

    const handleDocumentPointerUp = (event: globalThis.PointerEvent): void => {
      if (isTrayFull) {
        return
      }

      const droppedElement = document.elementFromPoint(event.clientX, event.clientY)

      if (droppedElement?.closest('.tray') !== null) {
        onMoveToTray(piece)
      }
    }

    document.addEventListener('pointerup', handleDocumentPointerUp, { once: true })
  }

  if (isWholePiece) {
    return (
      <g className="cake-piece">
        <circle cx={center} cy={center} r={radius} fill={piece.color} aria-label="まるごとのケーキ" />
      </g>
    )
  }

  return (
    <g
      className={canMove ? 'cake-piece cake-piece--movable' : 'cake-piece'}
      transform={`translate(${offsetPoint.x} ${offsetPoint.y})`}
    >
      <path
        d={describeCakeSlice(center, center, radius, piece.startAngle, piece.endAngle)}
        fill={piece.color}
        onPointerDown={handlePointerDown}
        aria-label="切ったピース"
      />
    </g>
  )
}
