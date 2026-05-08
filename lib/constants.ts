export const STEP_TIME_INTERVAL = 1 as const
export const STEP_WATER_INTERVAL = 5 as const
export const DEFAULT_ROAST_INDEX = 2 as const

export const DEFAULT_RATINGS = {
  aroma: 4,
  acidity: 3,
  sweetness: 4,
  body: 3,
  overall: 4,
} as const

export const HISTORY_DATE_FORMAT_OPTIONS = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
} as const satisfies Intl.DateTimeFormatOptions
