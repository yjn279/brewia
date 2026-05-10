import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { NewBrewForm } from '@/components/new-brew-form'
import type { Bean, BrewWithBean, Flavor } from '@/lib/types'

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

vi.mock('@/components/pour-chart', () => ({
  PourChart: () => <div data-testid="pour-chart" />,
}))

vi.mock('@/components/ui/dropdown-menu', async () => {
  const React = await import('react')

  function DropdownMenu({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }

  function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
    if (asChild && React.isValidElement(children)) {
      return children
    }
    return <>{children}</>
  }

  function DropdownMenuContent({ children }: { children: React.ReactNode }) {
    return <div role="menu">{children}</div>
  }

  function DropdownMenuItem({
    children,
    onSelect,
  }: {
    children: React.ReactNode
    onSelect?: (event: Event) => void
  }) {
    return (
      <div
        role="menuitem"
        tabIndex={0}
        onClick={() => onSelect?.(new Event('select'))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSelect?.(new Event('select'))
          }
        }}
      >
        {children}
      </div>
    )
  }

  function DropdownMenuSeparator() {
    return <hr />
  }

  return {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
  }
})

vi.mock('@/components/ui/dialog', async () => {
  const React = await import('react')

  function Dialog({ children, open }: { children: React.ReactNode; open?: boolean }) {
    if (!open) return null
    return <div role="dialog">{children}</div>
  }

  function DialogContent({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>
  }

  function DialogHeader({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>
  }

  function DialogTitle({ children }: { children: React.ReactNode }) {
    return <h2>{children}</h2>
  }

  function DialogFooter({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>
  }

  return { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter }
})

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}))

vi.mock('@/app/brew-presets/repository', () => ({}))

