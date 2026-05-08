// jsdom 環境（デフォルト）

import { beforeEach, describe, expect, it, vi } from 'vitest'

// next/font/google は Vitest + jsdom 環境では動作しないためモックする
vi.mock('next/font/google', () => ({
  DM_Sans: () => ({ className: 'dm-sans', variable: '--font-sans' }),
  DM_Mono: () => ({ className: 'dm-mono', variable: '--font-mono' }),
}))

// globals.css は Vitest 環境では不要なためモックする
vi.mock('./globals.css', () => ({}))

const { requireUserMock, getBeansMock, getBrewsMock } = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  getBeansMock: vi.fn(),
  getBrewsMock: vi.fn(),
}))

vi.mock('@/lib/auth/require-user', () => ({
  requireUser: requireUserMock,
}))

vi.mock('@/app/beans/service', () => ({
  beansService: {
    getBeans: getBeansMock,
  },
}))

vi.mock('@/app/brews/service', () => ({
  brewsService: {
    getBrews: getBrewsMock,
  },
}))

// lucide-react をモック（Server Component のレンダリングを単純化）
vi.mock('lucide-react', () => ({
  Plus: () => null,
  Coffee: () => null,
  Flame: () => null,
  BookMarked: () => null,
  LogOut: () => null,
  User: () => null,
}))

// auth アクションをモック
vi.mock('@/lib/auth/actions', () => ({
  signOutAction: vi.fn(),
}))

// UserMenu をモック
vi.mock('@/components/user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}))

// next/link をモック
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

// UI コンポーネントをモック
vi.mock('@/components/stats-card', () => ({
  StatsCard: () => <div data-testid="stats-card" />,
}))

vi.mock('@/components/bean-card', () => ({
  BeanCard: () => <div data-testid="bean-card" />,
}))

vi.mock('@/components/greeting', () => ({
  Greeting: () => <div data-testid="greeting" />,
}))

vi.mock('@/components/ui/empty', () => ({
  Empty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EmptyContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EmptyDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EmptyHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EmptyMedia: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EmptyTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import HomePage from '@/app/page'

describe('HomePage (Server Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getBeansMock.mockResolvedValue([])
    getBrewsMock.mockResolvedValue([])
  })

  it('HP1: requireUser が呼ばれる', async () => {
    requireUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })

    await HomePage()

    expect(requireUserMock).toHaveBeenCalledTimes(1)
  })

  it('HP2: 未認証のとき requireUser が redirect を発動し、ページ本体がレンダリングされない', async () => {
    requireUserMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    try {
      await HomePage()
    } catch {
      // redirect() が throw するため catch する
    }

    expect(getBeansMock).not.toHaveBeenCalled()
  })

  it('HP3: 認証済みのとき beansService.getBeans(userId) が正しい userId で呼ばれる', async () => {
    requireUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
    })
    getBeansMock.mockResolvedValue([])
    getBrewsMock.mockResolvedValue([])

    await HomePage()

    expect(getBeansMock).toHaveBeenCalledWith('user-1')
  })
})
