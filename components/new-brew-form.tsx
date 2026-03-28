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
import { Loader2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewBrewFormProps {
  initialBeanId?: string
}

const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Exceptional']

export function NewBrewForm({ initialBeanId }: NewBrewFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBean, setSelectedBean] = useState(initialBeanId)
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  
  // Brew parameters
  const [beanWeight, setBeanWeight] = useState('15')
  const [waterWeight, setWaterWeight] = useState('225')
  const [waterTemp, setWaterTemp] = useState('92')
  const [grindSize, setGrindSize] = useState('24')
  
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
            <Input
              id="waterWeight"
              type="number"
              value={waterWeight}
              onChange={(e) => setWaterWeight(e.target.value)}
              min="1"
              step="1"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="waterTemp">Temp (°C)</Label>
            <Input
              id="waterTemp"
              type="number"
              value={waterTemp}
              onChange={(e) => setWaterTemp(e.target.value)}
              min="80"
              max="100"
              required
            />
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
        </div>
        <div className="mt-4 flex items-center justify-center rounded-lg bg-secondary p-3">
          <span className="text-sm text-muted-foreground">Brew Ratio</span>
          <span className="ml-2 font-mono text-lg font-medium">1:{ratio}</span>
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