vi.mock('@/components/ui/slider', async () => {
  const React = await import('react')

  function Slider({
    id,
    max,
    min,
    onValueChange,
    step,
    value,
  }: {
    id?: string
    max?: number
    min?: number
    onValueChange?: (value: number[]) => void
    step?: number
    value?: number[]
  }) {
    return (
      <input
        aria-label="Rating slider"
        id={id}
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
    notes: '',
    process: 'Washed',
    region: 'Nyeri',
    roast: 'Light',
    roaster: 'Glitch',
    userId: 'user-1',
    priceJpy: 0,
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

function fillRequiredBrewFields() {
  fireEvent.change(screen.getByLabelText('Temp'), {
    target: { value: '92' },
  })
  fireEvent.change(screen.getByLabelText('Grind'), {
    target: { value: '24' },
  })
}

// Find the RequestInit for the brew submit call (POST/PUT to /api/brews*)
// ignoring the /api/brew-presets GET that useEffect fires on mount.
function findBrewSubmitCall(fetchMock: ReturnType<typeof vi.fn>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = fetchMock.mock.calls.find((args: any[]) => {
    const init = args[1] as RequestInit | undefined
    return init?.method === 'POST' || init?.method === 'PUT'
  })
  return call ? call[1] as RequestInit : null
}

describe('NewBrewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock fetch for /api/brew-presets
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/brew-presets') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('given the weight inputs when the form renders then both fields allow decimal gram entries', () => {
    render(<NewBrewForm beans={beans} flavors={flavors} />)

    const beanWeightInput = screen.getByLabelText('Coffee')
    const waterWeightInput = screen.getByLabelText('Water')

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
    fireEvent.change(screen.getByLabelText('Coffee'), {
      target: { value: '1' },
    })
    fireEvent.change(screen.getByLabelText('Water'), {
      target: { value: '3' },
    })
    fillRequiredBrewFields()
    fireEvent.click(screen.getByRole('button', { name: 'Log Brew' }))

    await waitFor(() => {
      expect(findBrewSubmitCall(fetchMock)).not.toBeNull()
    })

    const requestInit = findBrewSubmitCall(fetchMock)!
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

    fireEvent.change(screen.getByLabelText('Coffee'), {
      target: { value: '15.5' },
    })
    fireEvent.change(screen.getByLabelText('Water'), {
      target: { value: '225.3' },
    })
    fillRequiredBrewFields()
    fireEvent.click(screen.getByRole('button', { name: 'Log Brew' }))

    await waitFor(() => {
      expect(findBrewSubmitCall(fetchMock)).not.toBeNull()
    })

    const requestInit = findBrewSubmitCall(fetchMock)!
    const body = JSON.parse((requestInit as RequestInit).body as string) as {
      beanWeight: number
      waterWeight: number
    }

    expect(body.beanWeight).toBe(15.5)
    expect(body.waterWeight).toBe(225.3)
  })

  // B1: Cup section contains "あとで記録" toggle (OFF by default) and sliders + flavor buttons are visible
  it('B1: given the create mode form renders, when looking at the Cup section, then a toggle labeled "あとで記録" is present and is OFF by default and sliders and flavor buttons are visible', () => {
    render(<NewBrewForm beans={beans} flavors={flavors} />)

    // The switch must be present. Production code must add aria-label="あとで記録" to the Switch.
    const toggle = screen.getByRole('switch', { name: 'あとで記録' })
    expect(toggle).toBeDefined()
    // Toggle should be unchecked (OFF) by default
    expect(toggle.getAttribute('data-state')).toBe('unchecked')

    // Sliders are visible (Taste Profile)
    const sliders = screen.getAllByRole('slider')
    expect(sliders.length).toBeGreaterThan(0)

    // Flavor Notes buttons are visible
    expect(screen.getByRole('button', { name: 'Berry' })).toBeDefined()
  })

  // B2: Toggling "あとで記録" ON hides sliders and flavor buttons but keeps Tasting Notes textarea
  it('B2: given the create mode form renders, when the user toggles "あとで記録" ON, then sliders and flavor buttons are hidden but Tasting Notes textarea remains visible', () => {
    render(<NewBrewForm beans={beans} flavors={flavors} />)

    const toggle = screen.getByRole('switch', { name: 'あとで記録' })
    fireEvent.click(toggle)

    // Sliders should be gone
    expect(screen.queryAllByRole('slider').length).toBe(0)

    // Flavor buttons should be gone
    expect(screen.queryByRole('button', { name: 'Berry' })).toBeNull()

    // Tasting Notes textarea must still be present
    expect(screen.getByPlaceholderText('How was this brew? Any observations?')).toBeDefined()
  })

  // B3: Submit with toggle ON sends zeroed cup fields and preserves notes
  it('B3: given the create mode form with toggle ON and recipe fields + notes filled, when submitting, then fetch body has zeroed cup ratings and notes text is preserved', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'brew-3' }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NewBrewForm beans={beans} flavors={flavors} />)

    // Fill recipe fields
    fireEvent.change(screen.getByRole('combobox', { name: 'Bean' }), {
      target: { value: 'bean-1' },
    })
    fireEvent.change(screen.getByLabelText('Coffee'), { target: { value: '15' } })
    fireEvent.change(screen.getByLabelText('Water'), { target: { value: '225' } })
    fillRequiredBrewFields()

    // Fill notes
    fireEvent.change(screen.getByPlaceholderText('How was this brew? Any observations?'), {
      target: { value: 'Great draft brew' },
    })

    // Toggle ON
    const toggle = screen.getByRole('switch', { name: 'あとで記録' })
    fireEvent.click(toggle)

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Log Brew' }))

    await waitFor(() => {
      expect(findBrewSubmitCall(fetchMock)).not.toBeNull()
    })

    const requestInit = findBrewSubmitCall(fetchMock)!
    const body = JSON.parse((requestInit as RequestInit).body as string) as {
      aroma: number
      acidity: number
      sweetness: number
      body: number
      overall: number
      flavorIds: string[]
      notes: string
    }

    expect(body.aroma).toBe(0)
    expect(body.acidity).toBe(0)
    expect(body.sweetness).toBe(0)
    expect(body.body).toBe(0)
    expect(body.overall).toBe(0)
    expect(body.flavorIds).toEqual([])
    expect(body.notes).toBe('Great draft brew')
  })

  // B4: Submit with toggle OFF (default) sends default slider values and notes
  it('B4: given the create mode form with toggle OFF and fields filled, when submitting, then the body contains default ratings (4,3,4,3,4) and the notes text', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ id: 'brew-4' }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NewBrewForm beans={beans} flavors={flavors} />)

    fireEvent.change(screen.getByRole('combobox', { name: 'Bean' }), {
      target: { value: 'bean-1' },
    })
    fireEvent.change(screen.getByLabelText('Coffee'), { target: { value: '15' } })
    fireEvent.change(screen.getByLabelText('Water'), { target: { value: '225' } })
    fillRequiredBrewFields()

    fireEvent.change(screen.getByPlaceholderText('How was this brew? Any observations?'), {
      target: { value: 'Lovely cup' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Log Brew' }))

    await waitFor(() => {
      expect(findBrewSubmitCall(fetchMock)).not.toBeNull()
    })

    const requestInit = findBrewSubmitCall(fetchMock)!
    const body = JSON.parse((requestInit as RequestInit).body as string) as {
      aroma: number
      acidity: number
      sweetness: number
      body: number
      overall: number
      notes: string
    }

    expect(body.aroma).toBe(4)
    expect(body.acidity).toBe(3)
    expect(body.sweetness).toBe(4)
    expect(body.body).toBe(3)
    expect(body.overall).toBe(4)
    expect(body.notes).toBe('Lovely cup')
  })

  // B5: Edit mode with initialBrew.overall === 0 initializes toggle ON and hides sliders
  it('B5: given edit mode with initialBrew.overall === 0, when the form renders, then the "あとで記録" toggle is ON and sliders are not visible', () => {
    const draftBrew: BrewWithBean = {
      acidity: 0,
      aroma: 0,
      bean: {
        country: 'Kenya',
        created: '2026-04-18T00:00:00.000Z',
        farm: 'Kieni',
        id: 'bean-1',
        name: 'Kenya AA',
        notes: '',
        process: 'Washed',
        region: 'Nyeri',
        roast: 'Light',
        roaster: 'Glitch',
        userId: 'user-1',
        priceJpy: 0,
        updated: '2026-04-18T00:00:00.000Z',
        variety: 'SL28',
      },
      userId: 'user-1',
      beanGrind: 24,
      beanId: 'bean-1',
      beanWeight: 15,
      body: 0,
      created: '2026-04-18T00:00:00.000Z',
      flavors: [],
      id: 'brew-draft',
      notes: '',
      overall: 0,
      steps: [],
      sweetness: 0,
      updated: '2026-04-18T00:00:00.000Z',
      waterTemp: 92,
      waterWeight: 225,
    }

    render(<NewBrewForm mode="edit" beans={beans} flavors={flavors} initialBrew={draftBrew} />)

    const toggle = screen.getByRole('switch', { name: 'あとで記録' })
    expect(toggle.getAttribute('data-state')).toBe('checked')

    // Sliders should be hidden
    expect(screen.queryAllByRole('slider').length).toBe(0)
  })

  // B6: Edit mode with initialBrew.overall === 4 initializes toggle OFF and shows sliders with stored values
  it('B6: given edit mode with initialBrew.overall === 4, when the form renders, then the toggle is OFF and sliders are visible', () => {
    const normalBrew: BrewWithBean = {
      acidity: 3,
      aroma: 4,
      bean: {
        country: 'Kenya',
        created: '2026-04-18T00:00:00.000Z',
        farm: 'Kieni',
        id: 'bean-1',
        name: 'Kenya AA',
        notes: '',
        process: 'Washed',
        region: 'Nyeri',
        roast: 'Light',
        roaster: 'Glitch',
        userId: 'user-1',
        priceJpy: 0,
        updated: '2026-04-18T00:00:00.000Z',
        variety: 'SL28',
      },
      userId: 'user-1',
      beanGrind: 24,
      beanId: 'bean-1',
      beanWeight: 15,
      body: 3,
      created: '2026-04-18T00:00:00.000Z',
      flavors: [],
      id: 'brew-normal',
      notes: 'Good',
      overall: 4,
      steps: [],
      sweetness: 4,
      updated: '2026-04-18T00:00:00.000Z',
      waterTemp: 92,
      waterWeight: 225,
    }

    render(<NewBrewForm mode="edit" beans={beans} flavors={flavors} initialBrew={normalBrew} />)

    const toggle = screen.getByRole('switch', { name: 'あとで記録' })
    expect(toggle.getAttribute('data-state')).toBe('unchecked')

    // Sliders should be visible
    const sliders = screen.getAllByRole('slider')
    expect(sliders.length).toBeGreaterThan(0)
  })

  // B7: Edit mode, initialBrew.overall === 0, user turns toggle OFF and submits — gets default slider values
  it('B7: given edit mode with initialBrew.overall === 0, when the user turns toggle OFF and submits without touching sliders, then fetch body contains default values aroma=4 acidity=3 sweetness=4 body=3 overall=4', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    // Recipe is complete (steps non-empty), only the cup evaluation is
    // in draft state (all ratings = 0).
    const draftBrew: BrewWithBean = {
      acidity: 0,
      aroma: 0,
      bean: {
        country: 'Kenya',
        created: '2026-04-18T00:00:00.000Z',
        farm: 'Kieni',
        id: 'bean-1',
        name: 'Kenya AA',
        notes: '',
        process: 'Washed',
        region: 'Nyeri',
        roast: 'Light',
        roaster: 'Glitch',
        userId: 'user-1',
        priceJpy: 0,
        updated: '2026-04-18T00:00:00.000Z',
        variety: 'SL28',
      },
      userId: 'user-1',
      beanGrind: 24,
      beanId: 'bean-1',
      beanWeight: 15,
      body: 0,
      created: '2026-04-18T00:00:00.000Z',
      flavors: [],
      id: 'brew-draft',
      notes: '',
      overall: 0,
      steps: [{ time: 120, water: 225 }],
      sweetness: 0,
      updated: '2026-04-18T00:00:00.000Z',
      waterTemp: 92,
      waterWeight: 225,
    }

    render(<NewBrewForm mode="edit" beans={beans} flavors={flavors} initialBrew={draftBrew} />)

    // Toggle is ON initially; turn it OFF
    const toggle = screen.getByRole('switch', { name: 'あとで記録' })
    fireEvent.click(toggle)

    // Submit without touching sliders
    fireEvent.click(screen.getByRole('button', { name: 'Save Brew' }))

    await waitFor(() => {
      expect(findBrewSubmitCall(fetchMock)).not.toBeNull()
    })

    const requestInit = findBrewSubmitCall(fetchMock)!
    const body = JSON.parse((requestInit as RequestInit).body as string) as {
      aroma: number
      acidity: number
      sweetness: number
      body: number
      overall: number
    }

    expect(body.aroma).toBe(4)
    expect(body.acidity).toBe(3)
    expect(body.sweetness).toBe(4)
    expect(body.body).toBe(3)
    expect(body.overall).toBe(4)
  })

  // B8: Clicking the "あとで記録" label text toggles the switch (click area extension)
  it('B8: given the create mode form, when the user clicks the "あとで記録" label text, then the switch state toggles', () => {
    render(<NewBrewForm beans={beans} flavors={flavors} />)

    const toggle = screen.getByRole('switch', { name: 'あとで記録' })
    expect(toggle.getAttribute('data-state')).toBe('unchecked')

    // The visible label text should act as a click target for the switch
    fireEvent.click(screen.getByText('あとで記録'))

    expect(toggle.getAttribute('data-state')).toBe('checked')

    // Clicking again switches it back
    fireEvent.click(screen.getByText('あとで記録'))
    expect(toggle.getAttribute('data-state')).toBe('unchecked')
  })

  // U1: All 5 parameter inputs render an inline unit suffix next to the field
  it('U1: given the Parameters section renders, when inspecting each input wrapper, then a muted unit suffix is present next to the input', () => {
    render(<NewBrewForm beans={beans} flavors={flavors} />)

    const cases: Array<{ label: string; unit: string }> = [
      { label: 'Coffee', unit: 'g' },
      { label: 'Water', unit: 'g' },
      { label: 'Temp', unit: '°C' },
      { label: 'Grind', unit: 'clicks' },
    ]

    for (const { label, unit } of cases) {
      const input = screen.getByLabelText(label) as HTMLInputElement
      const wrapper = input.parentElement
      expect(wrapper).not.toBeNull()
      const suffix = Array.from(wrapper!.querySelectorAll('span')).find(
        (s) => s.textContent === unit,
      )
      expect(suffix, `expected suffix "${unit}" next to ${label}`).toBeDefined()
    }
  })

  // U2: Labels no longer carry the "(unit)" parenthetical
  it('U2: given the Parameters section renders, when reading label text, then labels do not include a parenthesised unit', () => {
    render(<NewBrewForm beans={beans} flavors={flavors} />)

    for (const label of ['Coffee', 'Water', 'Temp', 'Grind']) {
      expect(screen.getByLabelText(label)).toBeDefined()
    }

    for (const oldLabel of ['Coffee (g)', 'Water (g)', 'Temp (°C)', 'Grind (clicks)']) {
      expect(screen.queryByText(oldLabel)).toBeNull()
    }
  })

  // U3: Extraction Steps column headers no longer carry parenthesised units
  it('U3: given the Extraction Steps section renders, when reading column headers, then they are "Time" and "Water" with no parenthesised units', () => {
    render(<NewBrewForm beans={beans} flavors={flavors} />)

    expect(screen.getByText('Time')).toBeDefined()
    expect(screen.getAllByText('Water').length).toBeGreaterThan(0)
    expect(screen.queryByText('Time (s)')).toBeNull()
    expect(screen.queryByText('Water (g)')).toBeNull()
  })

  // U4: Each parameter input wires aria-describedby to its unit suffix
  it('U4: given the Parameters section renders, when inspecting aria-describedby on each input, then it references the matching unit suffix span', () => {
    render(<NewBrewForm beans={beans} flavors={flavors} />)

    const cases: Array<{ label: string; unit: string; suffixId: string }> = [
      { label: 'Coffee', unit: 'g', suffixId: 'beanWeight-unit' },
      { label: 'Water', unit: 'g', suffixId: 'waterWeight-unit' },
      { label: 'Temp', unit: '°C', suffixId: 'waterTemp-unit' },
      { label: 'Grind', unit: 'clicks', suffixId: 'grindSize-unit' },
    ]

    for (const { label, unit, suffixId } of cases) {
      const input = screen.getByLabelText(label) as HTMLInputElement
      expect(input.getAttribute('aria-describedby')).toBe(suffixId)
      const suffix = document.getElementById(suffixId)
      expect(suffix, `expected <span id="${suffixId}"> to exist`).not.toBeNull()
      expect(suffix!.textContent).toBe(unit)
    }
  })

  // U5: Total Time input has been removed from the Parameters section
  it('U5: given the create mode form renders, when looking for a Total Time input, then there is no such labelled field and no brewTime-unit suffix', () => {
    render(<NewBrewForm beans={beans} flavors={flavors} />)

    expect(screen.queryByLabelText('Total Time')).toBeNull()
    expect(screen.queryByLabelText('Total Time (sec)')).toBeNull()
    expect(screen.queryByText('Total Time')).toBeNull()
    expect(document.getElementById('brewTime-unit')).toBeNull()
    expect(document.getElementById('brewTime')).toBeNull()
  })

  // F2: Rating slider label association
  it('rating sliders are associated with their FieldLabel via htmlFor', () => {
    render(<NewBrewForm beans={beans} flavors={flavors} />)

    // The recordLater toggle is OFF by default, so the slider section IS rendered.
    for (const label of ['Aroma', 'Acidity', 'Sweetness', 'Body', 'Overall']) {
      const slider = screen.getByLabelText(label)
      expect(slider).toBeDefined()
    }
  })

  describe('timer', () => {
    // Note: `Number('')` is `0` which is finite, so empty-water lap rows are
    // still included in the submitted `steps` payload as `{ time, water: 0 }`.
    // This is pre-existing behavior and not in scope for issue #62.
    //
    // Lap rounding rule: Math.round(timerElapsed / 5000) * 5
    //   — rounds to nearest 5 s (e.g. 27 s → 25, 28 s → 30, 30 s → 30, 45 s → 45)
    // Manual entry precision: STEP_TIME_INTERVAL = 1 (1-second snap on blur)

    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    // T5: After running 30 s, clicking Lap appends a step row with time='30' and water=''
    // Math.round(30000 / 5000) * 5 = 30 — same as before under new rounding rule
    it('T5: given the timer runs for 30 s, when the user clicks Lap, then a new step row is appended with time "30" and empty water', () => {
      render(<NewBrewForm beans={beans} flavors={flavors} />)

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Start' }))
      })

      act(() => {
        vi.advanceTimersByTime(30000)
      })

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Lap' }))
      })

      const timeInput = screen.getByLabelText('Step 2 time') as HTMLInputElement
      const waterInput = screen.getByLabelText('Step 2 water') as HTMLInputElement

      expect(timeInput.value).toBe('30')
      expect(waterInput.value).toBe('')
    })

    // T5b: Lap rounding — 27 s rounds DOWN to 25
    // Math.round(27000 / 5000) * 5 = Math.round(5.4) * 5 = 5 * 5 = 25
    it('T5b: given the timer runs for 27 s, when the user clicks Lap, then the step time is "25" (nearest 5 s, round down)', () => {
      render(<NewBrewForm beans={beans} flavors={flavors} />)

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Start' }))
      })

      act(() => {
        vi.advanceTimersByTime(27000)
      })

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Lap' }))
      })

      const timeInput = screen.getByLabelText('Step 2 time') as HTMLInputElement
      expect(timeInput.value).toBe('25')
    })

    // T5c: Lap rounding — 28 s rounds UP to 30
    // Math.round(28000 / 5000) * 5 = Math.round(5.6) * 5 = 6 * 5 = 30
    it('T5c: given the timer runs for 28 s, when the user clicks Lap, then the step time is "30" (nearest 5 s, round up)', () => {
      render(<NewBrewForm beans={beans} flavors={flavors} />)

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Start' }))
      })

      act(() => {
        vi.advanceTimersByTime(28000)
      })

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Lap' }))
      })

      const timeInput = screen.getByLabelText('Step 2 time') as HTMLInputElement
      expect(timeInput.value).toBe('30')
    })

    // T6: After a lap at 45 s, Stop then Reset clears the timer AND the step rows
    it('T6: given a lap row was added at 45 s, when Stop and Reset are clicked, then the timer returns to idle AND the step rows are cleared back to a single empty row', () => {
      render(<NewBrewForm beans={beans} flavors={flavors} />)

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Start' }))
      })

      act(() => {
        vi.advanceTimersByTime(45000)
      })

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Lap' }))
      })

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
      })

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
      })

      // The lap row (Step 2) must be gone
      expect(screen.queryByLabelText('Step 2 time')).toBeNull()

      // The initial single empty row is restored
      const step1Time = screen.getByLabelText('Step 1 time') as HTMLInputElement
      expect(step1Time.value).toBe('')
      const step1Water = screen.getByLabelText('Step 1 water') as HTMLInputElement
      expect(step1Water.value).toBe('')

      // Timer is back to idle
      expect(screen.getByRole('button', { name: 'Start' })).toBeDefined()
      expect(screen.queryByRole('button', { name: 'Lap' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull()
      expect(screen.getByRole('timer').textContent).toBe('00:00.00')
    })

    // T6b: Reset does NOT clear other form fields
    it('T6b: given other form fields are filled, when Stop and Reset are clicked, then only step rows are cleared and all other fields retain their values', () => {
      render(<NewBrewForm beans={beans} flavors={flavors} />)

      // Fill recipe fields + notes
      fireEvent.change(screen.getByRole('combobox', { name: 'Bean' }), {
        target: { value: 'bean-1' },
      })
      fireEvent.change(screen.getByLabelText('Coffee'), { target: { value: '15' } })
      fireEvent.change(screen.getByLabelText('Water'), { target: { value: '225' } })
      fillRequiredBrewFields() // sets Temp=92, Grind=24
      fireEvent.change(screen.getByPlaceholderText('How was this brew? Any observations?'), {
        target: { value: 'Lovely brew notes' },
      })

      // Timer sequence: Start → 30 s → Lap → Stop → Reset
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Start' }))
      })
      act(() => {
        vi.advanceTimersByTime(30000)
      })
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Lap' }))
      })
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
      })
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
      })

      // Other fields must be preserved
      const beanSelect = screen.getByRole('combobox', { name: 'Bean' }) as HTMLSelectElement
      expect(beanSelect.value).toBe('bean-1')

      const coffeeInput = screen.getByLabelText('Coffee') as HTMLInputElement
      expect(coffeeInput.value).toBe('15')

      const waterInput = screen.getByLabelText('Water') as HTMLInputElement
      expect(waterInput.value).toBe('225')

      const tempInput = screen.getByLabelText('Temp') as HTMLInputElement
      expect(tempInput.value).toBe('92')

      const grindInput = screen.getByLabelText('Grind') as HTMLInputElement
      expect(grindInput.value).toBe('24')

      const notesTextarea = screen.getByPlaceholderText('How was this brew? Any observations?') as HTMLTextAreaElement
      expect(notesTextarea.value).toBe('Lovely brew notes')
    })

    // T6c: Reset clears manually-edited Step 1 as well (Reset is intentionally destructive at the row level)
    it('T6c: given Step 1 was manually edited, when Start → Lap → Stop → Reset, then Step 1 is cleared and Step 2 is gone', () => {
      render(<NewBrewForm beans={beans} flavors={flavors} />)

      // Manually edit Step 1
      fireEvent.change(screen.getByLabelText('Step 1 time'), { target: { value: '37' } })
      fireEvent.change(screen.getByLabelText('Step 1 water'), { target: { value: '40' } })

      // Timer sequence: Start → 25 s → Lap → Stop → Reset
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Start' }))
      })
      act(() => {
        vi.advanceTimersByTime(25000)
      })
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Lap' }))
      })
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
      })
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
      })

      // Step 1 is cleared back to empty
      const step1Time = screen.getByLabelText('Step 1 time') as HTMLInputElement
      expect(step1Time.value).toBe('')
      const step1Water = screen.getByLabelText('Step 1 water') as HTMLInputElement
      expect(step1Water.value).toBe('')

      // Step 2 (lap row) is gone
      expect(screen.queryByLabelText('Step 2 time')).toBeNull()
    })

    // T_manual_entry_precision: manual time input accepts 1-second precision (STEP_TIME_INTERVAL=1)
    it('T_manual_entry_precision: given a manually entered step time of 37, when the form submits, then the steps payload contains time: 37 (not snapped to 35)', async () => {
      // Use real timers for the async fetch/waitFor portion of this test
      vi.useRealTimers()

      const fetchMock = vi.fn().mockResolvedValue({
        json: async () => ({ id: 'brew-manual' }),
        ok: true,
      })
      vi.stubGlobal('fetch', fetchMock)

      render(<NewBrewForm beans={beans} flavors={flavors} />)

      // Fill required fields
      fireEvent.change(screen.getByRole('combobox', { name: 'Bean' }), {
        target: { value: 'bean-1' },
      })
      fireEvent.change(screen.getByLabelText('Coffee'), { target: { value: '15' } })
      fireEvent.change(screen.getByLabelText('Water'), { target: { value: '225' } })
      fillRequiredBrewFields()

      // Manually enter step 1 time = 37 s and water = 40 g, then blur
      fireEvent.change(screen.getByLabelText('Step 1 time'), { target: { value: '37' } })
      fireEvent.blur(screen.getByLabelText('Step 1 time'))
      fireEvent.change(screen.getByLabelText('Step 1 water'), { target: { value: '40' } })
      fireEvent.blur(screen.getByLabelText('Step 1 water'))

      fireEvent.click(screen.getByRole('button', { name: 'Log Brew' }))

      await waitFor(() => {
        expect(findBrewSubmitCall(fetchMock)).not.toBeNull()
      })

      const requestInit = findBrewSubmitCall(fetchMock)!
      const body = JSON.parse((requestInit as RequestInit).body as string) as {
        steps: Array<{ time: number; water: number }>
      }

      // With STEP_TIME_INTERVAL=1, snapToInterval(37, 1) = 37
      const step = body.steps.find((s) => s.water === 40)
      expect(step).toBeDefined()
      expect(step!.time).toBe(37)
    })

    // T_existing: fake timers do not affect non-timer form state
    it('T_existing: given fake timers are active, when the form is rendered, then the existing "Choose a bean" Select still renders and "あとで記録" toggle is OFF by default', () => {
      render(<NewBrewForm beans={beans} flavors={flavors} />)

      expect(screen.getByRole('combobox', { name: 'Bean' })).toBeDefined()
      const select = screen.getByRole('combobox', { name: 'Bean' }) as HTMLSelectElement
      expect(select.value).toBe('')

      const toggle = screen.getByRole('switch', { name: 'あとで記録' })
      expect(toggle.getAttribute('data-state')).toBe('unchecked')
    })
  })

  // P1: Selecting a user preset overwrites stepInputs with the preset's steps (built-in presets removed in PR #97)
  it('P1: given a user preset is loaded, when the user clicks "Insert preset" and selects it, then step inputs are populated with that preset\'s step values', async () => {
    const userPreset = {
      id: 'user-preset-p1',
      name: 'My V60',
      description: 'My recipe',
      defaultBeanWeight: 30,
      defaultWaterTemp: 93,
      steps: [
        { time: 45, water: 50 },
        { time: 90, water: 100 },
        { time: 135, water: 145 },
        { time: 180, water: 185 },
        { time: 210, water: 220 },
      ],
      created: '2026-01-01T00:00:00Z',
      updated: '2026-01-01T00:00:00Z',
    }

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/brew-presets') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([userPreset]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    }))

    render(<NewBrewForm beans={beans} flavors={flavors} />)

    // Wait for user presets to load, then open dropdown and select
    await waitFor(async () => {
      const trigger = screen.getByRole('button', { name: 'Insert preset' })
      fireEvent.click(trigger)
      const presetItem = screen.getByRole('menuitem', { name: /My V60/i })
      fireEvent.click(presetItem)
    })

    // The preset has 5 steps
    const step1Time = screen.getByLabelText('Step 1 time') as HTMLInputElement
    const step1Water = screen.getByLabelText('Step 1 water') as HTMLInputElement
    expect(step1Time.value).toBe('45')
    expect(step1Water.value).toBe('50')

    // Step 5 exists
    const step5Time = screen.getByLabelText('Step 5 time') as HTMLInputElement
    const step5Water = screen.getByLabelText('Step 5 water') as HTMLInputElement
    expect(step5Time.value).toBe('210')
    expect(step5Water.value).toBe('220')

    // No step 6
    expect(screen.queryByLabelText('Step 6 time')).toBeNull()
  })

  // P2: Only user presets appear (no built-in presets, PR #97 removed them)
  it('P2: given a user preset is returned by the API, when the dropdown is opened, then only user presets appear (no built-in)', async () => {
    const userPreset = {
      id: 'user-preset-1',
      name: 'My Custom Recipe',
      description: 'Great for light roast',
      defaultBeanWeight: 18,
      defaultWaterTemp: 90,
      steps: [{ time: 30, water: 60 }, { time: 90, water: 200 }],
      created: '2026-01-01T00:00:00Z',
      updated: '2026-01-01T00:00:00Z',
    }

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/brew-presets') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([userPreset]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    }))

    render(<NewBrewForm beans={beans} flavors={flavors} />)

    // Wait for user presets to load
    await waitFor(() => {
      const trigger = screen.getByRole('button', { name: 'Insert preset' })
      fireEvent.click(trigger)
      expect(screen.getByRole('menuitem', { name: /My Custom Recipe/i })).toBeDefined()
    })

    // User preset appears; no built-in presets
    expect(screen.getByRole('menuitem', { name: /My Custom Recipe/i })).toBeDefined()
    expect(screen.queryByRole('menuitem', { name: /Hario V60 4:6/i })).toBeNull()
  })

  // P3: Selecting a user preset applies its step values
  it('P3: given a user preset is loaded, when the user selects it from the dropdown, then step inputs are populated with that preset\'s steps', async () => {
    const userPreset = {
      id: 'user-preset-2',
      name: 'My Pour Over',
      description: '',
      defaultBeanWeight: 15,
      defaultWaterTemp: 92,
      steps: [{ time: 30, water: 50 }, { time: 60, water: 150 }],
      created: '2026-01-01T00:00:00Z',
      updated: '2026-01-01T00:00:00Z',
    }

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/brew-presets') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([userPreset]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    }))

    render(<NewBrewForm beans={beans} flavors={flavors} />)

    // Wait for user presets to load and open dropdown
    await waitFor(async () => {
      const trigger = screen.getByRole('button', { name: 'Insert preset' })
      fireEvent.click(trigger)
      expect(screen.getByRole('menuitem', { name: /My Pour Over/i })).toBeDefined()
    })

    // Select the user preset
    fireEvent.click(screen.getByRole('menuitem', { name: /My Pour Over/i }))

    // Verify step inputs are populated
    const step1Time = screen.getByLabelText('Step 1 time') as HTMLInputElement
    const step1Water = screen.getByLabelText('Step 1 water') as HTMLInputElement
    expect(step1Time.value).toBe('30')
    expect(step1Water.value).toBe('50')
  })

  // P4: "Save as preset" button exists; clicking it opens a dialog; submitting calls POST /api/brew-presets
  it('P4: given valid step inputs, when "Save current as preset" is clicked and name is entered, then POST /api/brew-presets is called with the correct body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NewBrewForm beans={beans} flavors={flavors} />)

    // Fill required brew fields
    fireEvent.change(screen.getByLabelText('Coffee'), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText('Water'), { target: { value: '300' } })
    fireEvent.change(screen.getByLabelText('Temp'), { target: { value: '93' } })
    fireEvent.change(screen.getByLabelText('Step 1 time'), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText('Step 1 water'), { target: { value: '50' } })
    fireEvent.blur(screen.getByLabelText('Step 1 water'))

    // Click "Save current as preset"
    const saveButton = screen.getByRole('button', { name: /save.*preset/i })
    expect(saveButton).toBeDefined()
    fireEvent.click(saveButton)

    // Dialog should open
    expect(screen.getByRole('dialog')).toBeDefined()

    // Enter preset name
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'My New Preset' } })

    // Click Save Preset button in dialog
    const savePresetButton = screen.getByRole('button', { name: /Save Preset/i })
    fireEvent.click(savePresetButton)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findPostCall = () => fetchMock.mock.calls.find((args: any[]) => args[0] === '/api/brew-presets' && (args[1] as RequestInit)?.method === 'POST')

    await waitFor(() => {
      expect(findPostCall()).toBeDefined()
    })

    const postCall = findPostCall()!
    const postBody = JSON.parse((postCall[1] as RequestInit).body as string) as { name: string; defaultWaterWeight: number; steps: Array<{ time: number; water: number }> }
    expect(postBody.name).toBe('My New Preset')
    expect(postBody.steps.length).toBeGreaterThan(0)
    // defaultWaterWeight should match the current waterWeight value (300)
    expect(postBody.defaultWaterWeight).toBe(300)
  })

  // Ratio: "Keep ratio" toggle exists and is ON by default
  it('Ratio-1: given the create mode form renders, then the "Keep ratio" switch exists and is ON by default', () => {
    render(<NewBrewForm beans={beans} flavors={flavors} />)

    const toggle = screen.getByRole('switch', { name: 'Keep ratio' })
    expect(toggle).toBeDefined()
    expect(toggle.getAttribute('data-state')).toBe('checked')
  })

  // Ratio-2: applyPreset with defaultWaterWeight > 0 and ratioLocked ON overwrites beanWeight and waterWeight
  it('Ratio-2: given a preset with defaultBeanWeight=20 and defaultWaterWeight=300, when applied with ratio ON, then beanWeight=20 and waterWeight=300', async () => {
    const presetWithWater = {
      id: 'user-preset-ratio',
      name: 'Ratio Preset',
      description: '',
      defaultBeanWeight: 20,
      defaultWaterTemp: 93,
      defaultWaterWeight: 300,
      steps: [{ time: 45, water: 150 }, { time: 90, water: 300 }],
      created: '2026-01-01T00:00:00Z',
      updated: '2026-01-01T00:00:00Z',
    }

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/brew-presets') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([presetWithWater]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    }))

    render(<NewBrewForm beans={beans} flavors={flavors} />)

    await waitFor(async () => {
      const trigger = screen.getByRole('button', { name: 'Insert preset' })
      fireEvent.click(trigger)
      const presetItem = screen.getByRole('menuitem', { name: /Ratio Preset/i })
      fireEvent.click(presetItem)
    })

    const coffeeInput = screen.getByLabelText('Coffee') as HTMLInputElement
    const waterInput = screen.getByLabelText('Water') as HTMLInputElement
    expect(coffeeInput.value).toBe('20')
    expect(waterInput.value).toBe('300')
  })

  // Ratio-3: toggle ON, beanWeight doubling scales waterWeight and steps
  it('Ratio-3: given ratio ON and a preset applied (bean=20, water=300, steps=[150,300]), when beanWeight is doubled to 40, then waterWeight=600 and steps scale accordingly (STEP_WATER_INTERVAL rounded)', async () => {
    const presetWithWater = {
      id: 'user-preset-ratio3',
      name: 'Scale Preset',
      description: '',
      defaultBeanWeight: 20,
      defaultWaterTemp: 93,
      defaultWaterWeight: 300,
      steps: [{ time: 45, water: 150 }, { time: 90, water: 300 }],
      created: '2026-01-01T00:00:00Z',
      updated: '2026-01-01T00:00:00Z',
    }

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/brew-presets') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([presetWithWater]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    }))

    render(<NewBrewForm beans={beans} flavors={flavors} />)

    // Apply preset
    await waitFor(async () => {
      const trigger = screen.getByRole('button', { name: 'Insert preset' })
      fireEvent.click(trigger)
      const presetItem = screen.getByRole('menuitem', { name: /Scale Preset/i })
      fireEvent.click(presetItem)
    })

    // Double the bean weight
    fireEvent.change(screen.getByLabelText('Coffee'), { target: { value: '40' } })

    const waterInput = screen.getByLabelText('Water') as HTMLInputElement
    expect(waterInput.value).toBe('600')

    // Step water values should be doubled: 150*2=300, 300*2=600
    const step1Water = screen.getByLabelText('Step 1 water') as HTMLInputElement
    expect(step1Water.value).toBe('300')
    const step2Water = screen.getByLabelText('Step 2 water') as HTMLInputElement
    expect(step2Water.value).toBe('600')
  })

  // Ratio-4: toggle ON, waterWeight change scales beanWeight
  it('Ratio-4: given ratio ON and a preset applied (bean=20, water=300), when waterWeight is halved to 150, then beanWeight=10', async () => {
    const presetWithWater = {
      id: 'user-preset-ratio4',
      name: 'Halve Preset',
      description: '',
      defaultBeanWeight: 20,
      defaultWaterTemp: 93,
      defaultWaterWeight: 300,
      steps: [{ time: 45, water: 150 }],
      created: '2026-01-01T00:00:00Z',
      updated: '2026-01-01T00:00:00Z',
    }

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/brew-presets') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([presetWithWater]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    }))

    render(<NewBrewForm beans={beans} flavors={flavors} />)

    await waitFor(async () => {
      const trigger = screen.getByRole('button', { name: 'Insert preset' })
      fireEvent.click(trigger)
      const presetItem = screen.getByRole('menuitem', { name: /Halve Preset/i })
      fireEvent.click(presetItem)
    })

    // Halve the water weight
    fireEvent.change(screen.getByLabelText('Water'), { target: { value: '150' } })

    const coffeeInput = screen.getByLabelText('Coffee') as HTMLInputElement
    expect(coffeeInput.value).toBe('10')
  })

  // Ratio-5: toggle OFF, beanWeight change does NOT affect waterWeight or steps
  it('Ratio-5: given ratio toggle is turned OFF, when beanWeight changes, then waterWeight and steps are unchanged', async () => {
    const presetWithWater = {
      id: 'user-preset-ratio5',
      name: 'No Scale Preset',
      description: '',
      defaultBeanWeight: 20,
      defaultWaterTemp: 93,
      defaultWaterWeight: 300,
      steps: [{ time: 45, water: 150 }],
      created: '2026-01-01T00:00:00Z',
      updated: '2026-01-01T00:00:00Z',
    }

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/brew-presets') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([presetWithWater]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    }))

    render(<NewBrewForm beans={beans} flavors={flavors} />)

    await waitFor(async () => {
      const trigger = screen.getByRole('button', { name: 'Insert preset' })
      fireEvent.click(trigger)
      const presetItem = screen.getByRole('menuitem', { name: /No Scale Preset/i })
      fireEvent.click(presetItem)
    })

    // Turn ratio toggle OFF
    const ratioToggle = screen.getByRole('switch', { name: 'Keep ratio' })
    fireEvent.click(ratioToggle)

    // Change bean weight
    fireEvent.change(screen.getByLabelText('Coffee'), { target: { value: '40' } })

    // waterWeight should remain unchanged
    const waterInput = screen.getByLabelText('Water') as HTMLInputElement
    expect(waterInput.value).toBe('300')

    // step water should remain unchanged
    const step1Water = screen.getByLabelText('Step 1 water') as HTMLInputElement
    expect(step1Water.value).toBe('150')
  })

  // Ratio-6: 0/empty beanWeight does not trigger scaling
  it('Ratio-6: given ratio ON, when beanWeight is set to empty string, then waterWeight and steps do not change', async () => {
    const presetWithWater = {
      id: 'user-preset-ratio6',
      name: 'Zero Input Preset',
      description: '',
      defaultBeanWeight: 20,
      defaultWaterTemp: 93,
      defaultWaterWeight: 300,
      steps: [{ time: 45, water: 150 }],
      created: '2026-01-01T00:00:00Z',
      updated: '2026-01-01T00:00:00Z',
    }

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url === '/api/brew-presets') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([presetWithWater]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    }))

    render(<NewBrewForm beans={beans} flavors={flavors} />)

    await waitFor(async () => {
      const trigger = screen.getByRole('button', { name: 'Insert preset' })
      fireEvent.click(trigger)
      const presetItem = screen.getByRole('menuitem', { name: /Zero Input Preset/i })
      fireEvent.click(presetItem)
    })

    // Clear the bean weight
    fireEvent.change(screen.getByLabelText('Coffee'), { target: { value: '' } })

    // waterWeight should remain unchanged
    const waterInput = screen.getByLabelText('Water') as HTMLInputElement
    expect(waterInput.value).toBe('300')
  })
})
