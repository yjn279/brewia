import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RoastPalette } from '@/components/roast-palette'
import { ROAST_LEVELS } from '@/lib/types'

describe('RoastPalette', () => {
  // T1 — initial selection
  it('T1: given value="Medium", when RoastPalette renders, then radiogroup exists, Medium is checked, and the live readout shows "Medium"', () => {
    render(<RoastPalette value="Medium" onChange={vi.fn()} />)

    expect(screen.getByRole('radiogroup', { name: 'Roast Level' })).toBeDefined()

    const mediumRadio = screen.getByRole('radio', { name: 'Medium' })
    expect(mediumRadio.getAttribute('aria-checked')).toBe('true')

    const otherRadios = screen
      .getAllByRole('radio')
      .filter((el) => el.getAttribute('aria-label') !== 'Medium')
    expect(otherRadios).toHaveLength(7)
    for (const radio of otherRadios) {
      expect(radio.getAttribute('aria-checked')).toBe('false')
    }

    const readout = screen.getByTestId('roast-palette-readout')
    expect(readout.textContent).toBe('Medium')
  })

  // T2 — click updates selection
  it('T2: given value="Medium", when the "City" swatch is clicked, then onChange is called once with "City"', () => {
    const onChange = vi.fn()
    render(<RoastPalette value="Medium" onChange={onChange} />)

    fireEvent.click(screen.getByRole('radio', { name: 'City' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('City')
  })

  // T3 — all 8 levels render
  it('T3: given value="Light", when RoastPalette renders, then all 8 roast level radios are present', () => {
    render(<RoastPalette value="Light" onChange={vi.fn()} />)

    expect(screen.getAllByRole('radio')).toHaveLength(8)
    for (const level of ROAST_LEVELS) {
      expect(screen.getByRole('radio', { name: level })).toBeDefined()
    }
  })

  // T4 — ArrowRight moves to the next level
  it('T4: given value="Medium", when ArrowRight is pressed on the Medium radio, then onChange is called once with "High"', () => {
    const onChange = vi.fn()
    render(<RoastPalette value="Medium" onChange={onChange} />)

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Medium' }), { key: 'ArrowRight' })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('High')
  })

  // T5 — ArrowRight wraps from last to first
  it('T5: given value="Italian", when ArrowRight is pressed on the Italian radio, then onChange is called once with "Light"', () => {
    const onChange = vi.fn()
    render(<RoastPalette value="Italian" onChange={onChange} />)

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Italian' }), { key: 'ArrowRight' })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('Light')
  })

  // T6 — ArrowLeft wraps from first to last
  it('T6: given value="Light", when ArrowLeft is pressed on the Light radio, then onChange is called once with "Italian"', () => {
    const onChange = vi.fn()
    render(<RoastPalette value="Light" onChange={onChange} />)

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Light' }), { key: 'ArrowLeft' })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('Italian')
  })

  // T7a — Home jumps to first level
  it('T7a: given value="Medium", when Home is pressed on the Medium radio, then onChange is called once with "Light"', () => {
    const onChange = vi.fn()
    render(<RoastPalette value="Medium" onChange={onChange} />)

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Medium' }), { key: 'Home' })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('Light')
  })

  // T7b — End jumps to last level
  it('T7b: given value="Medium", when End is pressed on the Medium radio, then onChange is called once with "Italian"', () => {
    const onChange = vi.fn()
    render(<RoastPalette value="Medium" onChange={onChange} />)

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Medium' }), { key: 'End' })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('Italian')
  })
})
