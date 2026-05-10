'use client'

import { useEffect, useMemo, useState } from 'react'
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
import type { Bean, BrewWithBean, Flavor } from '@/lib/types'
import { COUNTRY_FLAGS } from '@/lib/types'
import { DEFAULT_RATINGS, STEP_TIME_INTERVAL, STEP_WATER_INTERVAL } from '@/lib/constants'
import { ChevronDown, Loader2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { SectionHeading } from '@/components/section-heading'
import { PourChart } from '@/components/pour-chart'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { BrewPresetRecord } from '@/app/brew-presets/repository'
import { toast } from '@/components/ui/use-toast'
import type { BrewStep } from '@/lib/types'
import { useBrewTimer } from '@/hooks/use-brew-timer'
import { BrewTimer } from '@/components/brew-timer'

interface NewBrewFormProps {
  mode?: "create" | "edit"
  initialBeanId?: string
  initialBrew?: BrewWithBean
  beans: Bean[]
  flavors: Flavor[]
}


export function NewBrewForm({ mode = "create", initialBeanId, initialBrew, beans, flavors }: NewBrewFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBean, setSelectedBean] = useState(initialBrew?.beanId ?? initialBeanId)
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(initialBrew?.flavors.map((flavor) => flavor.id) ?? [])
  const [notes, setNotes] = useState(initialBrew?.notes ?? '')
  
  // Brew parameters
  const [beanWeight, setBeanWeight] = useState(initialBrew ? String(initialBrew.beanWeight) : '')
  const [waterWeight, setWaterWeight] = useState(initialBrew ? String(initialBrew.waterWeight) : '')
  // 0 は未入力扱いとして空欄表示にする
  const [waterTemp, setWaterTemp] = useState(initialBrew?.waterTemp && initialBrew.waterTemp > 0 ? String(initialBrew.waterTemp) : '')
  const [grindSize, setGrindSize] = useState(initialBrew?.beanGrind && initialBrew.beanGrind > 0 ? String(initialBrew.beanGrind) : '')
  const [stepInputs, setStepInputs] = useState<Array<{ time: string; water: string }>>(
    initialBrew && initialBrew.steps.length > 0
      ? initialBrew.steps.map((step) => ({ time: String(step.time), water: String(step.water) }))
      : [{ time: '', water: '' }]
  )
  
  // Ratings
  const [aroma, setAroma] = useState([initialBrew?.aroma ?? DEFAULT_RATINGS.aroma])
  const [acidity, setAcidity] = useState([initialBrew?.acidity ?? DEFAULT_RATINGS.acidity])
  const [sweetness, setSweetness] = useState([initialBrew?.sweetness ?? DEFAULT_RATINGS.sweetness])
  const [body, setBody] = useState([initialBrew?.body ?? DEFAULT_RATINGS.body])
  const [overall, setOverall] = useState([initialBrew?.overall ?? DEFAULT_RATINGS.overall])

  // "Record later" toggle: ON iff in edit mode with overall === 0
  const [recordLater, setRecordLater] = useState(
    initialBrew !== undefined ? initialBrew.overall === 0 : false
  )

  // Brew Ratio lock: ON = scaling enabled
  const [ratioLocked, setRatioLocked] = useState(true)
  // The reference pair that defines the ratio: { bean, water } both >0
  const [ratioBasis, setRatioBasis] = useState<{ bean: number; water: number } | null>(null)

  const handleRecordLaterToggle = (checked: boolean) => {
    // When toggling OFF: if every rating is currently 0, reset to defaults
    if (!checked) {
      if (aroma[0] === 0 && acidity[0] === 0 && sweetness[0] === 0 && body[0] === 0 && overall[0] === 0) {
        setAroma([DEFAULT_RATINGS.aroma])
        setAcidity([DEFAULT_RATINGS.acidity])
        setSweetness([DEFAULT_RATINGS.sweetness])
        setBody([DEFAULT_RATINGS.body])
        setOverall([DEFAULT_RATINGS.overall])
      }
    }
    setRecordLater(checked)
  }

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

    try {
      if (!selectedBean) {
        return
      }

      const isEdit = mode === 'edit' && initialBrew
      const response = await fetch(isEdit ? `/api/brews/${initialBrew.id}` : '/api/brews', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beanId: selectedBean,
          beanWeight: parseFloat(beanWeight),
          beanGrind: grindSize ? parseFloat(grindSize) : 0,
          waterWeight: parseFloat(waterWeight),
          waterTemp: waterTemp ? parseFloat(waterTemp) : 0,
          steps,
          aroma: recordLater ? 0 : aroma[0],
          acidity: recordLater ? 0 : acidity[0],
          sweetness: recordLater ? 0 : sweetness[0],
          body: recordLater ? 0 : body[0],
          overall: recordLater ? 0 : overall[0],
          notes,
          flavorIds: recordLater ? [] : selectedFlavors,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save brew')
      }

      if (isEdit) {
        router.push(`/brews/${initialBrew.id}`)
        router.refresh()
        return
      }

      const { id } = (await response.json()) as { id: string }
      router.push(`/brews/${id}`)
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate ratio
  const ratio = beanWeight && waterWeight 
    ? (parseFloat(waterWeight) / parseFloat(beanWeight)).toFixed(1)
    : '-'

  const totalWater = Math.max(parseFloat(waterWeight) || 0, 300)
  const totalTime = useMemo(() => {
    const stepTimes = stepInputs
      .map((row) => parseFloat(row.time))
      .filter((value) => Number.isFinite(value))
    return Math.max(300, ...stepTimes, 0)
  }, [stepInputs])
  const snapToInterval = (value: number, interval: number) =>
    Math.round(value / interval) * interval
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max)

  const steps = useMemo(
    () =>
      stepInputs
        .map((row) => ({
          time: Number(row.time),
          water: Number(row.water),
        }))
        .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.water))
        .map((row) => ({
          time: clamp(snapToInterval(row.time, STEP_TIME_INTERVAL), 0, totalTime),
          water: clamp(snapToInterval(row.water, STEP_WATER_INTERVAL), 0, totalWater),
        }))
        .sort((a, b) => a.time - b.time)
        .filter(
          (step, index, list) =>
            list.findIndex((target) => target.time === step.time && target.water === step.water) === index
        ),
    [stepInputs, totalTime, totalWater]
  )

  const { status: timerStatus, elapsed: timerElapsed, start: startTimer, lap: lapTimer, stop: stopTimer, reset: resetTimer } = useBrewTimer()

  // User presets state
  const [userPresets, setUserPresets] = useState<BrewPresetRecord[]>([])
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetDescription, setPresetDescription] = useState('')
  const [isSavingPreset, setIsSavingPreset] = useState(false)

  useEffect(() => {
    fetch('/api/brew-presets')
      .then((res) => res.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setUserPresets(data as BrewPresetRecord[])
        }
      })
      .catch(() => {
        // Ignore fetch errors silently
      })
  }, [])

  const applyPreset = (preset: { steps: Array<{ time: number; water: number }>; defaultBeanWeight?: number; defaultWaterTemp?: number; defaultWaterWeight?: number }) => {
    setStepInputs(
      preset.steps.map((s) => ({
        time: String(s.time),
        water: String(s.water),
      })),
    )
    // 0 は未入力扱いなので空欄にする
    if (preset.defaultBeanWeight != null && preset.defaultBeanWeight > 0) {
      setBeanWeight(String(preset.defaultBeanWeight))
    }
    if (preset.defaultWaterTemp != null && preset.defaultWaterTemp > 0) {
      setWaterTemp(String(preset.defaultWaterTemp))
    }
    // トグル ON のとき、defaultWaterWeight が >0 なら waterWeight も上書きし、比率基準を確定する
    if (ratioLocked && preset.defaultWaterWeight != null && preset.defaultWaterWeight > 0 && preset.defaultBeanWeight != null && preset.defaultBeanWeight > 0) {
      setWaterWeight(String(preset.defaultWaterWeight))
      setRatioBasis({ bean: preset.defaultBeanWeight, water: preset.defaultWaterWeight })
    }
  }

  const handleSaveAsPreset = async () => {
    if (!presetName.trim()) return
    if (steps.length === 0) {
      toast({ title: 'Add at least one step before saving as preset', variant: 'destructive' })
      return
    }
    setIsSavingPreset(true)
    try {
      const response = await fetch('/api/brew-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: presetName.trim(),
          description: presetDescription.trim(),
          defaultBeanWeight: beanWeight ? parseFloat(beanWeight) : 0,
          defaultWaterTemp: waterTemp ? parseFloat(waterTemp) : 0,
          defaultWaterWeight: waterWeight ? parseFloat(waterWeight) : 0,
          steps,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to save preset')
      }
      toast({ title: 'Preset saved' })
      setIsSaveDialogOpen(false)
      setPresetName('')
      setPresetDescription('')
      // Refresh user presets list
      fetch('/api/brew-presets')
        .then((res) => res.json())
        .then((data: unknown) => {
          if (Array.isArray(data)) {
            setUserPresets(data as BrewPresetRecord[])
          }
        })
        .catch(() => {})
    } catch {
      toast({ title: 'Failed to save preset', variant: 'destructive' })
    } finally {
      setIsSavingPreset(false)
    }
  }

  const snapWater = (v: number) => Math.round(v / STEP_WATER_INTERVAL) * STEP_WATER_INTERVAL

  const handleBeanWeightChange = (value: string) => {
    setBeanWeight(value)
    if (!ratioLocked || !ratioBasis) return
    const newBean = parseFloat(value)
    if (!Number.isFinite(newBean) || newBean <= 0) return
    const scale = newBean / ratioBasis.bean
    const newWater = snapWater(ratioBasis.water * scale)
    setWaterWeight(String(newWater))
    setStepInputs((prev) =>
      prev.map((row) => {
        const w = parseFloat(row.water)
        if (!Number.isFinite(w)) return row
        return { ...row, water: String(snapWater(w * scale)) }
      }),
    )
  }

  const handleWaterWeightChange = (value: string) => {
    setWaterWeight(value)
    if (!ratioLocked || !ratioBasis) return
    const newWater = parseFloat(value)
    if (!Number.isFinite(newWater) || newWater <= 0) return
    const scale = newWater / ratioBasis.water
    const newBean = ratioBasis.bean * scale
    setBeanWeight(String(newBean))
    setStepInputs((prev) =>
      prev.map((row) => {
        const w = parseFloat(row.water)
        if (!Number.isFinite(w)) return row
        return { ...row, water: String(snapWater(w * scale)) }
      }),
    )
  }

  const handleRatioLockedChange = (checked: boolean) => {
    setRatioLocked(checked)
    if (checked) {
      // トグルを ON にした瞬間の現在値ペアを基準として確定する
      const bean = parseFloat(beanWeight)
      const water = parseFloat(waterWeight)
      if (Number.isFinite(bean) && bean > 0 && Number.isFinite(water) && water > 0) {
        setRatioBasis({ bean, water })
      } else {
        setRatioBasis(null)
      }
    }
  }

  const handleLap = () => {
    // Round to nearest 5 seconds
    const seconds = Math.round(timerElapsed / 5000) * 5
    setStepInputs((prev) => [...prev, { time: String(seconds), water: '' }])
    lapTimer()
  }

  const handleReset = () => {
    resetTimer()
    setStepInputs([{ time: '', water: '' }])
  }

  const handleStepInputChange = (index: number, key: keyof BrewStep, value: string) => {
    setStepInputs((prev) => {
      const next = [...prev]
      const current = next[index] ?? { time: '', water: '' }
      next[index] = { ...current, [key]: value }
      return next
    })
  }

  const commitStepInput = (index: number, key: keyof BrewStep) => {
    setStepInputs((prev) => {
      const next = [...prev]
      const target = next[index]
      if (!target) return prev
      const raw = Number(target[key])
      if (!Number.isFinite(raw)) return prev
      const max = key === 'time' ? totalTime : totalWater
      next[index] = {
        ...target,
        [key]: String(clamp(snapToInterval(raw, key === 'time' ? STEP_TIME_INTERVAL : STEP_WATER_INTERVAL), 0, max)),
      }
      return next
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Bean Selection */}
      <Card>
        <SectionHeading>Select Bean</SectionHeading>
        <Field>
          <FieldLabel htmlFor="bean-select">Bean</FieldLabel>
          <Select value={selectedBean} onValueChange={setSelectedBean} required>
            <SelectTrigger id="bean-select">
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
        </Field>
      </Card>

      {/* Brew Parameters */}
      <Card>
        <SectionHeading>Parameters</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="beanWeight">Coffee</FieldLabel>
            <div className="relative">
              <Input
                id="beanWeight"
                type="number"
                value={beanWeight}
                onChange={(e) => handleBeanWeightChange(e.target.value)}
                min="1"
                step="any"
                placeholder="0"
                required
                className="pr-8 text-right"
                aria-describedby="beanWeight-unit"
              />
              <span id="beanWeight-unit" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="waterWeight">Water</FieldLabel>
            <div className="relative">
              <Input
                id="waterWeight"
                type="number"
                value={waterWeight}
                onChange={(e) => handleWaterWeightChange(e.target.value)}
                min="1"
                step="any"
                required
                placeholder="0"
                className="pr-8 text-right"
                aria-describedby="waterWeight-unit"
              />
              <span id="waterWeight-unit" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="waterTemp">Temp</FieldLabel>
            <div className="relative">
              <Input
                id="waterTemp"
                type="number"
                value={waterTemp}
                onChange={(e) => setWaterTemp(e.target.value)}
                min="80"
                max="100"
                required
                placeholder="0"
                className="pr-8 text-right"
                aria-describedby="waterTemp-unit"
              />
              <span id="waterTemp-unit" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">°C</span>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="grindSize">Grind</FieldLabel>
            <div className="relative">
              <Input
                id="grindSize"
                type="number"
                value={grindSize}
                onChange={(e) => setGrindSize(e.target.value)}
                min="1"
                placeholder="0"
                required
                className="pr-14 text-right"
                aria-describedby="grindSize-unit"
              />
              <span id="grindSize-unit" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">clicks</span>
            </div>
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Brew Ratio</span>
            <span className="font-mono text-lg font-medium">1:{ratio}</span>
          </div>
          <Label
            htmlFor="ratio-lock-toggle"
            className="flex cursor-pointer items-center gap-2 text-sm font-normal text-muted-foreground"
          >
            Keep ratio
            <Switch
              id="ratio-lock-toggle"
              checked={ratioLocked}
              onCheckedChange={handleRatioLockedChange}
              aria-label="Keep ratio"
            />
          </Label>
        </div>
      </Card>

      {/* Extraction Steps */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading className="mb-0">Extraction Steps</SectionHeading>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                aria-label="Insert preset"
              >
                Insert preset
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {userPresets.length === 0 ? (
                <DropdownMenuItem disabled>
                  No saved presets yet
                </DropdownMenuItem>
              ) : (
                userPresets.map((preset) => (
                  <DropdownMenuItem
                    key={preset.id}
                    onSelect={() => applyPreset(preset)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{preset.name}</span>
                      {preset.description && (
                        <span className="text-xs text-muted-foreground">{preset.description}</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-4">
          <PourChart steps={steps} totalWater={totalWater} variant="chart-only" />
        </div>

        <div className="mb-4">
          <BrewTimer
            status={timerStatus}
            elapsed={timerElapsed}
            onStart={startTimer}
            onLap={handleLap}
            onStop={stopTimer}
            onReset={handleReset}
          />
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Time</span>
            <span>Water</span>
            <span />
          </div>
          {stepInputs.map((stepInput, index) => (
            <div key={`step-input-${index}`} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max={totalTime}
                  step={STEP_TIME_INTERVAL}
                  value={stepInput.time}
                  onChange={(e) => handleStepInputChange(index, 'time', e.target.value)}
                  onBlur={() => commitStepInput(index, 'time')}
                  placeholder="0"
                  className="pr-8 text-right"
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
                  value={stepInput.water}
                  onChange={(e) => handleStepInputChange(index, 'water', e.target.value)}
                  onBlur={() => commitStepInput(index, 'water')}
                  placeholder="0"
                  className="pr-8 text-right"
                  aria-label={`Step ${index + 1} water`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">g</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setStepInputs((prev) => {
                    if (prev.length <= 1) return prev
                    return prev.filter((_, targetIndex) => targetIndex !== index)
                  })
                }}
                disabled={stepInputs.length <= 1}
                aria-label={`Delete step ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setStepInputs((prev) => [...prev, { time: '', water: '' }])}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Step
          </Button>
        </div>
      </Card>

      {/* Cup */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading className="mb-0">Cup</SectionHeading>
          <Label
            htmlFor="record-later-toggle"
            className="cursor-pointer text-sm font-normal text-muted-foreground"
          >
            あとで記録
            <Switch
              id="record-later-toggle"
              checked={recordLater}
              onCheckedChange={handleRecordLaterToggle}
              aria-label="あとで記録"
            />
          </Label>
        </div>

        {!recordLater && (
          <>
            {/* Taste Profile */}
            <div className="mb-4 flex flex-col gap-5">
              {[
                { label: 'Aroma', value: aroma, setValue: setAroma },
                { label: 'Acidity', value: acidity, setValue: setAcidity },
                { label: 'Sweetness', value: sweetness, setValue: setSweetness },
                { label: 'Body', value: body, setValue: setBody },
                { label: 'Overall', value: overall, setValue: setOverall },
              ].map((rating) => {
                const sliderId = `rating-${rating.label.toLowerCase()}`
                return (
                  <Field key={rating.label}>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor={sliderId}>{rating.label}</FieldLabel>
                      <span className="text-sm text-muted-foreground">
                        {rating.value[0]}
                      </span>
                    </div>
                    <Slider
                      id={sliderId}
                      value={rating.value}
                      onValueChange={rating.setValue}
                      min={1}
                      max={5}
                      step={1}
                    />
                  </Field>
                )
              })}
            </div>

            {/* Flavor Notes */}
            <div>
              <SectionHeading level="h3">Flavor Notes</SectionHeading>
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
          </>
        )}
      </Card>

      {/* Notes */}
      <Card>
        <SectionHeading>Tasting Notes</SectionHeading>
        <Textarea
          placeholder="How was this brew? Any observations?"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </Card>

      {/* Save as preset */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Save as Preset
        </h2>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setIsSaveDialogOpen(true)}
        >
          Save current as preset
        </Button>
      </div>

      {/* Submit */}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          mode === 'edit' ? 'Save Brew' : 'Log Brew'
        )}
      </Button>

      {/* Save preset dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Preset</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="preset-name">Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g. My V60 Recipe"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="preset-description">Description (optional)</Label>
              <Textarea
                id="preset-description"
                placeholder="Describe this preset..."
                rows={2}
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
              disabled={isSavingPreset}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!presetName.trim() || isSavingPreset}
              onClick={handleSaveAsPreset}
            >
              {isSavingPreset ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
