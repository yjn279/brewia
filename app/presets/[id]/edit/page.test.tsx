import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { getBrewPresetByIdMock, notFoundMock, requireUserMock } = vi.hoisted(() => ({
  getBrewPresetByIdMock: vi.fn(),
  notFoundMock: vi.fn(),
  requireUserMock: vi.fn().mockResolvedValue({ id: 'user-1', email: 'a@example.com', name: null }),
}))

vi.mock('@/lib/auth/require-user', () => ({
  requireUser: requireUserMock,
}))

vi.mock('@/app/brew-presets/service', () => ({
  brewPresetsService: {
    getBrewPresetById: getBrewPresetByIdMock,
  },
}))

vi.mock('server-only', () => ({}))

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    'aria-label'?: string
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('./preset-edit-form', () => ({
  PresetEditForm: ({ preset }: { preset: { name: string } }) => (
    <div data-testid="preset-edit-form">{preset.name}</div>
  ),
}))

import EditPresetPage from './page'

const samplePreset = {
  id: 'preset-1',
  userId: 'user-1',
  name: 'My Preset',
  description: 'A description',
  defaultBeanWeight: 20,
  defaultWaterTemp: 93,
  steps: [{ time: 30, water: 50 }],
  created: '2026-01-01T00:00:00Z',
  updated: '2026-01-01T00:00:00Z',
}

describe('EditPresetPage', () => {
  it('renders "Edit Preset" heading when preset exists', async () => {
    getBrewPresetByIdMock.mockResolvedValue(samplePreset)

    const page = await EditPresetPage({ params: Promise.resolve({ id: 'preset-1' }) })
    render(page)

    expect(screen.getByText('Edit Preset')).toBeDefined()
  })

  it('renders a back link to /presets', async () => {
    getBrewPresetByIdMock.mockResolvedValue(samplePreset)

    const page = await EditPresetPage({ params: Promise.resolve({ id: 'preset-1' }) })
    render(page)

    const backLink = screen.getByRole('link', { name: /back to presets/i })
    expect(backLink).toBeDefined()
    expect(backLink.getAttribute('href')).toBe('/presets')
  })

  it('renders the preset edit form', async () => {
    getBrewPresetByIdMock.mockResolvedValue(samplePreset)

    const page = await EditPresetPage({ params: Promise.resolve({ id: 'preset-1' }) })
    render(page)

    expect(screen.getByTestId('preset-edit-form')).toBeDefined()
  })

  it('calls notFound when preset does not exist', async () => {
    getBrewPresetByIdMock.mockResolvedValue(undefined)
    notFoundMock.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND')
    })

    await expect(
      EditPresetPage({ params: Promise.resolve({ id: 'nonexistent' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFoundMock).toHaveBeenCalledTimes(1)
  })
})
