import type { Stage } from '../types/game'

export const stages: Stage[] = [
  {
    id: 'shop-training',
    title: 'ケーキ屋さんの分数チャレンジ',
    description: '切り方を変えながら、3ピース以内で注文ぴったりに組み合わせよう。',
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
