import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NewBrewForm } from '@/components/new-brew-form'
import type { Bean, Flavor } from '@/lib/types'

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
        aria-label="Bean"
        onChange={(event) => onValueChange?.(event.target.value)}
        value={value ?? ''}
      >
        <option disabled value="">
          Choose a bean
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
        aria-label="Rating slider"
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

const beans: Bean[] = [
  {
    country: 'Kenya',
    created: '2026-04-18T00:00:00.000Z',
    farm: 'Kieni',
    id: 'bean-1',
    name: 'Kenya AA',
    notes: null,
    process: 'Washed',
    region: 'Nyeri',
    roast: 'Light',
    roaster: 'Glitch',
    updated: '2026-04-18T00:00:00.000Z',
    variety: 'SL28',
  },
]

const flavors: Flavor[] = [
  {
    category: 'Fruit',
    created: '2026-04-18T00:00:00.000Z',
    id: 'flavor-1',
    name: 'Berry',
    subcategory: 'Red Fruit',
    updated: '2026-04-18T00:00:00.000Z',
  },
]

describe('NewBrewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('given the weight inputs when the form renders then both fields expose arbitrary gram steps', () => {
    render(<NewBrewForm beans={beans} flavors={flavors} />)

    const beanWeightInput = screen.getByLabelText('Coffee (g)')
    const waterWeightInput = screen.getByLabelText('Water (g)')

    expect(beanWeightInput.getAttribute('min')).toBe('1')
    expect(beanWeightInput.getAttribute('step')).toBe('any')
    expect(waterWeightInput.getAttribute('min')).toBe('1')
    expect(waterWeightInput.getAttribute('step')).toBe('any')
  })

  it('given odd gram values when the form submits then it posts the exact numeric weights', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'brew-1' }),
      ok: true,
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<NewBrewForm beans={beans} flavors={flavors} />)

    fireEvent.change(screen.getByRole('combobox', { name: 'Bean' }), {
      target: { value: 'bean-1' },
    })
    fireEvent.change(screen.getByLabelText('Coffee (g)'), {
      target: { value: '1' },
    })
    fireEvent.change(screen.getByLabelText('Water (g)'), {
      target: { value: '3' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log Brew' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse((requestInit as RequestInit).body as string) as {
      beanId: string
      beanWeight: number
      waterWeight: number
    }

    expect(body.beanId).toBe('bean-1')
    expect(body.beanWeight).toBe(1)
    expect(body.waterWeight).toBe(3)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/brews/brew-1')
    })

    expect(refreshMock).toHaveBeenCalledTimes(1)
  })

  it('given decimal gram values when the form submits then it preserves the decimal payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'brew-2' }),
      ok: true,
    })

    vi.stubGlobal('fetch', fetchMock)

    render(<NewBrewForm beans={beans} flavors={flavors} initialBeanId="bean-1" />)

    fireEvent.change(screen.getByLabelText('Coffee (g)'), {
      target: { value: '15.5' },
    })
    fireEvent.change(screen.getByLabelText('Water (g)'), {
      target: { value: '225.3' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log Brew' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse((requestInit as RequestInit).body as string) as {
      beanWeight: number
      waterWeight: number
    }

    expect(body.beanWeight).toBe(15.5)
    expect(body.waterWeight).toBe(225.3)
  })
})
