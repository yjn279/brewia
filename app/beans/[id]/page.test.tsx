import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BeanDetailPage from '@/app/beans/[id]/page'
import type { Bean, BrewWithBean } from '@/lib/types'

const { getBeanByIdMock, getBrewsByBeanIdMock, notFoundMock, pushMock, refreshMock, requireUserMock } = vi.hoisted(
  () => ({
    getBeanByIdMock: vi.fn(),
    getBrewsByBeanIdMock: vi.fn(),
    notFoundMock: vi.fn(),
    pushMock: vi.fn(),
    refreshMock: vi.fn(),
    requireUserMock: vi.fn().mockResolvedValue({ id: 'user-1', email: 'a@example.com', name: null }),
  })
)

vi.mock('@/lib/auth/require-user', () => ({
  requireUser: requireUserMock,
}))

vi.mock('@/lib/auth/actions', () => ({
  signOutAction: vi.fn(),
}))

vi.mock('@/components/user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}))

vi.mock('@/app/beans/service', () => ({
  beansService: {
    getBeanById: getBeanByIdMock,
  },
}))

vi.mock('@/app/brews/service', () => ({
  brewsService: {
    getBrewsByBeanId: getBrewsByBeanIdMock,
  },
}))

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
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
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/brew-card', () => ({
  BrewCard: () => <div data-testid="brew-card" />,
}))

vi.mock('@/components/roast-level', () => ({
  RoastLevel: ({ level }: { level: string }) => (
    <div data-testid="roast-level" data-level={level} />
  ),
}))

vi.mock('@/components/delete-resource-button', () => ({
  DeleteResourceButton: () => <button data-testid="delete-resource-button" />,
}))

const bean: Bean = {
  id: 'bean-1',
  name: 'Kenya AA',
  country: 'Kenya',
  region: 'Nyeri',
  farm: 'Kieni',
  process: 'Washed',
  variety: 'SL28',
  roast: 'Light',
  roaster: 'Glitch Coffee',
  userId: null,
  priceJpy: null,
  notes: 'Bright and citrusy',
  created: '2026-04-18T00:00:00.000Z',
  updated: '2026-04-18T00:00:00.000Z',
}

describe('BeanDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getBeanByIdMock.mockResolvedValue(bean)
    getBrewsByBeanIdMock.mockResolvedValue([])
  })

  it('renders the bean name as an h1', async () => {
    const page = await BeanDetailPage({ params: Promise.resolve({ id: 'bean-1' }) })
    render(page)
    expect(screen.getByRole('heading', { level: 1, name: 'Kenya AA' })).toBeDefined()
  })

  it('renders the roaster', async () => {
    const page = await BeanDetailPage({ params: Promise.resolve({ id: 'bean-1' }) })
    render(page)
    expect(screen.getByText('Glitch Coffee')).toBeDefined()
  })

  it('renders the country and region', async () => {
    const page = await BeanDetailPage({ params: Promise.resolve({ id: 'bean-1' }) })
    render(page)
    expect(screen.getByText('Nyeri')).toBeDefined()
    expect(screen.getByText('Kenya')).toBeDefined()
  })

  it('renders process and variety', async () => {
    const page = await BeanDetailPage({ params: Promise.resolve({ id: 'bean-1' }) })
    render(page)
    expect(screen.getByText('Washed')).toBeDefined()
    expect(screen.getByText('SL28')).toBeDefined()
  })

  it('renders a BrewCard for each related brew', async () => {
    const brews = [
      { id: 'b1' },
      { id: 'b2' },
    ]
    getBrewsByBeanIdMock.mockResolvedValue(brews as unknown as BrewWithBean[])

    const page = await BeanDetailPage({ params: Promise.resolve({ id: 'bean-1' }) })
    render(page)

    expect(screen.getAllByTestId('brew-card')).toHaveLength(2)
  })
})
