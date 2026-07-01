import type { TrophyDefinition } from '../types/game'

export const trophies: TrophyDefinition[] = [
  {
    id: 'first-sale',
    title: 'はじめて販売',
    description: 'お客さん1人にぴったり販売する',
    metric: 'servedCount',
    target: 1,
  },
  {
    id: 'three-customers',
    title: 'お店が回ってきた',
    description: 'お客さん3人に販売する',
    metric: 'servedCount',
    target: 3,
  },
  {
    id: 'ten-customers',
    title: '人気パティシエ',
    description: 'お客さん10人に販売する',
    metric: 'servedCount',
    target: 10,
  },
  {
    id: 'combo-three',
    title: '3コンボ',
    description: '3コンボを達成する',
    metric: 'bestCombo',
    target: 3,
  },
  {
    id: 'combo-five',
    title: '5コンボ',
    description: '5コンボを達成する',
    metric: 'bestCombo',
    target: 5,
  },
  {
    id: 'sales-1000',
    title: '売上1,000円',
    description: '累計売上1,000円を達成する',
    metric: 'totalEarned',
    target: 1000,
  },
  {
    id: 'sales-3000',
    title: '売上3,000円',
    description: '累計売上3,000円を達成する',
    metric: 'totalEarned',
    target: 3000,
  },
  {
    id: 'clean-serve',
    title: 'きれいな提供',
    description: 'トッピングを切らずに販売する',
    metric: 'cleanServes',
    target: 1,
  },
  {
    id: 'recipe-serve',
    title: '注文通りの作り方',
    description: '作り方ボーナスを獲得する',
    metric: 'recipeServes',
    target: 1,
  },
  {
    id: 'cake-unlock',
    title: '新作ケーキ解放',
    description: 'ケーキを2種類に増やす',
    metric: 'unlockedCakeCount',
    target: 2,
  },
]
