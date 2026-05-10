import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const { pushMock, refreshMock, toastMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  toastMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}))

vi.mock('@/components/ui/use-toast', () => ({
  toast: toastMock,
}))

vi.mock('@/components/pour-chart', () => ({
  PourChart: () => <div data-testid="pour-chart" />,
}))

import { PresetEditForm } from './preset-edit-form'

const samplePreset = {
  id: 'preset-1',
  userId: 'user-1',
  name: 'My Preset',
  description: 'A description',
  brewRatio: 15,
  steps: [{ time: 30, water: 50 }],
  created: '2026-01-01T00:00:00Z',
  updated: '2026-01-01T00:00:00Z',
}

describe('PresetEditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('renders all form fields with initial preset values', () => {
    render(<PresetEditForm preset={samplePreset} />)

    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('My Preset')
    expect((screen.getByLabelText('Description') as HTMLTextAreaElement).value).toBe('A description')
    expect((screen.getByLabelText('Brew Ratio (1:N)') as HTMLInputElement).value).toBe('15')
  })

  it('shows empty string for brewRatio when value is 0', () => {
    const preset = { ...samplePreset, brewRatio: 0 }
    render(<PresetEditForm preset={preset} />)

    expect((screen.getByLabelText('Brew Ratio (1:N)') as HTMLInputElement).value).toBe('')
  })

  it('initializes with one empty step row when steps is empty', () => {
    const preset = { ...samplePreset, steps: [] }
    render(<PresetEditForm preset={preset} />)

    const step1TimeInput = screen.getByLabelText('Step 1 time')
    expect(step1TimeInput).toBeDefined()
    expect((step1TimeInput as HTMLInputElement).value).toBe('')
  })

  it('disables Save button when name is empty', () => {
    render(<PresetEditForm preset={samplePreset} />)

    const nameInput = screen.getByLabelText('Name')
    fireEvent.change(nameInput, { target: { value: '' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect((saveButton as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables Save button when name is non-empty', () => {
    render(<PresetEditForm preset={samplePreset} />)

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect((saveButton as HTMLButtonElement).disabled).toBe(false)
  })

  it('renders PourChart', () => {
    render(<PresetEditForm preset={samplePreset} />)

    expect(screen.getByTestId('pour-chart')).toBeDefined()
  })

  it('calls PUT /api/brew-presets/:id with brewRatio in body on Save', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    render(<PresetEditForm preset={samplePreset} />)

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/brew-presets/preset-1')
    expect(options.method).toBe('PUT')
    const body = JSON.parse(options.body as string)
    expect(body.name).toBe('My Preset')
    expect(body.description).toBe('A description')
    expect(body.brewRatio).toBe(15)
    expect(Array.isArray(body.steps)).toBe(true)
  })

  it('calls router.push("/presets") on successful save', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

    render(<PresetEditForm preset={samplePreset} />)

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/presets')
    })
  })

  it('shows "Preset updated" toast on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

    render(<PresetEditForm preset={samplePreset} />)

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith({ title: 'Preset updated' })
    })
  })

  it('shows destructive toast on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    render(<PresetEditForm preset={samplePreset} />)

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith({
        title: 'Failed to update preset',
        variant: 'destructive',
      })
    })
  })

  it('shows "At least one valid step is required" destructive toast and does not call fetch when all step inputs are empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    render(<PresetEditForm preset={samplePreset} />)

    const step1TimeInput = screen.getByLabelText('Step 1 time')
    const step1WaterInput = screen.getByLabelText('Step 1 water')
    fireEvent.change(step1TimeInput, { target: { value: '' } })
    fireEvent.change(step1WaterInput, { target: { value: '' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith({
        title: 'At least one valid step is required',
        variant: 'destructive',
      })
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('steps in PUT body are sorted ascending and deduplicated', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const preset = {
      ...samplePreset,
      steps: [
        { time: 60, water: 100 },
        { time: 30, water: 50 },
        { time: 30, water: 50 },
      ],
    }
    render(<PresetEditForm preset={preset} />)

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(options.body as string)
    const steps = body.steps as Array<{ time: number; water: number }>
    expect(steps[0].time).toBeLessThan(steps[1].time)
    expect(steps.length).toBe(2)
  })
})
