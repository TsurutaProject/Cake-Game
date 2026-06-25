import { polarToCartesian } from '../utils/cakeGeometry'

interface CuttingGuideProps {
  cuts: number
  color: string
}

export function CuttingGuide({ cuts, color }: CuttingGuideProps) {
  const center = 120
  const radius = 108
  const guideAngles = Array.from({ length: cuts }, (_, index) => (360 / cuts) * index)

  return (
    <g className="cutting-guide" aria-hidden="true">
      {guideAngles.map((angle) => {
        const point = polarToCartesian(center, center, radius, angle)
        return (
          <line
            key={angle}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            style={{ stroke: color }}
          />
        )
      })}
    </g>
  )
}
