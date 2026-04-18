import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RoastPalette } from '@/components/roast-palette'
import { ROAST_LEVELS } from '@/lib/types'

vi.mock('@/components/ui/select', async () => {
  const React = await import('react')

  function extractText(node: React.ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node)
    }

    if (Array.isArray(node)) {
      return node.map(extractText).join('')
    }

    if (!React.isValidElement(node)) {
      return ''
    }

    const element = node as React.ReactElement<{ children?: React.ReactNode }>
    return extractText(element.props.children)
  }

  function SelectItem({
    children,
  }: {
    children: React.ReactNode
    value: string
  }) {
    return <>{children}</>
  }

  function collectItems(children: React.ReactNode): Array<{ label: string; value: string }> {
    const items: Array<{ label: string; value: string }> = []

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        return
      }

      const element = child as React.ReactElement<{
        children?: React.ReactNode
        value?: string
      }>

      if (element.type === SelectItem && element.props.value) {
        items.push({
          label: extractText(element.props.children),
          value: element.props.value,
        })
        return
      }

      items.push(...collectItems(element.props.children))
    })

    return items
  }

  function Select({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode
    onValueChange?: (value: string) => void
    value?: string
  }) {
    const items = collectItems(children)

    // Extract aria-label from SelectTrigger (first) or placeholder from SelectValue (fallback)
    let ariaLabel = ''
    let placeholder = ''
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      const el = child as React.ReactElement<{
        children?: React.ReactNode
        'aria-label'?: string
      }>
      // Check if this is SelectTrigger with aria-label
      if (el.props['aria-label']) {
        ariaLabel = el.props['aria-label']
      }
      // Also look for SelectValue placeholder inside this child
      React.Children.forEach(el.props.children, (grandchild) => {
        if (!React.isValidElement(grandchild)) return
        const gc = grandchild as React.ReactElement<{ placeholder?: string }>
        if (gc.props.placeholder) {
          placeholder = gc.props.placeholder
        }
      })
    })

    return (
      <select
        aria-label={ariaLabel || placeholder || 'Select'}
        onChange={(event) => onValueChange?.(event.target.value)}
        value={value ?? ''}
      >
        <option disabled value="">
          {placeholder}
        </option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    )
  }

  function SelectContent({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }

  function SelectTrigger({
    children,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode
    'aria-label'?: string
  }) {
    return <>{children}</>
  }

  function SelectValue({
    children,
    placeholder,
  }: {
    children?: React.ReactNode
    placeholder?: string
  }) {
    return <>{children ?? placeholder}</>
  }

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  }
})

describe('RoastPalette', () => {
  // T1 — initial selection displayed in trigger
  it('T1: given value="Medium", when RoastPalette renders, then the combobox exists with aria-label "Roast Level" and its value is "Medium"', () => {
    render(<RoastPalette value="Medium" onChange={vi.fn()} />)

    const combobox = screen.getByRole('combobox', { name: 'Roast Level' })
    expect(combobox).toBeDefined()
    expect((combobox as HTMLSelectElement).value).toBe('Medium')
  })

  // T2 — changing the combobox calls onChange with the selected level
  it('T2: given value="Medium", when the combobox changes to "French", then onChange is called once with "French"', () => {
    const onChange = vi.fn()
    render(<RoastPalette value="Medium" onChange={onChange} />)

    fireEvent.change(screen.getByRole('combobox', { name: 'Roast Level' }), {
      target: { value: 'French' },
    })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('French')
  })

  // T3 — all 8 roast levels are selectable options with labels
  it('T3: given value="Light", when RoastPalette renders, then all 8 roast level options are present', () => {
    render(<RoastPalette value="Light" onChange={vi.fn()} />)

    for (const level of ROAST_LEVELS) {
      expect(screen.getByRole('option', { name: level })).toBeDefined()
    }

    // 8 enabled options + 1 disabled placeholder
    const allOptions = screen.getAllByRole('option')
    const enabledOptions = allOptions.filter(
      (opt) => !(opt as HTMLOptionElement).disabled,
    )
    expect(enabledOptions).toHaveLength(8)
  })
})
