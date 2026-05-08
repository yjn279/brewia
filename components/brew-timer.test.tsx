import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BrewTimer } from '@/components/brew-timer'

function makeProps(overrides: Partial<Parameters<typeof BrewTimer>[0]> = {}) {
  return {
    status: 'idle' as const,
    elapsed: 0,
    onStart: vi.fn(),
    onLap: vi.fn(),
    onStop: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  }
}

describe('BrewTimer', () => {
  // Button visibility per status
  it('idle: shows only Start button', () => {
    render(<BrewTimer {...makeProps({ status: 'idle' })} />)
    expect(screen.getByRole('button', { name: /start/i })).toBeDefined()
    expect(screen.queryByRole('button', { name: /lap/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /stop/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /reset/i })).toBeNull()
  })

  it('running: shows Lap and Stop buttons only', () => {
    render(<BrewTimer {...makeProps({ status: 'running' })} />)
    expect(screen.getByRole('button', { name: /lap/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /stop/i })).toBeDefined()
    expect(screen.queryByRole('button', { name: /start/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /reset/i })).toBeNull()
  })

  it('stopped: shows only Reset button', () => {
    render(<BrewTimer {...makeProps({ status: 'stopped' })} />)
    expect(screen.getByRole('button', { name: /reset/i })).toBeDefined()
    expect(screen.queryByRole('button', { name: /start/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /lap/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /stop/i })).toBeNull()
  })

  // Timer element attributes
  it('timer element has role="timer", aria-live="polite", aria-label="Elapsed time"', () => {
    render(<BrewTimer {...makeProps()} />)
    const timer = screen.getByRole('timer')
    expect(timer.getAttribute('aria-live')).toBe('polite')
    expect(timer.getAttribute('aria-label')).toBe('Elapsed time')
  })

  // formatElapsed boundary values
  it.each([
    [0, '00:00.00'],
    [59000, '00:59.00'],
    [59990, '00:59.99'],
    [60000, '01:00.00'],
    [123456, '02:03.45'],
    [600000, '10:00.00'],
    [-500, '00:00.00'],
  ])('elapsed=%i renders as %s', (elapsed, expected) => {
    render(<BrewTimer {...makeProps({ elapsed })} />)
    expect(screen.getByRole('timer').textContent).toBe(expected)
  })

  // Callback tests
  it('clicking Start calls onStart once', () => {
    const onStart = vi.fn()
    render(<BrewTimer {...makeProps({ status: 'idle', onStart })} />)
    fireEvent.click(screen.getByRole('button', { name: /start/i }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('clicking Lap calls onLap once', () => {
    const onLap = vi.fn()
    render(<BrewTimer {...makeProps({ status: 'running', onLap })} />)
    fireEvent.click(screen.getByRole('button', { name: /lap/i }))
    expect(onLap).toHaveBeenCalledTimes(1)
  })

  it('clicking Stop calls onStop once', () => {
    const onStop = vi.fn()
    render(<BrewTimer {...makeProps({ status: 'running', onStop })} />)
    fireEvent.click(screen.getByRole('button', { name: /stop/i }))
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  // Reset dialog flow
  it('clicking Reset does not immediately call onReset and opens dialog', () => {
    const onReset = vi.fn()
    render(<BrewTimer {...makeProps({ status: 'stopped', onReset })} />)
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(onReset).not.toHaveBeenCalled()
    expect(screen.getByText('タイマーをリセット')).toBeDefined()
    expect(screen.getByText('リセットするとタイマーと抽出ステップ行も初期化されます。続行しますか？')).toBeDefined()
  })

  it('dialog Confirm ("リセット") calls onReset once', () => {
    const onReset = vi.fn()
    render(<BrewTimer {...makeProps({ status: 'stopped', onReset })} />)
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    fireEvent.click(screen.getByText('リセット', { selector: 'button' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('dialog Cancel ("キャンセル") does not call onReset', () => {
    const onReset = vi.fn()
    render(<BrewTimer {...makeProps({ status: 'stopped', onReset })} />)
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    fireEvent.click(screen.getByText('キャンセル'))
    expect(onReset).not.toHaveBeenCalled()
  })

  it('ESC key closes dialog without calling onReset', () => {
    const onReset = vi.fn()
    render(<BrewTimer {...makeProps({ status: 'stopped', onReset })} />)
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    // Dialog should be open
    expect(screen.getByText('タイマーをリセット')).toBeDefined()
    fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' })
    expect(onReset).not.toHaveBeenCalled()
  })

  it('Reset → Cancel → Reset opens dialog again with all required elements', () => {
    const onReset = vi.fn()
    render(<BrewTimer {...makeProps({ status: 'stopped', onReset })} />)

    // First open
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(screen.getByText('タイマーをリセット')).toBeDefined()

    // Cancel
    fireEvent.click(screen.getByText('キャンセル'))

    // Second open
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(screen.getByText('タイマーをリセット')).toBeDefined()
    expect(screen.getByText('リセットするとタイマーと抽出ステップ行も初期化されます。続行しますか？')).toBeDefined()
    expect(screen.getByText('リセット', { selector: 'button' })).toBeDefined()
    expect(screen.getByText('キャンセル')).toBeDefined()
  })

  // flex-1 class on buttons
  it('idle Start button has flex-1 class', () => {
    render(<BrewTimer {...makeProps({ status: 'idle' })} />)
    const btn = screen.getByRole('button', { name: /start/i })
    expect(btn.className).toContain('flex-1')
  })

  it('running Lap button has flex-1 class', () => {
    render(<BrewTimer {...makeProps({ status: 'running' })} />)
    const btn = screen.getByRole('button', { name: /lap/i })
    expect(btn.className).toContain('flex-1')
  })

  it('running Stop button has flex-1 class', () => {
    render(<BrewTimer {...makeProps({ status: 'running' })} />)
    const btn = screen.getByRole('button', { name: /stop/i })
    expect(btn.className).toContain('flex-1')
  })

  it('stopped Reset button has flex-1 class', () => {
    render(<BrewTimer {...makeProps({ status: 'stopped' })} />)
    const btn = screen.getByRole('button', { name: /reset/i })
    expect(btn.className).toContain('flex-1')
  })
})
