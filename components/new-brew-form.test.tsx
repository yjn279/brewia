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

function fillRequiredBrewFields() {
  fireEvent.change(screen.getByLabelText('Temp'), {
    target: { value: '92' },
  })
  fireEvent.change(screen.getByLabelText('Grind'), {
    target: { value: '24' },
  })
}

describe('NewBrewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    fireEvent.change(screen.getByLabelText('Coffee'), {
      target: { value: '15.5' },
    })
    fireEvent.change(screen.getByLabelText('Water'), {
      target: { value: '225.3' },
    })
    fillRequiredBrewFields()
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
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [, requestInit] = fetchMock.mock.calls[0]
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
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [, requestInit] = fetchMock.mock.calls[0]
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
        notes: null,
        process: 'Washed',
        region: 'Nyeri',
        roast: 'Light',
        roaster: 'Glitch',
        updated: '2026-04-18T00:00:00.000Z',
        variety: 'SL28',
      },
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
        notes: null,
        process: 'Washed',
        region: 'Nyeri',
        roast: 'Light',
        roaster: 'Glitch',
        updated: '2026-04-18T00:00:00.000Z',
        variety: 'SL28',
      },
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
        notes: null,
        process: 'Washed',
        region: 'Nyeri',
        roast: 'Light',
        roaster: 'Glitch',
        updated: '2026-04-18T00:00:00.000Z',
        variety: 'SL28',
      },
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
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [, requestInit] = fetchMock.mock.calls[0]
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

  describe('timer', () => {
    // Note: `Number('')` is `0` which is finite, so empty-water lap rows are
    // still included in the submitted `steps` payload as `{ time, water: 0 }`.
    // This is pre-existing behavior and not in scope for issue #62.

    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    // T5: After running 30 s, clicking Lap appends a step row with time='30' and water=''
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

    // T6: After a lap at 45 s, Reset clears timer but lap row persists
    it('T6: given a lap row added at 45 s, when Reset is clicked, then the row persists, timer returns to idle (00:00), and Start button is visible', () => {
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
        fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
      })

      const timeInput = screen.getByLabelText('Step 2 time') as HTMLInputElement
      expect(timeInput.value).toBe('45')

      expect(screen.queryByRole('button', { name: 'Lap' })).toBeNull()
      expect(screen.getByRole('button', { name: 'Start' })).toBeDefined()
      expect(screen.getByRole('timer').textContent).toBe('00:00')
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
})
