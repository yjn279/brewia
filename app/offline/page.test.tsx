import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import OfflinePage from './page'

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

describe('OfflinePage', () => {
  it('レンダリングが成功する', () => {
    expect(() => render(<OfflinePage />)).not.toThrow()
  })

  it('オフラインであることを示すテキストが表示される（"offline" または "オフライン" を含む）', () => {
    render(<OfflinePage />)

    // 大文字小文字を問わず "offline" または日本語の "オフライン" が含まれる要素を検索
    const offlineElements = screen.queryAllByText(/offline|オフライン/i)
    expect(offlineElements.length).toBeGreaterThan(0)
  })

  it('ホームへ戻る <a href="/"> が存在する', () => {
    render(<OfflinePage />)

    const homeLinks = screen.getAllByRole('link')
    const homeLink = homeLinks.find(
      (link) => link.getAttribute('href') === '/',
    )
    expect(homeLink).toBeDefined()
  })
})
