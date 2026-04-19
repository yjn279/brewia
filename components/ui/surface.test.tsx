import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Surface } from '@/components/ui/surface'

describe('Surface', () => {
  it('renders a div with base classes by default', () => {
    render(<Surface>content</Surface>)
    const el = screen.getByText('content')
    expect(el.tagName).toBe('DIV')
    expect(el.classList.contains('rounded-xl')).toBe(true)
    expect(el.classList.contains('bg-card')).toBe(true)
    expect(el.classList.contains('p-4')).toBe(true)
    expect(el.classList.contains('shadow-sm')).toBe(true)
  })

  it('interactive={true} adds hover + active classes', () => {
    render(<Surface interactive>hi</Surface>)
    const el = screen.getByText('hi')
    expect(el.classList.contains('transition-all')).toBe(true)
    expect(el.classList.contains('hover:shadow-md')).toBe(true)
    expect(el.classList.contains('active:scale-[0.98]')).toBe(true)
  })

  it('interactive defaults to false — hover and active classes absent', () => {
    render(<Surface>hi</Surface>)
    const el = screen.getByText('hi')
    expect(el.classList.contains('hover:shadow-md')).toBe(false)
    expect(el.classList.contains('active:scale-[0.98]')).toBe(false)
  })

  it('asChild merges classes onto child element', () => {
    const { container } = render(
      <Surface asChild interactive>
        <a href="/foo" data-testid="link-child">text</a>
      </Surface>
    )
    const link = screen.getByTestId('link-child')
    expect(link.tagName).toBe('A')
    expect((link as HTMLAnchorElement).getAttribute('href')).toBe('/foo')
    expect(link.classList.contains('rounded-xl')).toBe(true)
    expect(link.classList.contains('bg-card')).toBe(true)
    expect(link.classList.contains('active:scale-[0.98]')).toBe(true)
    // Verify no Surface <div> wrapper was inserted — the top-level rendered element is the <a>
    expect(container.firstChild).toBe(link)
  })

  it('className is merged and can override via tailwind-merge', () => {
    render(<Surface className="p-6 mb-6">x</Surface>)
    const el = screen.getByText('x')
    expect(el.classList.contains('mb-6')).toBe(true)
    expect(el.classList.contains('p-6')).toBe(true)
    expect(el.classList.contains('p-4')).toBe(false)
  })

  it('asChild with section element', () => {
    render(
      <Surface asChild className="mb-6">
        <section data-testid="s">x</section>
      </Surface>
    )
    const el = screen.getByTestId('s')
    expect(el.tagName).toBe('SECTION')
    expect(el.classList.contains('rounded-xl')).toBe(true)
    expect(el.classList.contains('bg-card')).toBe(true)
    expect(el.classList.contains('mb-6')).toBe(true)
  })
})
