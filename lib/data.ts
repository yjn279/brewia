import type { Bean, Brew, Flavor, BrewFlavor, BrewWithBean } from './types'

export const beans: Bean[] = [
  {
    id: 'bean-1',
    name: 'Yirgacheffe Kochere',
    country: 'Ethiopia',
    region: 'Yirgacheffe',
    farm: 'Kochere Washing Station',
    process: 'Washed',
    variety: 'Heirloom',
    roast: 2,
    roaster: 'Onibus Coffee',
    notes: 'Floral and citrus notes with a tea-like body',
    created: '2026-03-01T09:00:00Z',
    updated: '2026-03-01T09:00:00Z',
  },
  {
    id: 'bean-2',
    name: 'Gesha Village',
    country: 'Panama',
    region: 'Boquete',
    farm: 'Hacienda La Esmeralda',
    process: 'Natural',
    variety: 'Gesha',
    roast: 2,
    roaster: 'Trunk Coffee',
    notes: 'Jasmine, bergamot, and tropical fruits',
    created: '2026-02-15T10:00:00Z',
    updated: '2026-02-15T10:00:00Z',
  },
  {
    id: 'bean-3',
    name: 'Finca El Injerto',
    country: 'Guatemala',
    region: 'Huehuetenango',
    farm: 'El Injerto',
    process: 'Washed',
    variety: 'Bourbon',
    roast: 3,
    roaster: 'Fuglen Coffee',
    notes: 'Chocolate, caramel, and stone fruits',
    created: '2026-02-01T08:00:00Z',
    updated: '2026-02-01T08:00:00Z',
  },
  {
    id: 'bean-4',
    name: 'Cerrado Natural',
    country: 'Brazil',
    region: 'Cerrado Mineiro',
    farm: 'Fazenda Cachoeira',
    process: 'Natural',
    variety: 'Yellow Bourbon',
    roast: 4,
    roaster: 'About Life Coffee',
    notes: 'Nutty sweetness with chocolate undertones',
    created: '2026-01-20T11:00:00Z',
    updated: '2026-01-20T11:00:00Z',
  },
  {
    id: 'bean-5',
    name: 'Finca La Cabana',
    country: 'Colombia',
    region: 'Huila',
    farm: 'La Cabana',
    process: 'Honey',
    variety: 'Caturra',
    roast: 3,
    roaster: 'Koffee Mameya',
    notes: 'Red apple, honey, and milk chocolate',
    created: '2026-01-10T09:30:00Z',
    updated: '2026-01-10T09:30:00Z',
  },
  {
    id: 'bean-6',
    name: 'Mount Elgon AA',
    country: 'Kenya',
    region: 'Mount Elgon',
    farm: 'Cooperative',
    process: 'Washed',
    variety: 'SL28',
    roast: 2,
    roaster: 'Glitch Coffee',
    notes: 'Blackcurrant, grapefruit, and vibrant acidity',
    created: '2025-12-28T14:00:00Z',
    updated: '2025-12-28T14:00:00Z',
  },
]

