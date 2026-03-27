'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

interface TasteRadarProps {
  aroma: number
  acidity: number
  sweetness: number
  body: number
  overall: number
}

export function TasteRadar({ aroma, acidity, sweetness, body, overall }: TasteRadarProps) {
  const data = [
    { attribute: 'Aroma', value: aroma },
    { attribute: 'Acidity', value: acidity },
    { attribute: 'Sweetness', value: sweetness },
    { attribute: 'Body', value: body },
    { attribute: 'Overall', value: overall },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid 
          stroke="var(--border)" 
          strokeOpacity={0.5}
        />
        <PolarAngleAxis 
          dataKey="attribute" 
          tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
          tickLine={false}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 5]} 
          tickCount={6}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="Taste"
          dataKey="value"
          stroke="var(--chart-1)"
          strokeOpacity={0.35}
          strokeWidth={1}
          fill="var(--chart-1)"
          fillOpacity={0.25}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
