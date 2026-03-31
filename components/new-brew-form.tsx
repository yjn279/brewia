'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { beans, flavors } from '@/lib/data'
import { COUNTRY_FLAGS } from '@/lib/types'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BrewStep } from '@/lib/types'

interface NewBrewFormProps {
  initialBeanId?: string
}

const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Exceptional']
const STEP_TIME_INTERVAL = 5
const STEP_WATER_INTERVAL = 5
const CHART_PLOT_PADDING = {
  top: 10,
  right: 12,
  bottom: 28,
  left: 36,
}

export function NewBrewForm({ initialBeanId }: NewBrewFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBean, setSelectedBean] = useState(initialBeanId)
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  
  // Brew parameters
  const [beanWeight, setBeanWeight] = useState('15')
  const [waterWeight, setWaterWeight] = useState('300')
  const [waterTemp, setWaterTemp] = useState('92')
  const [grindSize, setGrindSize] = useState('24')
  const [brewTime, setBrewTime] = useState('300')
  const [steps, setSteps] = useState<BrewStep[]>([
    { time: 300, water: 300 },
  ])
  const [draggingStepIndex, setDraggingStepIndex] = useState<number | null>(null)
  
  // Ratings
  const [aroma, setAroma] = useState([4])
  const [acidity, setAcidity] = useState([3])
  const [sweetness, setSweetness] = useState([4])
  const [body, setBody] = useState([3])
  const [overall, setOverall] = useState([4])

  const toggleFlavor = (flavorId: string) => {
    setSelectedFlavors((prev) =>
      prev.includes(flavorId)
        ? prev.filter((id) => id !== flavorId)
        : [...prev, flavorId]
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    // In a real app, this would create the brew in the database
    router.push('/brews')
  }

  // Calculate ratio
  const ratio = beanWeight && waterWeight 
    ? (parseFloat(waterWeight) / parseFloat(beanWeight)).toFixed(1)
    : '-'

  const totalWater = parseFloat(waterWeight) || 1
  const totalTime = parseFloat(brewTime) || 1
  const snapToInterval = (value: number, interval: number) =>
    Math.round(value / interval) * interval
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max)

  const addStepFromGraph = (event: React.PointerEvent<HTMLDivElement>) => {
    if (draggingStepIndex !== null) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const plotWidth = bounds.width - CHART_PLOT_PADDING.left - CHART_PLOT_PADDING.right
    const plotHeight = bounds.height - CHART_PLOT_PADDING.top - CHART_PLOT_PADDING.bottom
    const x = Math.min(
      Math.max(event.clientX - bounds.left - CHART_PLOT_PADDING.left, 0),
      plotWidth
    )
    const y = Math.min(
      Math.max(event.clientY - bounds.top - CHART_PLOT_PADDING.top, 0),
      plotHeight
    )

    const nextTime = clamp(
      snapToInterval((x / plotWidth) * totalTime, STEP_TIME_INTERVAL),
      0,
      totalTime
    )
    const nextWater = clamp(
      snapToInterval(((plotHeight - y) / plotHeight) * totalWater, STEP_WATER_INTERVAL),
      0,
      totalWater
    )

    setSteps((prev) => {
      const next = [...prev, { time: nextTime, water: nextWater }]
        .sort((a, b) => a.time - b.time)
        .filter(
          (step, index, list) =>
            list.findIndex((target) => target.time === step.time && target.water === step.water) === index
        )
      return next
    })
  }

  const updateStep = (index: number, key: keyof BrewStep, value: number) => {
    setSteps((prev) => {
      const next = [...prev]
      const interval = key === 'time' ? STEP_TIME_INTERVAL : STEP_WATER_INTERVAL
      const max = key === 'time' ? totalTime : totalWater
      next[index] = { ...next[index], [key]: clamp(snapToInterval(value, interval), 0, max) }
      return next.sort((a, b) => a.time - b.time)
    })
  }

  const removeStep = (index: number) => {
    setSteps((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, targetIndex) => targetIndex !== index)
    })
  }

  const updateStepFromPointer = (
    event: React.PointerEvent<HTMLDivElement>,
    targetIndex: number
  ) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const plotWidth = bounds.width - CHART_PLOT_PADDING.left - CHART_PLOT_PADDING.right
    const plotHeight = bounds.height - CHART_PLOT_PADDING.top - CHART_PLOT_PADDING.bottom
    const x = Math.min(
      Math.max(event.clientX - bounds.left - CHART_PLOT_PADDING.left, 0),
      plotWidth
    )
    const y = Math.min(
      Math.max(event.clientY - bounds.top - CHART_PLOT_PADDING.top, 0),
      plotHeight
    )
    const updatedStep = {
      time: clamp(
        snapToInterval((x / plotWidth) * totalTime, STEP_TIME_INTERVAL),
        0,
        totalTime
      ),
      water: clamp(
        snapToInterval(((plotHeight - y) / plotHeight) * totalWater, STEP_WATER_INTERVAL),
        0,
        totalWater
      ),
    }

    setSteps((prev) => {
      const next = [...prev]
      next[targetIndex] = updatedStep
      return next.sort((a, b) => a.time - b.time)
    })
  }

  const renderChartDot = (props: {
    cx?: number
    cy?: number
    index?: number
  }) => {
    if (props.cx == null || props.cy == null || props.index == null) return <g />
    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={6}
        fill="var(--chart-2)"
        stroke="var(--background)"
        strokeWidth={2}
        className="cursor-grab active:cursor-grabbing"
        onPointerDown={(event) => {
          event.stopPropagation()
          setDraggingStepIndex(props.index!)
        }}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Bean Selection */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Select Bean
        </h2>
        <Select value={selectedBean} onValueChange={setSelectedBean} required>
          <SelectTrigger>
            <SelectValue placeholder="Choose a bean" />
          </SelectTrigger>
          <SelectContent>
            {beans.map((bean) => (
              <SelectItem key={bean.id} value={bean.id}>
                <span className="flex items-center gap-2">
                  <span>{COUNTRY_FLAGS[bean.country]}</span>
                  <span>{bean.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brew Parameters */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Parameters
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="beanWeight">Coffee (g)</Label>
            <Input
              id="beanWeight"
              type="number"
              value={beanWeight}
              onChange={(e) => setBeanWeight(e.target.value)}
              min="1"
              step="0.1"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="waterWeight">Water (g)</Label>
            <div className="relative">
              <Input
                id="waterWeight"
                type="number"
                value={waterWeight}
                onChange={(e) => setWaterWeight(e.target.value)}
                min="1"
                step="1"
                required
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="waterTemp">Temp (°C)</Label>
            <div className="relative">
              <Input
                id="waterTemp"
                type="number"
                value={waterTemp}
                onChange={(e) => setWaterTemp(e.target.value)}
                min="80"
                max="100"
                required
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">°C</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="grindSize">Grind (clicks)</Label>
            <Input
              id="grindSize"
              type="number"
              value={grindSize}
              onChange={(e) => setGrindSize(e.target.value)}
              min="1"
              placeholder="clicks"
              required
            />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="brewTime">Total Time (sec)</Label>
            <div className="relative">
              <Input
                id="brewTime"
                type="number"
                value={brewTime}
                onChange={(e) => setBrewTime(e.target.value)}
                min="30"
                step="5"
                required
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">s</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center rounded-lg bg-secondary p-3">
          <span className="text-sm text-muted-foreground">Brew Ratio</span>
          <span className="ml-2 font-mono text-lg font-medium">1:{ratio}</span>
        </div>
      </div>

      {/* Extraction Steps */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Extraction Steps
          </h2>
          <span className="text-xs text-muted-foreground">Tap chart to add</span>
        </div>

        <div
          className="relative mb-4 h-44 cursor-crosshair rounded-lg border border-border/60 bg-secondary/20 p-2"
          onPointerDown={addStepFromGraph}
          onPointerMove={(e) => {
            if (draggingStepIndex === null) return
            updateStepFromPointer(e, draggingStepIndex)
          }}
          onPointerUp={() => setDraggingStepIndex(null)}
          onPointerLeave={() => setDraggingStepIndex(null)}
          aria-label="Tap extraction chart to add a step"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={steps}
              margin={{
                top: CHART_PLOT_PADDING.top,
                right: CHART_PLOT_PADDING.right,
                bottom: CHART_PLOT_PADDING.bottom,
                left: CHART_PLOT_PADDING.left,
              }}
            >
              <defs>
                <linearGradient id="stepFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" />
              <XAxis
                dataKey="time"
                domain={[0, totalTime]}
                type="number"
                tickFormatter={(v) => `${v}s`}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              />
              <YAxis
                dataKey="water"
                domain={[0, totalWater]}
                tickFormatter={(v) => `${v}g`}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                width={34}
              />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'water' ? [`${value}g`, 'Water'] : [value, name]
                }
                labelFormatter={(label) => `${label}s`}
              />
              <Area
                type="monotone"
                dataKey="water"
                stroke="var(--chart-2)"
                strokeWidth={2}
                fill="url(#stepFill)"
                isAnimationActive={false}
                dot={renderChartDot}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Time (s)</span>
            <span>Water (g)</span>
            <span />
          </div>
          {steps.map((step, index) => (
            <div key={`${step.time}-${step.water}-${index}`} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max={totalTime}
                  step={STEP_TIME_INTERVAL}
                  value={step.time}
                  onChange={(e) => updateStep(index, 'time', Number(e.target.value))}
                  className="pr-8"
                  aria-label={`Step ${index + 1} time`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">s</span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max={totalWater}
                  step={STEP_WATER_INTERVAL}
                  value={step.water}
                  onChange={(e) => updateStep(index, 'water', Number(e.target.value))}
                  className="pr-8"
                  aria-label={`Step ${index + 1} water`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeStep(index)}
                disabled={steps.length <= 1}
                aria-label={`Delete step ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Taste Ratings */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Taste Profile
        </h2>
        <div className="flex flex-col gap-5">
          {[
            { label: 'Aroma', value: aroma, setValue: setAroma },
            { label: 'Acidity', value: acidity, setValue: setAcidity },
            { label: 'Sweetness', value: sweetness, setValue: setSweetness },
            { label: 'Body', value: body, setValue: setBody },
            { label: 'Overall', value: overall, setValue: setOverall },
          ].map((rating) => (
            <div key={rating.label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>{rating.label}</Label>
                <span className="text-sm text-muted-foreground">
                  {rating.value[0]} - {ratingLabels[rating.value[0]]}
                </span>
              </div>
              <Slider
                value={rating.value}
                onValueChange={rating.setValue}
                min={1}
                max={5}
                step={1}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Flavor Tags */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Flavor Notes
        </h2>
        <div className="flex flex-wrap gap-2">
          {flavors.map((flavor) => {
            const isSelected = selectedFlavors.includes(flavor.id)
            return (
              <button
                key={flavor.id}
                type="button"
                onClick={() => toggleFlavor(flavor.id)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {flavor.name}
                {isSelected && <X className="h-3 w-3" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Tasting Notes
        </h2>
        <Textarea
          placeholder="How was this brew? Any observations?"
          rows={3}
        />
      </div>

      {/* Submit */}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Log Brew'
        )}
      </Button>
    </form>
  )
}
