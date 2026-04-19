import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NewBeanForm } from '@/components/new-bean-form'
import type { RoastLevel } from '@/lib/types'

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}))

const { photoPickerState } = vi.hoisted(() => ({
  photoPickerState: { onEstimate: null as ((level: RoastLevel) => void) | null },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}))

vi.mock('@/components/roast-photo-picker', () => ({
  RoastPhotoPicker: ({ onEstimate }: { onEstimate: (level: string) => void }) => {
    photoPickerState.onEstimate = onEstimate as (level: RoastLevel) => void
    return (
      <button
        type="button"
        data-testid="mock-photo-picker"
        onClick={() => onEstimate('French')}
      >
        Mock Photo Picker
      </button>
    )
  },
}))

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

  // Track render order to assign stable aria-labels
  let renderCount = 0

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
    // Extract placeholder from SelectValue child for aria-label
    let placeholder = ''
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      const el = child as React.ReactElement<{ children?: React.ReactNode }>
      extractText(el.props.children) // traverse
      // Look for SelectTrigger > SelectValue placeholder
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
        aria-label={placeholder || 'Select'}
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

  function SelectTrigger({ children }: { children: React.ReactNode }) {
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

describe('NewBeanForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    photoPickerState.onEstimate = null
  })

  it('T8: given the palette selection changes from Medium to French, when the form is submitted, then fetch is called with roast="French"', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'bean-1' }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NewBeanForm />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Bean' } })
    fireEvent.change(screen.getByLabelText('Roaster'), { target: { value: 'Test Roaster' } })

    // Country is the first combobox
    const comboboxes = screen.getAllByRole('combobox')
    fireEvent.change(comboboxes[0], { target: { value: 'Ethiopia' } })

    // Select French roast from the roast dropdown
    fireEvent.change(screen.getByRole('combobox', { name: 'Select roast level' }), {
      target: { value: 'French' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add Bean' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse((requestInit as RequestInit).body as string) as { roast: string }
    expect(body.roast).toBe('French')
  })

  it('S5-T1: given NewBeanForm renders, when rendered, then the RoastPhotoPicker mock is present', () => {
    render(<NewBeanForm />)
    expect(screen.getByTestId('mock-photo-picker')).toBeDefined()
  })

  it('S5-T2: given RoastPhotoPicker calls onEstimate("French"), when the callback fires, then the roast combobox value becomes "French"', async () => {
    render(<NewBeanForm />)

    fireEvent.click(screen.getByTestId('mock-photo-picker'))

    await waitFor(() => {
      const combobox = screen.getByRole('combobox', { name: 'Select roast level' }) as HTMLSelectElement
      expect(combobox.value).toBe('French')
    })
  })

  it('S5-T3: given RoastPhotoPicker sets roast to "French" and the form is submitted, when fetch is called, then request body has roast="French"', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'bean-1' }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NewBeanForm />)

    fireEvent.click(screen.getByTestId('mock-photo-picker'))

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Bean' } })
    fireEvent.change(screen.getByLabelText('Roaster'), { target: { value: 'Test Roaster' } })
    const comboboxes = screen.getAllByRole('combobox')
    fireEvent.change(comboboxes[0], { target: { value: 'Ethiopia' } })

    fireEvent.click(screen.getByRole('button', { name: 'Add Bean' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse((requestInit as RequestInit).body as string) as { roast: string }
    expect(body.roast).toBe('French')
  })

  it('S5-T4: given photoPickerState.onEstimate("Light") is invoked, when called, then the roast combobox value becomes "Light"', async () => {
    render(<NewBeanForm />)

    await waitFor(() => expect(photoPickerState.onEstimate).not.toBeNull())
    photoPickerState.onEstimate!('Light')

    await waitFor(() => {
      const combobox = screen.getByRole('combobox', { name: 'Select roast level' }) as HTMLSelectElement
      expect(combobox.value).toBe('Light')
    })
  })

  it('S5-T5: given NewBeanForm with mode="edit" and an initialBean, when rendered, then the RoastPhotoPicker mock is present', () => {
    const bean = {
      id: 'b1', name: 'Test', country: 'Ethiopia' as const, region: null, farm: null,
      process: null, variety: null, roast: 'Medium' as const, roaster: 'R',
      notes: null, created: '', updated: '',
    }
    render(<NewBeanForm mode="edit" initialBean={bean} />)
    expect(screen.getByTestId('mock-photo-picker')).toBeDefined()
  })
})
