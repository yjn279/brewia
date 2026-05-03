import type { BrewStep } from '@/lib/types'

export interface BrewPreset {
  id: string
  name: string
  description: string
  defaultBeanWeight?: number
  defaultWaterTemp?: number
  steps: BrewStep[]
}

export const BREW_PRESETS: readonly BrewPreset[] = [
  {
    id: 'hario-v60-46',
    name: 'Hario V60 4:6',
    description: 'Tetsu Kasuya 4:6 method. 5 pours, 220g total.',
    defaultBeanWeight: 20,
    defaultWaterTemp: 93,
    steps: [
      { time: 0, water: 50 },
      { time: 45, water: 40 },
      { time: 90, water: 60 },
      { time: 135, water: 40 },
      { time: 180, water: 30 },
    ],
  },
  {
    id: 'aeropress-standard',
    name: 'Aeropress Standard',
    description: 'Standard Aeropress inverted method. 200g total, press at 90s.',
    defaultBeanWeight: 17,
    defaultWaterTemp: 90,
    steps: [
      { time: 0, water: 50 },
      { time: 30, water: 150 },
      { time: 90, water: 0 },
    ],
  },
  {
    id: 'french-press',
    name: 'French Press',
    description: '4-minute steep then press. 350g total.',
    defaultBeanWeight: 25,
    defaultWaterTemp: 95,
    steps: [
      { time: 0, water: 350 },
      { time: 240, water: 0 },
    ],
  },
  {
    id: 'kalita-wave-3',
    name: 'Kalita Wave 3 Pours',
    description: '3-pour Kalita Wave method. 240g total.',
    defaultBeanWeight: 16,
    defaultWaterTemp: 92,
    steps: [
      { time: 0, water: 50 },
      { time: 45, water: 100 },
      { time: 90, water: 90 },
    ],
  },
  {
    id: 'slow-drip-cold',
    name: 'Slow Drip Cold',
    description: 'Cold brew drip method. 250g over extended time.',
    defaultBeanWeight: 30,
    defaultWaterTemp: 10,
    steps: [
      { time: 0, water: 50 },
      { time: 1800, water: 100 },
      { time: 3600, water: 100 },
    ],
  },
] as const
