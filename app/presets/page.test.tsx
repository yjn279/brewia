import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { getBrewPresetsMock, requireUserMock } = vi.hoisted(() => ({
  getBrewPresetsMock: vi.fn(),
  requireUserMock: vi.fn().mockResolvedValue({ id: 'user-1', email: 'a@example.com', name: null }),
}))

vi.mock('@/lib/auth/require-user', () => ({
  requireUser: requireUserMock,
}))

vi.mock('@/lib/auth/actions', () => ({
  signOutAction: vi.fn(),
}))

vi.mock('@/components/user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}))

vi.mock('@/app/brew-presets/service', () => ({
  brewPresetsService: {
    getBrewPresets: getBrewPresetsMock,
  },
}))

vi.mock('server-only', () => ({}))

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

vi.mock('@/components/delete-resource-button', () => ({
  DeleteResourceButton: () => <button type="button">Delete</button>,
}))

import PresetsPage from './page'

describe('PresetsPage', () => {
  it('renders without throwing and shows Your Presets section (no Built-in)', async () => {
    getBrewPresetsMock.mockResolvedValue([])

    const page = await PresetsPage()
    expect(() => render(page)).not.toThrow()

    expect(screen.getByText('Your Presets')).toBeDefined()
    expect(screen.queryByText('Built-in')).toBeNull()
    expect(screen.queryByText('Hario V60 4:6')).toBeNull()
  })

  it('shows "Your Presets" section heading', async () => {
    getBrewPresetsMock.mockResolvedValue([])

    const page = await PresetsPage()
    render(page)

    expect(screen.getByText('Your Presets')).toBeDefined()
  })

  it('shows empty state when no user presets exist', async () => {
    getBrewPresetsMock.mockResolvedValue([])

    const page = await PresetsPage()
    render(page)

    expect(screen.getByText('No saved presets yet')).toBeDefined()
  })

  it('shows user preset with edit link and delete button when presets exist', async () => {
    const userPreset = {
      id: 'preset-1',
      userId: 'user-1',
      name: 'My Custom Preset',
      description: 'A great recipe',
      brewRatio: 15,
      steps: [{ time: 30, water: 50 }],
      created: '2026-01-01T00:00:00Z',
      updated: '2026-01-01T00:00:00Z',
    }
    getBrewPresetsMock.mockResolvedValue([userPreset])

    const page = await PresetsPage()
    render(page)

    expect(screen.getByText('My Custom Preset')).toBeDefined()
    expect(screen.getByText('A great recipe')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined()
  })

  it('renders edit link with href pointing to /presets/<id>/edit', async () => {
    const userPreset = {
      id: 'preset-1',
      userId: 'user-1',
      name: 'My Custom Preset',
      description: 'A great recipe',
      brewRatio: 15,
      steps: [{ time: 30, water: 50 }],
      created: '2026-01-01T00:00:00Z',
      updated: '2026-01-01T00:00:00Z',
    }
    getBrewPresetsMock.mockResolvedValue([userPreset])

    const page = await PresetsPage()
    render(page)

    const editLink = screen.getByRole('link', { name: /edit preset/i })
    expect(editLink).toBeDefined()
    expect(editLink.getAttribute('href')).toBe('/presets/preset-1/edit')
  })

  it('includes a back link to home', async () => {
    getBrewPresetsMock.mockResolvedValue([])

    const page = await PresetsPage()
    render(page)

    const links = screen.getAllByRole('link')
    const homeLink = links.find((link) => link.getAttribute('href') === '/')
    expect(homeLink).toBeDefined()
  })
})
