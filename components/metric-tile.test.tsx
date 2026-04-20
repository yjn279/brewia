import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MetricTile } from '@/components/metric-tile'

describe('MetricTile', () => {
  it('renders icon, value, and label texts', () => {
    render(
      <MetricTile icon={<svg data-testid="m-icon" />} value="20g" label="Coffee" />
    )
    expect(screen.getByTestId('m-icon')).toBeDefined()
    expect(screen.getByText('20g')).toBeDefined()
    expect(screen.getByText('Coffee')).toBeDefined()
  })

  it('value element has font-mono, text-lg, and font-medium', () => {
    render(
      <MetricTile icon={<svg data-testid="m-icon" />} value="20g" label="Coffee" />
    )
    const value = screen.getByText('20g')
    expect(value.classList.contains('font-mono')).toBe(true)
    expect(value.classList.contains('text-lg')).toBe(true)
    expect(value.classList.contains('font-medium')).toBe(true)
  })

  it('label element has text-xs and text-muted-foreground', () => {
    render(
      <MetricTile icon={<svg data-testid="m-icon" />} value="20g" label="Coffee" />
    )
    const label = screen.getByText('Coffee')
    expect(label.classList.contains('text-xs')).toBe(true)
    expect(label.classList.contains('text-muted-foreground')).toBe(true)
  })

  it('icon box has bg-secondary, rounded-lg, h-10, and w-10', () => {
    render(
      <MetricTile icon={<svg data-testid="m-icon" />} value="20g" label="Coffee" />
    )
    const icon = screen.getByTestId('m-icon')
    const iconBox = icon.parentElement as HTMLElement
    expect(iconBox.classList.contains('bg-secondary')).toBe(true)
    expect(iconBox.classList.contains('rounded-lg')).toBe(true)
    expect(iconBox.classList.contains('h-10')).toBe(true)
    expect(iconBox.classList.contains('w-10')).toBe(true)
  })

  it('value element comes before label element in DOM order', () => {
    render(
      <MetricTile icon={<svg data-testid="m-icon" />} value="20g" label="Coffee" />
    )
    const value = screen.getByText('20g')
    const label = screen.getByText('Coffee')
    // value should precede label in the DOM
    expect(
      value.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('label parentElement also contains the value — brew page parentElement contract', () => {
    render(
      <MetricTile icon={<svg data-testid="m-icon" />} value="20g" label="Coffee" />
    )
    const label = screen.getByText('Coffee')
    const container = label.parentElement as HTMLElement
    expect(within(container).getByText('20g')).toBeDefined()
  })

  it('accepts className on the root element', () => {
    const { container } = render(
      <MetricTile
        icon={<svg data-testid="m-icon" />}
        value="20g"
        label="Coffee"
        className="custom-tile"
      />
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.classList.contains('custom-tile')).toBe(true)
  })
})
