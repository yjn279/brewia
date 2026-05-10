'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { STEP_TIME_INTERVAL, STEP_WATER_INTERVAL } from '@/lib/constants'
import type { BrewPresetRecord } from '@/app/brew-presets/repository'

interface PresetEditDialogProps {
  preset: BrewPresetRecord
}

export function PresetEditDialog({ preset }: PresetEditDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState(preset.name)
  const [description, setDescription] = useState(preset.description)
  // 0 は未入力扱いとして空欄表示にする
  const [defaultBeanWeight, setDefaultBeanWeight] = useState(
    preset.defaultBeanWeight > 0 ? String(preset.defaultBeanWeight) : ''
  )
  const [defaultWaterTemp, setDefaultWaterTemp] = useState(
    preset.defaultWaterTemp > 0 ? String(preset.defaultWaterTemp) : ''
  )
  const [stepInputs, setStepInputs] = useState<Array<{ time: string; water: string }>>(
    preset.steps.length > 0
      ? preset.steps.map((s) => ({ time: String(s.time), water: String(s.water) }))
      : [{ time: '', water: '' }]
  )

  const snapToInterval = (value: number, interval: number) =>
    Math.round(value / interval) * interval
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max)

  // totalWater/totalTime の派生: max(300, ...stepInputs[].water/time)
  const totalWater = useMemo(() => {
    const waterValues = stepInputs
      .map((row) => parseFloat(row.water))
      .filter((v) => Number.isFinite(v))
    return Math.max(300, ...waterValues, 0)
  }, [stepInputs])

  const totalTime = useMemo(() => {
    const timeValues = stepInputs
      .map((row) => parseFloat(row.time))
      .filter((v) => Number.isFinite(v))
    return Math.max(300, ...timeValues, 0)
  }, [stepInputs])

  const handleStepInputChange = (index: number, key: 'time' | 'water', value: string) => {
    setStepInputs((prev) => {
      const next = [...prev]
      const current = next[index] ?? { time: '', water: '' }
      next[index] = { ...current, [key]: value }
      return next
    })
  }

  const commitStepInput = (index: number, key: 'time' | 'water') => {
    setStepInputs((prev) => {
      const next = [...prev]
      const target = next[index]
      if (!target) return prev
      const raw = Number(target[key])
      if (!Number.isFinite(raw)) return prev
      const max = key === 'time' ? totalTime : totalWater
      next[index] = {
        ...target,
        [key]: String(
          clamp(
            snapToInterval(raw, key === 'time' ? STEP_TIME_INTERVAL : STEP_WATER_INTERVAL),
            0,
            max,
          )
        ),
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!name.trim()) return

    // stepInputs を BrewStep[] に変換（数値化、スナップ・クランプ済み、time 昇順、重複除去）
    const steps = stepInputs
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
          list.findIndex(
            (target) => target.time === step.time && target.water === step.water,
          ) === index,
      )

    if (steps.length === 0) {
      toast({ title: 'At least one valid step is required', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/brew-presets/${preset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          defaultBeanWeight: defaultBeanWeight ? parseFloat(defaultBeanWeight) : 0,
          defaultWaterTemp: defaultWaterTemp ? parseFloat(defaultWaterTemp) : 0,
          steps,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update preset')
      }

      toast({ title: 'Preset updated' })
      setIsOpen(false)
      router.refresh()
    } catch {
      toast({ title: 'Failed to update preset', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // ダイアログを開く際に preset の最新状態で再初期化する
      setName(preset.name)
      setDescription(preset.description)
      setDefaultBeanWeight(preset.defaultBeanWeight > 0 ? String(preset.defaultBeanWeight) : '')
      setDefaultWaterTemp(preset.defaultWaterTemp > 0 ? String(preset.defaultWaterTemp) : '')
      setStepInputs(
        preset.steps.length > 0
          ? preset.steps.map((s) => ({ time: String(s.time), water: String(s.water) }))
          : [{ time: '', water: '' }],
      )
    }
    setIsOpen(open)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-8 px-0"
        onClick={() => handleOpenChange(true)}
        aria-label="Edit preset"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Preset</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-preset-name">Name</Label>
              <Input
                id="edit-preset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-preset-description">Description</Label>
              <Textarea
                id="edit-preset-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-preset-bean-weight">Bean Weight (g)</Label>
                <Input
                  id="edit-preset-bean-weight"
                  type="number"
                  min={0}
                  step={0.1}
                  value={defaultBeanWeight}
                  onChange={(e) => setDefaultBeanWeight(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-preset-water-temp">Water Temp (°C)</Label>
                <Input
                  id="edit-preset-water-temp"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={defaultWaterTemp}
                  onChange={(e) => setDefaultWaterTemp(e.target.value)}
                />
              </div>
            </div>
            {/* Steps セクション: 行ベース入力 */}
            <div className="flex flex-col gap-2">
              <Label>Steps</Label>
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
                        min={0}
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
                        min={0}
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
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!name.trim() || isSaving}
              onClick={handleSave}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
