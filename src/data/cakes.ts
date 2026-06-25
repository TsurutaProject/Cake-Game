import type { CakeDefinition } from '../types/game'

export const cakes: CakeDefinition[] = [
  {
    id: 'shortcake',
    name: 'ショートケーキ',
    price: 0,
    description: '白いクリームとイチゴの定番ケーキ。',
    baseColor: '#fff4df',
    crustColor: '#d49a63',
    centerColor: '#fff0b2',
    guideColor: '#8d6a52',
    palette: ['#fff4df', '#ffe9cf', '#fff8e8', '#ffd8c2', '#fff1dc', '#ffe2c7'],
    toppings: [
      {
        id: 'short-strawberry-top',
        kind: 'strawberry',
        label: 'イチゴ',
        angle: 88,
        radius: 66,
      },
      {
        id: 'short-chocolate-right',
        kind: 'chocolate',
        label: 'チョコ',
        angle: 54,
        radius: 82,
      },
      {
        id: 'short-cream-left',
        kind: 'cream',
        label: 'クリーム',
        angle: 238,
        radius: 70,
      },
    ],
  },
  {
    id: 'chocolate',
    name: 'チョコレートケーキ',
    price: 1000,
    description: 'トッピングがななめに並ぶ、少し切り方を考えるケーキ。',
    baseColor: '#6f3f2f',
    crustColor: '#3b2119',
    centerColor: '#c88954',
    guideColor: '#fff0b2',
    palette: ['#6f3f2f', '#7d4a36', '#5f3528', '#815039', '#6a3b2c', '#8b5740'],
    toppings: [
      {
        id: 'choco-strawberry-upper',
        kind: 'strawberry',
        label: 'イチゴ',
        angle: 90,
        radius: 72,
      },
      {
        id: 'choco-cream-lower',
        kind: 'cream',
        label: 'クリーム',
        angle: 120,
        radius: 78,
      },
      {
        id: 'choco-bar-left',
        kind: 'chocolate',
        label: 'チョコ',
        angle: 0,
        radius: 72,
      },
    ],
  },
]

export const getCakeById = (cakeId: CakeDefinition['id']): CakeDefinition =>
  cakes.find((cake) => cake.id === cakeId) ?? cakes[0]
