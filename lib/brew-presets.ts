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
    id: 'v60-4-6',
    name: 'Hario V60 4:6',
    description: 'Tetsu Kasuya method — 5 pours, 220g total. First 40% sets sweetness/acidity, last 60% sets strength.',
    defaultBeanWeight: 30,
    defaultWaterTemp: 93,
    steps: [
      { time: 45,  water: 50  },
      { time: 90,  water: 100 },
      { time: 135, water: 145 },
      { time: 180, water: 185 },
      { time: 210, water: 220 },
    ],
  },
  {
    id: 'aeropress-standard',
    name: 'Aeropress Standard',
    description: 'Inverted Aeropress — bloom, stir, press. ~200g total, 2–3 min brew.',
    defaultBeanWeight: 15,
    defaultWaterTemp: 85,
    steps: [
      { time: 30,  water: 30  },
      { time: 60,  water: 200 },
      { time: 120, water: 200 },
    ],
  },
  {
    id: 'french-press',
    name: 'French Press',
    description: '4-minute immersion brew, 280g total. Bloom then full pour, steep and press.',
    defaultBeanWeight: 22,
    defaultWaterTemp: 95,
    steps: [
      { time: 30,  water: 55  },
      { time: 60,  water: 220 },
      { time: 300, water: 280 },
    ],
  },
  {
    id: 'kalita-wave-3-pours',
    name: 'Kalita Wave 3 Pours',
    description: 'Flat-bed dripper, 3 even pours for balanced extraction. 250g total.',
    defaultBeanWeight: 20,
    defaultWaterTemp: 93,
    steps: [
      { time: 30,  water: 40  },
      { time: 75,  water: 145 },
      { time: 120, water: 250 },
    ],
  },
] as const
