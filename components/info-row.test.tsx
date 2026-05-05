import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InfoRow } from '@/components/info-row'

describe('InfoRow', () => {
  it('renders icon and children', () => {
    render(
      <InfoRow icon={<svg data-testid="icon" />}>some content</InfoRow>
    )
    expect(screen.getByTestId('icon')).toBeDefined()
    expect(screen.getByText('some content')).toBeDefined()
  })

  it('icon container has text-muted-foreground', () => {
    render(
      <InfoRow icon={<svg data-testid="icon" />}>some content</InfoRow>
    )
    const icon = screen.getByTestId('icon')
    const iconContainer = icon.parentElement as HTMLElement
    expect(iconContainer.classList.contains('text-muted-foreground')).toBe(true)
  })

  it('root layout is flex with items-start and gap-3', () => {
    const { container } = render(
      <InfoRow icon={<svg data-testid="icon" />}>some content</InfoRow>
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.classList.contains('flex')).toBe(true)
    expect(root.classList.contains('items-start')).toBe(true)
    expect(root.classList.contains('gap-3')).toBe(true)
  })

  it('children area is a flex column with gap-2', () => {
    render(
      <InfoRow icon={<svg data-testid="icon" />}>some content</InfoRow>
    )
    const icon = screen.getByTestId('icon')
    const iconContainer = icon.parentElement as HTMLElement
    const childrenArea = iconContainer.nextElementSibling as HTMLElement
    expect(childrenArea.classList.contains('flex')).toBe(true)
    expect(childrenArea.classList.contains('flex-col')).toBe(true)
    expect(childrenArea.classList.contains('gap-2')).toBe(true)
  })

  it('accepts className on the root element', () => {
    const { container } = render(
      <InfoRow icon={<svg data-testid="icon" />} className="custom-row">
        some content
      </InfoRow>
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.classList.contains('custom-row')).toBe(true)
  })
})
