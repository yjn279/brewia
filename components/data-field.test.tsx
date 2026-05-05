import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataField } from '@/components/data-field'

describe('DataField', () => {
  it('renders label and value text', () => {
    render(<DataField label="Region">Yirgacheffe</DataField>)
    expect(screen.getByText('Region')).toBeDefined()
    expect(screen.getByText('Yirgacheffe')).toBeDefined()
  })

  it('label has the canonical class set', () => {
    render(<DataField label="Region">Yirgacheffe</DataField>)
    const label = screen.getByText('Region')
    expect(label.classList.contains('text-xs')).toBe(true)
    expect(label.classList.contains('uppercase')).toBe(false)
    expect(label.classList.contains('tracking-wide')).toBe(true)
    expect(label.classList.contains('text-muted-foreground')).toBe(true)
  })

  it('value wrapper has the canonical class set', () => {
    render(<DataField label="Region">Yirgacheffe</DataField>)
    const value = screen.getByText('Yirgacheffe')
    expect(value.classList.contains('text-lg')).toBe(true)
    expect(value.classList.contains('font-medium')).toBe(true)
    expect(value.classList.contains('text-foreground')).toBe(true)
  })

  it('accepts valueClassName for overrides while keeping base classes', () => {
    render(
      <DataField label="Coffee" valueClassName="font-mono text-lg">
        20g
      </DataField>
    )
    const value = screen.getByText('20g')
    expect(value.classList.contains('font-mono')).toBe(true)
    expect(value.classList.contains('text-lg')).toBe(true)
    expect(value.classList.contains('font-medium')).toBe(true)
    expect(value.classList.contains('text-foreground')).toBe(true)
  })

  it('children may include nested elements', () => {
    render(
      <DataField label="Region">
        <span>Yirgacheffe</span>
        <p>Country: Ethiopia</p>
      </DataField>
    )
    expect(screen.getByText('Yirgacheffe')).toBeDefined()
    expect(screen.getByText('Country: Ethiopia')).toBeDefined()
  })

  it('accepts className on the root element', () => {
    const { container } = render(
      <DataField label="X" className="custom-x">
        Y
      </DataField>
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.classList.contains('custom-x')).toBe(true)
    expect(root.classList.contains('flex')).toBe(true)
    expect(root.classList.contains('flex-col')).toBe(true)
  })
})
