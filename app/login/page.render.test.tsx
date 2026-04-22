// jsdom 環境（デフォルト）

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authMock, redirectMock, signInMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
  signInMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: authMock,
  signIn: signInMock,
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

// next/font/google はレイアウトと同様にモックする
vi.mock('next/font/google', () => ({
  DM_Sans: () => ({ className: 'dm-sans', variable: '--font-sans' }),
  DM_Mono: () => ({ className: 'dm-mono', variable: '--font-mono' }),
}))

import LoginPage from '@/app/login/page'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('LP1: 未認証状態でレンダリングしたとき Google ログインボタンが存在する', async () => {
    authMock.mockResolvedValue(null)

    render(await LoginPage())

    expect(
      screen.getByRole('button', { name: /google/i }) ||
      screen.getByText(/google/i)
    ).toBeTruthy()
  })

  it('LP2: 未認証状態でレンダリングしたとき Email 入力フィールドが存在する', async () => {
    authMock.mockResolvedValue(null)

    render(await LoginPage())

    expect(
      screen.getByRole('textbox') ||
      screen.getByPlaceholderText(/email/i)
    ).toBeTruthy()
  })

  it('LP3: 認証済み状態でレンダリングしたとき redirect("/") が呼ばれる', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1', email: 'a@example.com' } })

    await LoginPage()

    expect(redirectMock).toHaveBeenCalledWith('/')
  })
})
