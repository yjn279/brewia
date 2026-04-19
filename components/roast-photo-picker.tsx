'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { sampleImageColor } from '@/lib/color/image-sampler'
import { srgbToLab } from '@/lib/color/srgb-to-lab'
import { estimateRoastLevel } from '@/lib/color/roast-estimator'
import type { RoastLevel } from '@/lib/types'

interface RoastPhotoPickerProps {
  onEstimate: (level: RoastLevel) => void
}

type Status = 'idle' | 'processing' | 'done' | 'error'

export function RoastPhotoPicker({ onEstimate }: RoastPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const generationRef = useRef(0)
  const [status, setStatus] = useState<Status>('idle')
  const [preview, setPreview] = useState<{ L: number; level: RoastLevel } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const gen = ++generationRef.current

    setStatus('processing')
    setErrorMessage(null)
    setPreview(null)

    try {
      const rgb = await sampleImageColor(file)

      if (gen !== generationRef.current) return

      const lab = srgbToLab(rgb.r, rgb.g, rgb.b)
      const level = estimateRoastLevel(lab.L)

      if (level === null) {
        setStatus('error')
        setErrorMessage('Out of range')
        return
      }

      onEstimate(level)
      setPreview({ L: lab.L, level })
      setStatus('done')
    } catch {
      if (gen !== generationRef.current) return
      setStatus('error')
      setErrorMessage("Couldn't detect")
    } finally {
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        data-testid="photo-input"
        className="sr-only"
        onChange={handleChange}
        id="photo-input"
      />
      <Button
        type="button"
        variant="outline"
        asChild
      >
        <label htmlFor="photo-input" className="cursor-pointer">
          <Camera />
          From photo
        </label>
      </Button>

      {status === 'processing' && (
        <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" />
          Detecting...
        </div>
      )}

      {status === 'done' && preview && (
        <div role="region" aria-live="polite" aria-label="Estimated roast" className="text-sm text-muted-foreground">
          L* {preview.L.toFixed(1)} · {preview.level}
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div role="alert" className="text-sm text-destructive">
          {errorMessage}
        </div>
      )}
    </div>
  )
}
