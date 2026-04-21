'use client'

import {
  Area,
  AreaChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import type { BrewStep } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { SectionHeading } from '@/components/section-heading'

interface PourChartProps {
  steps: BrewStep[]
  totalWater: number
}

type ChartPoint = {
  time: number
  water: number
  stepIndex?: number
  deltaWater?: number
}

function StepTooltip(props: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
  const point = props.payload?.[0]?.payload

  if (!props.active || !point) {
    return null
  }

  if (!point.stepIndex) {
    return (
      <div className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm">
        Start
      </div>
    )
  }

  const delta = Math.max(point.deltaWater ?? 0, 0)

  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{`Step #${point.stepIndex}`}</p>
      <p className="font-mono">{`${point.time}s：${point.water}g（+${delta}g）`}</p>
    </div>
  )
}

function StepMarker(props: { cx?: number; cy?: number; stepIndex: number }) {
  const { cx, cy, stepIndex } = props

  if (cx == null || cy == null) {
    return null
  }

  const markerX = cx <= 20 ? cx + 12 : cx

  return (
    <g>
      <circle cx={markerX} cy={cy} r={10} fill="var(--chart-2)" stroke="var(--background)" strokeWidth={2} />
      <text
        x={markerX}
        y={cy + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={10}
        fontWeight={700}
        fill="var(--background)"
      >
        {stepIndex}
      </text>
    </g>
  )
}

export function PourChart({ steps, totalWater }: PourChartProps) {
  const sortedSteps = [...steps].sort((a, b) => a.time - b.time)
  const normalizedSteps = sortedSteps.length > 0 && sortedSteps[0]?.time !== 0
    ? [{ time: 0, water: 0 }, ...sortedSteps]
    : sortedSteps
  const stepTimes = [...new Set(sortedSteps.map((step) => step.time))]
    .filter((time) => time > 0)
    .sort((a, b) => a - b)
  const stepWaters = [...new Set(sortedSteps.map((step) => step.water))]
    .filter((water) => water > 0)
    .sort((a, b) => a - b)

  const chartData: ChartPoint[] = normalizedSteps.map((step, index, list) => {
    const isStartPoint = index === 0 && step.time === 0 && step.water === 0

    if (isStartPoint) {
      return {
        time: step.time,
        water: step.water,
      }
    }

    const previousWater = index > 0 ? list[index - 1]?.water ?? 0 : 0
    const stepIndex = sortedSteps.findIndex((target) => target.time === step.time && target.water === step.water) + 1

    return {
      time: step.time,
      water: step.water,
      stepIndex,
      deltaWater: step.water - previousWater,
    }
  })

  return (
    <Card>
      <SectionHeading level="h4">Pour Profile</SectionHeading>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 12, right: 14, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            type="number"
            domain={[0, 'dataMax']}
            ticks={[0, ...stepTimes]}
            padding={{ left: 0, right: 8 }}
            tickFormatter={(v) => `${v}s`}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            domain={[0, totalWater]}
            ticks={[0, ...stepWaters]}
            tickFormatter={(v) => `${v}g`}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            width={40}
          />
          {stepTimes.map((time) => (
            <ReferenceLine
              key={`time-${time}`}
              x={time}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
          ))}
          {stepWaters.map((water) => (
            <ReferenceLine
              key={`water-${water}`}
              y={water}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
          ))}
          <Tooltip content={<StepTooltip />} />
          <Area
            type="monotone"
            dataKey="water"
            stroke="none"
            fill="url(#waterGradient)"
          />
          <Line
            type="monotone"
            dataKey="water"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--chart-2)', fill: 'var(--background)' }}
          />
          {chartData
            .filter((point) => point.stepIndex)
            .map((point) => (
              <ReferenceDot
                key={`step-dot-${point.stepIndex}-${point.time}-${point.water}`}
                x={point.time}
                y={point.water}
                ifOverflow="extendDomain"
                shape={(shapeProps: { cx?: number; cy?: number }) => (
                  <StepMarker
                    cx={shapeProps.cx}
                    cy={shapeProps.cy}
                    stepIndex={point.stepIndex as number}
                  />
                )}
              />
            ))}
        </AreaChart>
      </ResponsiveContainer>
      {sortedSteps.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {sortedSteps.map((step, i) => (
            <li key={`${step.time}-${step.water}-${i}`} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Step {i + 1}</span>
              <span className="font-mono text-foreground">{step.time} s · {step.water} g</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
