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
import { COUNTRIES, COUNTRY_FLAGS, ROAST_LEVELS } from '@/lib/types'
import { Loader2 } from 'lucide-react'

const processes = ['Washed', 'Natural', 'Honey', 'Anaerobic', 'Wet Hulled']

export function NewBeanForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roastIndex, setRoastIndex] = useState([2])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    // In a real app, this would create the bean in the database
    router.push('/beans')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basic Info */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Bean Info
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Yirgacheffe Kochere" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="roaster">Roaster</Label>
            <Input id="roaster" placeholder="Onibus Coffee" required />
          </div>
        </div>
      </div>

      {/* Origin */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Origin
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="country">Country</Label>
            <Select required>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    <span className="flex items-center gap-2">
                      <span>{COUNTRY_FLAGS[country]}</span>
                      <span>{country}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="region">Region</Label>
            <Input id="region" placeholder="Yirgacheffe" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="farm">Farm / Station</Label>
            <Input id="farm" placeholder="Kochere Washing Station" />
          </div>
        </div>
      </div>

      {/* Characteristics */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Characteristics
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="variety">Variety</Label>
            <Input id="variety" placeholder="Heirloom" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="process">Process</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select process" />
              </SelectTrigger>
              <SelectContent>
                {processes.map((process) => (
                  <SelectItem key={process} value={process}>
                    {process}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Roast Level</Label>
              <span className="text-sm text-muted-foreground">{ROAST_LEVELS[roastIndex[0]]}</span>
            </div>
            <Slider
              value={roastIndex}
              onValueChange={setRoastIndex}
              min={0}
              max={ROAST_LEVELS.length - 1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{ROAST_LEVELS[0]}</span>
              <span>{ROAST_LEVELS[ROAST_LEVELS.length - 1]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Notes
        </h2>
        <Textarea
          placeholder="Tasting notes, purchase info, etc."
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
          'Add Bean'
        )}
      </Button>
    </form>
  )
}
