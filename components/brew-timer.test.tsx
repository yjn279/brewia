import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BrewTimer } from '@/components/brew-timer'

describe('BrewTimer', () => {
  // T1: idle state rendering
  it('T1: given status="idle" and elapsed=0, renders Start button only and shows 00:00.00', () => {
    const noop = vi.fn()
    render(
      <BrewTimer
        status="idle"
        elapsed={0}
        onStart={noop}
        onLap={noop}
        onStop={noop}
        onReset={noop}
      />,
    )

    expect(screen.getByRole('button', { name: 'Start' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Lap' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull()

    const timer = screen.getByRole('timer')
    expect(timer.textContent).toBe('00:00.00')
    expect(timer.getAttribute('aria-live')).toBe('polite')
    expect(timer.getAttribute('aria-label')).toBe('Elapsed time')
  })

  // T4: running state rendering
  it('T4: given status="running" and elapsed=7300, renders Lap and Stop buttons but not Start or Reset, shows 00:07.30', () => {
    const noop = vi.fn()
    render(
      <BrewTimer
        status="running"
        elapsed={7300}
        onStart={noop}
        onLap={noop}
        onStop={noop}
        onReset={noop}
      />,
    )

    expect(screen.getByRole('button', { name: 'Lap' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull()

    expect(screen.getByRole('timer').textContent).toBe('00:07.30')
  })

  // T4-stopped: stopped state rendering
  it('T4-stopped: given status="stopped", renders Reset button only; Start/Lap/Stop are absent', () => {
    const noop = vi.fn()
    render(
      <BrewTimer
        status="stopped"
        elapsed={10000}
        onStart={noop}
        onLap={noop}
        onStop={noop}
        onReset={noop}
      />,
    )

    expect(screen.getByRole('button', { name: 'Reset' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Lap' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()
  })

  // T4b: formatting — mm:ss.cc
  it('T4b: formats elapsed values correctly in mm:ss.cc format', () => {
    const noop = vi.fn()
    const cases: Array<{ elapsed: number; expected: string }> = [
      { elapsed: 0, expected: '00:00.00' },
      { elapsed: 59000, expected: '00:59.00' },
      { elapsed: 59990, expected: '00:59.99' },
      { elapsed: 60000, expected: '01:00.00' },
      { elapsed: 600000, expected: '10:00.00' },
      { elapsed: 3599000, expected: '59:59.00' },
      { elapsed: 123456, expected: '02:03.45' },
    ]

    for (const { elapsed, expected } of cases) {
      const { unmount } = render(
        <BrewTimer
          status="running"
          elapsed={elapsed}
          onStart={noop}
          onLap={noop}
          onStop={noop}
          onReset={noop}
        />,
      )
      expect(screen.getByRole('timer').textContent).toBe(expected)
      unmount()
    }
  })

  // T4b-neg: negative elapsed guard
  it('T4b-neg: given elapsed=-500, clamps to 00:00.00 and does not render garbage', () => {
    const noop = vi.fn()
    render(
      <BrewTimer
        status="idle"
        elapsed={-500}
        onStart={noop}
        onLap={noop}
        onStop={noop}
        onReset={noop}
      />,
    )
    expect(screen.getByRole('timer').textContent).toBe('00:00.00')
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
        onStop={noop}
        onReset={noop}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  // Click wiring — running
  it('click wiring: clicking Lap and Stop in running state call their handlers', () => {
    const onLap = vi.fn()
    const onStop = vi.fn()
    const noop = vi.fn()
    render(
      <BrewTimer
        status="running"
        elapsed={5000}
        onStart={noop}
        onLap={onLap}
        onStop={onStop}
        onReset={noop}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Lap' }))
    expect(onLap).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  // Click wiring — stopped
  it('click wiring: clicking Reset in stopped state calls onReset', () => {
    const onReset = vi.fn()
    const noop = vi.fn()
    render(
      <BrewTimer
        status="stopped"
        elapsed={10000}
        onStart={noop}
        onLap={noop}
        onStop={noop}
        onReset={onReset}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  // T_buttons_full_width: each button gets flex-1 so buttons fill the available row width
  it('T_buttons_full_width: each button in every status has className including "flex-1"', () => {
    const noop = vi.fn()

    // idle: Start button
    const { unmount: unmount1 } = render(
      <BrewTimer status="idle" elapsed={0} onStart={noop} onLap={noop} onStop={noop} onReset={noop} />,
    )
    expect(screen.getByRole('button', { name: 'Start' }).className).toContain('flex-1')
    unmount1()

    // running: Lap and Stop buttons
    const { unmount: unmount2 } = render(
      <BrewTimer status="running" elapsed={0} onStart={noop} onLap={noop} onStop={noop} onReset={noop} />,
    )
    expect(screen.getByRole('button', { name: 'Lap' }).className).toContain('flex-1')
    expect(screen.getByRole('button', { name: 'Stop' }).className).toContain('flex-1')
    unmount2()

    // stopped: Reset button
    render(
      <BrewTimer status="stopped" elapsed={0} onStart={noop} onLap={noop} onStop={noop} onReset={noop} />,
    )
    expect(screen.getByRole('button', { name: 'Reset' }).className).toContain('flex-1')
  })
})
