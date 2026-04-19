import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Slider } from '@/components/ui/slider'

describe('Slider', () => {
  it('forwards id to the focusable thumb so label-for associations work', () => {
    render(
      <>
        <label htmlFor="vol">Volume</label>
        <Slider id="vol" defaultValue={[50]} min={0} max={100} step={1} />
      </>
    )
    // The id must be on the thumb (role="slider"), not on the non-focusable root span.
    const thumb = screen.getByRole('slider')
    expect(thumb.getAttribute('id')).toBe('vol')
  })
})
