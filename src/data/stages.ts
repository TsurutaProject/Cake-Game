import type { Stage } from '../types/game'

export const stages: Stage[] = [
  {
    id: 'shop-training',
    title: '分ケーキ',
    description: 'ケーキを切って、注文の分数を作ろう。',
    allowedCuts: [2, 3, 4, 6, 12],
    orderIds: [
      'half',
      'three-quarters',
      'one-quarter',
      'one-third',
      'two-thirds',
      'mix-half',
      'chocolate-half',
      'chocolate-one-third',
      'chocolate-three-quarters',
      'chocolate-two-thirds',
    ],
  },
]
