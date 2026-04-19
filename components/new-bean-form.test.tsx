import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NewBeanForm } from '@/components/new-bean-form'
import type { Bean } from '@/lib/types'

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
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

    return (
      <select
        id="country"
        onChange={(event) => onValueChange?.(event.target.value)}
        value={value ?? ''}
      >
        <option disabled value="">
          Select country
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

vi.mock('@/components/ui/slider', async () => {
  const React = await import('react')

  function Slider({
    max,
    min,
    onValueChange,
    step,
    value,
  }: {
    max?: number
    min?: number
    onValueChange?: (value: number[]) => void
    step?: number
    value?: number[]
  }) {
    return (
      <input
        aria-label="Roast Level slider"
        max={max}
        min={min}
        onChange={(event) => onValueChange?.([Number(event.target.value)])}
        step={step}
        type="range"
        value={value?.[0] ?? min ?? 0}
      />
    )
  }

  return { Slider }
})

/** Fills in the minimum required fields (Name, Roaster, Country) so submit is not blocked. */
function fillRequiredBeanFields() {
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Kenya AA' },
  })
  fireEvent.change(screen.getByLabelText('Roaster'), {
    target: { value: 'Glitch Coffee' },
  })
  fireEvent.change(screen.getByRole('combobox', { name: 'Country' }), {
    target: { value: 'Kenya' },
  })
}

const baseBean: Bean = {
  country: 'Kenya',
  created: '2026-04-18T00:00:00.000Z',
  farm: 'Kieni',
  id: 'bean-1',
  name: 'Kenya AA',
  notes: null,
  price: null,
  process: 'Washed',
  region: 'Nyeri',
  roast: 'Light',
  roaster: 'Glitch',
  updated: '2026-04-18T00:00:00.000Z',
  variety: 'SL28',
}

describe('NewBeanForm — price field', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // P1: Price input renders with correct attributes
  it('P1: given the bean form renders, when inspecting the price input, then a number input labeled "Price" is present with min="0", step="1", and placeholder "1800"', () => {
    render(<NewBeanForm />)

    const priceInput = screen.getByLabelText('Price (JPY)') as HTMLInputElement

    expect(priceInput).toBeDefined()
    expect(priceInput.getAttribute('type')).toBe('number')
    expect(priceInput.getAttribute('min')).toBe('0')
    expect(priceInput.getAttribute('step')).toBe('1')
    expect(priceInput.getAttribute('placeholder')).toBe('1800')
  })

  // P2: Price input is optional (form submits without it)
  it('P2: given the bean form with no price entered, when the user submits, then the form is not blocked by a required constraint on the price field', () => {
    render(<NewBeanForm />)

    const priceInput = screen.getByLabelText('Price (JPY)') as HTMLInputElement

    expect(priceInput.hasAttribute('required')).toBe(false)
  })

  // P3: Submit with integer price — fetch body contains price as a number
  it('P3: given the price input has value "1800", when the form submits, then the fetch body contains price: 1800 as a number', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'bean-new' }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NewBeanForm />)

    fillRequiredBeanFields()
    fireEvent.change(screen.getByLabelText('Price (JPY)'), {
      target: { value: '1800' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add Bean' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse((requestInit as RequestInit).body as string) as {
      price: number | null
    }

    expect(body.price).toBe(1800)
    expect(typeof body.price).toBe('number')
  })

  // P4: Submit with empty price — fetch body contains price: null
  it('P4: given the price input is left empty, when the form submits, then the fetch body contains price: null (not 0, not NaN, not undefined)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'bean-new' }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NewBeanForm />)

    fillRequiredBeanFields()
    // Price input is intentionally left empty

    fireEvent.click(screen.getByRole('button', { name: 'Add Bean' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse((requestInit as RequestInit).body as string) as {
      price: unknown
    }

    expect(body.price).toBeNull()
  })

  // P5: Edit mode with initialBean.price = 1800 — input value is pre-populated
  it('P5: given edit mode with initialBean.price = 1800, when the form renders, then the price input value is "1800"', () => {
    const beanWithPrice: Bean = { ...baseBean, price: 1800 }

    render(<NewBeanForm mode="edit" initialBean={beanWithPrice} />)

    const priceInput = screen.getByLabelText('Price (JPY)') as HTMLInputElement

    expect(priceInput.value).toBe('1800')
  })

  // P6: Edit mode with initialBean.price = null — input value is empty string
  it('P6: given edit mode with initialBean.price = null, when the form renders, then the price input value is ""', () => {
    const beanWithNullPrice: Bean = { ...baseBean, price: null }

    render(<NewBeanForm mode="edit" initialBean={beanWithNullPrice} />)

    const priceInput = screen.getByLabelText('Price (JPY)') as HTMLInputElement

    expect(priceInput.value).toBe('')
  })

  // P7: Negative price bypassed via JS — fetch body contains price: null
  it('P7: given the price input is programmatically set to "-100" (browser bypass), when the form submits, then the fetch body contains price: null', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'bean-new' }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    const { container } = render(<NewBeanForm />)

    fillRequiredBeanFields()
    fireEvent.change(screen.getByLabelText('Price (JPY)'), {
      target: { value: '-100' },
    })

    // Submit the form directly to bypass HTML5 min="0" constraint validation
    const form = container.querySelector('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse((requestInit as RequestInit).body as string) as {
      price: unknown
    }

    expect(body.price).toBeNull()
  })

  // P8: Edit mode with initialBean.price = 1800, user clears the field and submits — fetch body contains price: null
  it('P8: given edit mode with initialBean.price = 1800, when the user clears the price input and submits, then the fetch body contains price: null', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    const beanWithPrice: Bean = { ...baseBean, price: 1800 }

    render(<NewBeanForm mode="edit" initialBean={beanWithPrice} />)

    // Clear the price input
    fireEvent.change(screen.getByLabelText('Price (JPY)'), {
      target: { value: '' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save Bean' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse((requestInit as RequestInit).body as string) as {
      price: unknown
    }

    expect(body.price).toBeNull()
  })
})