export const flavors: Flavor[] = [
  { id: 'f-1', name: 'Jasmine', category: 'Floral', subcategory: 'Flower', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-2', name: 'Bergamot', category: 'Citrus', subcategory: 'Citrus Fruit', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-3', name: 'Blueberry', category: 'Fruity', subcategory: 'Berry', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-4', name: 'Chocolate', category: 'Sweet', subcategory: 'Cocoa', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-5', name: 'Caramel', category: 'Sweet', subcategory: 'Sugar', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-6', name: 'Honey', category: 'Sweet', subcategory: 'Sugar', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-7', name: 'Stone Fruit', category: 'Fruity', subcategory: 'Stone Fruit', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-8', name: 'Lemon', category: 'Citrus', subcategory: 'Citrus Fruit', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-9', name: 'Black Tea', category: 'Other', subcategory: 'Tea', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-10', name: 'Tropical', category: 'Fruity', subcategory: 'Tropical Fruit', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-11', name: 'Nutty', category: 'Other', subcategory: 'Nut', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-12', name: 'Red Apple', category: 'Fruity', subcategory: 'Pome Fruit', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-13', name: 'Blackcurrant', category: 'Fruity', subcategory: 'Berry', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
  { id: 'f-14', name: 'Grapefruit', category: 'Citrus', subcategory: 'Citrus Fruit', created: '2026-01-01T00:00:00Z', updated: '2026-01-01T00:00:00Z' },
]

export const brews: Brew[] = [
  {
    id: 'brew-1',
    beanId: 'bean-1',
    beanWeight: 15,
    beanGrind: 24,
    waterWeight: 225,
    waterTemp: 92,
    steps: [
      { time: 0, water: 0 },
      { time: 30, water: 45 },
      { time: 60, water: 120 },
      { time: 90, water: 180 },
      { time: 120, water: 225 },
    ],
    aroma: 5,
    acidity: 4,
    sweetness: 4,
    body: 3,
    overall: 5,
    notes: 'Beautiful floral aroma, clean cup with citrus finish',
    created: '2026-03-25T08:30:00Z',
    updated: '2026-03-25T08:30:00Z',
  },
  {
    id: 'brew-2',
    beanId: 'bean-2',
    beanWeight: 18,
    beanGrind: 22,
    waterWeight: 270,
    waterTemp: 90,
    steps: [
      { time: 0, water: 0 },
      { time: 30, water: 50 },
      { time: 60, water: 135 },
      { time: 90, water: 200 },
      { time: 120, water: 270 },
    ],
    aroma: 5,
    acidity: 3,
    sweetness: 5,
    body: 4,
    overall: 5,
    notes: 'Exceptional complexity, jasmine tea notes throughout',
    created: '2026-03-24T09:00:00Z',
    updated: '2026-03-24T09:00:00Z',
  },
  {
    id: 'brew-3',
    beanId: 'bean-3',
    beanWeight: 16,
    beanGrind: 26,
    waterWeight: 240,
    waterTemp: 94,
    steps: [
      { time: 0, water: 0 },
      { time: 30, water: 48 },
      { time: 60, water: 120 },
      { time: 90, water: 180 },
      { time: 120, water: 240 },
    ],
    aroma: 4,
    acidity: 3,
    sweetness: 4,
    body: 4,
    overall: 4,
    notes: 'Rich chocolate notes, balanced sweetness',
    created: '2026-03-23T07:45:00Z',
    updated: '2026-03-23T07:45:00Z',
  },
  {
    id: 'brew-4',
    beanId: 'bean-1',
    beanWeight: 15,
    beanGrind: 22,
    waterWeight: 225,
    waterTemp: 93,
    steps: [
      { time: 0, water: 0 },
      { time: 30, water: 45 },
      { time: 60, water: 110 },
      { time: 90, water: 170 },
      { time: 120, water: 225 },
    ],
    aroma: 4,
    acidity: 5,
    sweetness: 3,
    body: 3,
    overall: 4,
    notes: 'Slightly over-extracted but still enjoyable bright acidity',
    created: '2026-03-22T08:15:00Z',
    updated: '2026-03-22T08:15:00Z',
  },
  {
    id: 'brew-5',
    beanId: 'bean-5',
    beanWeight: 17,
    beanGrind: 25,
    waterWeight: 255,
    waterTemp: 91,
    steps: [
      { time: 0, water: 0 },
      { time: 30, water: 51 },
      { time: 60, water: 127 },
      { time: 90, water: 191 },
      { time: 120, water: 255 },
    ],
    aroma: 4,
    acidity: 3,
    sweetness: 5,
    body: 4,
    overall: 4,
    notes: 'Honey sweetness shines through, lovely mouthfeel',
    created: '2026-03-21T09:30:00Z',
    updated: '2026-03-21T09:30:00Z',
  },
  {
    id: 'brew-6',
    beanId: 'bean-6',
    beanWeight: 15,
    beanGrind: 23,
    waterWeight: 225,
    waterTemp: 92,
    steps: [
      { time: 0, water: 0 },
      { time: 30, water: 45 },
      { time: 60, water: 112 },
      { time: 90, water: 168 },
      { time: 120, water: 225 },
    ],
    aroma: 5,
    acidity: 5,
    sweetness: 3,
    body: 3,
    overall: 4,
    notes: 'Vibrant acidity, blackcurrant notes prominent',
    created: '2026-03-20T08:00:00Z',
    updated: '2026-03-20T08:00:00Z',
  },
]

export const brewFlavors: BrewFlavor[] = [
  { id: 'bf-1', brewId: 'brew-1', flavorId: 'f-1', created: '2026-03-25T08:30:00Z', updated: '2026-03-25T08:30:00Z' },
  { id: 'bf-2', brewId: 'brew-1', flavorId: 'f-8', created: '2026-03-25T08:30:00Z', updated: '2026-03-25T08:30:00Z' },
  { id: 'bf-3', brewId: 'brew-1', flavorId: 'f-9', created: '2026-03-25T08:30:00Z', updated: '2026-03-25T08:30:00Z' },
  { id: 'bf-4', brewId: 'brew-2', flavorId: 'f-1', created: '2026-03-24T09:00:00Z', updated: '2026-03-24T09:00:00Z' },
  { id: 'bf-5', brewId: 'brew-2', flavorId: 'f-2', created: '2026-03-24T09:00:00Z', updated: '2026-03-24T09:00:00Z' },
  { id: 'bf-6', brewId: 'brew-2', flavorId: 'f-10', created: '2026-03-24T09:00:00Z', updated: '2026-03-24T09:00:00Z' },
  { id: 'bf-7', brewId: 'brew-3', flavorId: 'f-4', created: '2026-03-23T07:45:00Z', updated: '2026-03-23T07:45:00Z' },
  { id: 'bf-8', brewId: 'brew-3', flavorId: 'f-5', created: '2026-03-23T07:45:00Z', updated: '2026-03-23T07:45:00Z' },
  { id: 'bf-9', brewId: 'brew-3', flavorId: 'f-7', created: '2026-03-23T07:45:00Z', updated: '2026-03-23T07:45:00Z' },
  { id: 'bf-10', brewId: 'brew-4', flavorId: 'f-1', created: '2026-03-22T08:15:00Z', updated: '2026-03-22T08:15:00Z' },
  { id: 'bf-11', brewId: 'brew-4', flavorId: 'f-8', created: '2026-03-22T08:15:00Z', updated: '2026-03-22T08:15:00Z' },
  { id: 'bf-12', brewId: 'brew-5', flavorId: 'f-6', created: '2026-03-21T09:30:00Z', updated: '2026-03-21T09:30:00Z' },
  { id: 'bf-13', brewId: 'brew-5', flavorId: 'f-12', created: '2026-03-21T09:30:00Z', updated: '2026-03-21T09:30:00Z' },
  { id: 'bf-14', brewId: 'brew-5', flavorId: 'f-4', created: '2026-03-21T09:30:00Z', updated: '2026-03-21T09:30:00Z' },
  { id: 'bf-15', brewId: 'brew-6', flavorId: 'f-13', created: '2026-03-20T08:00:00Z', updated: '2026-03-20T08:00:00Z' },
  { id: 'bf-16', brewId: 'brew-6', flavorId: 'f-14', created: '2026-03-20T08:00:00Z', updated: '2026-03-20T08:00:00Z' },
]

export function getBrewsWithBeans(): BrewWithBean[] {
  return brews.map((brew) => {
    const bean = beans.find((b) => b.id === brew.beanId)!
    const flavorIds = brewFlavors
      .filter((bf) => bf.brewId === brew.id)
      .map((bf) => bf.flavorId)
    const brewFlavorList = flavors.filter((f) => flavorIds.includes(f.id))
    return { ...brew, bean, flavors: brewFlavorList }
  })
}

export function getBeanById(id: string): Bean | undefined {
  return beans.find((b) => b.id === id)
}

export function getBrewById(id: string): BrewWithBean | undefined {
  const brew = brews.find((b) => b.id === id)
  if (!brew) return undefined
  const bean = beans.find((b) => b.id === brew.beanId)!
  const flavorIds = brewFlavors
    .filter((bf) => bf.brewId === brew.id)
    .map((bf) => bf.flavorId)
  const brewFlavorList = flavors.filter((f) => flavorIds.includes(f.id))
  return { ...brew, bean, flavors: brewFlavorList }
}

export function getBrewsByBeanId(beanId: string): BrewWithBean[] {
  return brews
    .filter((brew) => brew.beanId === beanId)
    .map((brew) => {
      const bean = beans.find((b) => b.id === brew.beanId)!
      const flavorIds = brewFlavors
        .filter((bf) => bf.brewId === brew.id)
        .map((bf) => bf.flavorId)
      const brewFlavorList = flavors.filter((f) => flavorIds.includes(f.id))
      return { ...brew, bean, flavors: brewFlavorList }
    })
}

export const countryFlags: Record<string, string> = {
  Ethiopia: '🇪🇹',
  Panama: '🇵🇦',
  Guatemala: '🇬🇹',
  Brazil: '🇧🇷',
  Colombia: '🇨🇴',
  Kenya: '🇰🇪',
  'Costa Rica': '🇨🇷',
  Indonesia: '🇮🇩',
  Rwanda: '🇷🇼',
  Yemen: '🇾🇪',
  Blended: '🫙',
}
