import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatsCard } from '@/components/stats-card'

describe('StatsCard', () => {
  it('renders label and value', () => {
    render(<StatsCard label="Total Brews" value={7} />)
    expect(screen.getByText('Total Brews')).toBeDefined()
    expect(screen.getByText('7')).toBeDefined()
  })

  it('accepts an icon node', () => {
    render(<StatsCard label="Brews" value={3} icon={<svg data-testid="icon" />} />)
    expect(screen.getByTestId('icon')).toBeDefined()
  })

  it('wrapper has surface base classes and is non-interactive', () => {
    const { container } = render(<StatsCard label="Brews" value={0} />)
    const root = container.firstElementChild as HTMLElement
    expect(root.classList.contains('rounded-xl')).toBe(true)
    expect(root.classList.contains('bg-card')).toBe(true)
    expect(root.classList.contains('shadow-sm')).toBe(true)
    expect(root.classList.contains('hover:shadow-md')).toBe(false)
    expect(root.classList.contains('active:scale-[0.98]')).toBe(false)
  })
})
