import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BrewTimer } from '@/components/brew-timer'

describe('BrewTimer', () => {
  // T1: idle state rendering
  it('T1: given status="idle" and elapsed=0, renders Start button only and shows 00:00', () => {
    const noop = vi.fn()
    render(
      <BrewTimer
        status="idle"
        elapsed={0}
        onStart={noop}
        onLap={noop}
        onReset={noop}
      />,
    )

    expect(screen.getByRole('button', { name: 'Start' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Lap' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull()

    const timer = screen.getByRole('timer')
    expect(timer.textContent).toBe('00:00')
    expect(timer.getAttribute('aria-live')).toBe('polite')
    expect(timer.getAttribute('aria-label')).toBe('Elapsed time')
  })

  // T4: running state rendering
  it('T4: given status="running" and elapsed=7300, renders Lap and Reset buttons but not Start, shows 00:07', () => {
    const noop = vi.fn()
    render(
      <BrewTimer
        status="running"
        elapsed={7300}
        onStart={noop}
        onLap={noop}
        onReset={noop}
      />,
    )

    expect(screen.getByRole('button', { name: 'Lap' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull()

    expect(screen.getByRole('timer').textContent).toBe('00:07')
  })

  // T4b: formatting
  it('T4b: formats elapsed values correctly', () => {
    const noop = vi.fn()
    const cases: Array<{ elapsed: number; expected: string }> = [
      { elapsed: 0, expected: '00:00' },
      { elapsed: 59000, expected: '00:59' },
      { elapsed: 60000, expected: '01:00' },
      { elapsed: 600000, expected: '10:00' },
      { elapsed: 3599000, expected: '59:59' },
    ]

    for (const { elapsed, expected } of cases) {
      const { unmount } = render(
        <BrewTimer
          status="running"
          elapsed={elapsed}
          onStart={noop}
          onLap={noop}
          onReset={noop}
        />,
      )
      expect(screen.getByRole('timer').textContent).toBe(expected)
      unmount()
    }
  })

  // T4b-neg: negative elapsed guard
  it('T4b-neg: given elapsed=-500, clamps to 00:00 and does not render garbage', () => {
    const noop = vi.fn()
    render(
      <BrewTimer
        status="idle"
        elapsed={-500}
        onStart={noop}
        onLap={noop}
        onReset={noop}
      />,
    )
    expect(screen.getByRole('timer').textContent).toBe('00:00')
  })

  // Click wiring — idle
  it('click wiring: clicking Start in idle state calls onStart', () => {
    const onStart = vi.fn()
    const noop = vi.fn()
    render(
      <BrewTimer
        status="idle"
        elapsed={0}
        onStart={onStart}
        onLap={noop}
        onReset={noop}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  // Click wiring — running
  it('click wiring: clicking Lap and Reset in running state call their handlers', () => {
    const onLap = vi.fn()
    const onReset = vi.fn()
    const noop = vi.fn()
    render(
      <BrewTimer
        status="running"
        elapsed={5000}
        onStart={noop}
        onLap={onLap}
        onReset={onReset}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Lap' }))
    expect(onLap).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
