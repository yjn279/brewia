/**
 * UserMenu コンポーネントテスト
 *
 * - トリガー（イニシャルボタン）が表示される
 * - サインアウトのフォームが存在する（Server Action 経由）
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { UserMenu } from '@/components/user-menu'

// DropdownMenu の Radix UI ポータルが jsdom で動作しないためモックする
vi.mock('@/components/ui/dropdown-menu', async () => {
  const React = await import('react')

  function DropdownMenu({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }

  function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
    if (asChild) {
      return <>{children}</>
    }
    return <div>{children}</div>
  }

  function DropdownMenuContent({ children }: { children: React.ReactNode }) {
    return <div role="menu">{children}</div>
  }

  function DropdownMenuItem({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
    if (asChild) {
      return <>{children}</>
    }
    return <div role="menuitem">{children}</div>
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

const signOutMock = vi.fn().mockResolvedValue(undefined)

describe('UserMenu', () => {
  it('メールの先頭文字をイニシャルとして表示するボタンがある', () => {
    render(
      <UserMenu email="test@example.com" name={null} signOutAction={signOutMock} />
    )
    const trigger = screen.getByRole('button', { name: 'User menu' })
    expect(trigger).toBeDefined()
    expect(trigger.textContent).toBe('T')
  })

  it('name がある場合は name の先頭文字をイニシャルとして表示する', () => {
    render(
      <UserMenu email="test@example.com" name="Alice" signOutAction={signOutMock} />
    )
    const trigger = screen.getByRole('button', { name: 'User menu' })
    expect(trigger.textContent).toBe('A')
  })

  it('メールアドレスがメニュー内に表示される', () => {
    render(
      <UserMenu email="test@example.com" name={null} signOutAction={signOutMock} />
    )
    expect(screen.getByText('test@example.com')).toBeDefined()
  })

  it('Sign out ボタンが存在する', () => {
    render(
      <UserMenu email="test@example.com" name={null} signOutAction={signOutMock} />
    )
    const signOutBtn = screen.getByRole('button', { name: /sign out/i })
    expect(signOutBtn).toBeDefined()
  })
})
