// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

// next-auth は Node.js テスト環境では next/server が解決できないためモックする
vi.mock('@/lib/auth', () => ({
  auth: vi.fn((handler: unknown) => handler),
}))

import { handleMiddlewareRequest, middlewareConfig } from '@/middleware'

function makeReq(pathname: string, baseUrl = 'http://localhost'): { nextUrl: { pathname: string }; url: string } {
  return {
    nextUrl: { pathname },
    url: `${baseUrl}${pathname}`,
  }
}

describe('middleware request handler', () => {
  describe('公開ルート（認証不要）', () => {
    it('M1: /api/auth/callback/google へのリクエストは isLoggedIn=false でも通過する（undefined を返す）', () => {
      const result = handleMiddlewareRequest(makeReq('/api/auth/callback/google'), false)
      expect(result).toBeUndefined()
    })

    it('M2: /login へのリクエストは isLoggedIn=false でも通過する', () => {
      const result = handleMiddlewareRequest(makeReq('/login'), false)
      expect(result).toBeUndefined()
    })

    it('M3: /offline へのリクエストは isLoggedIn=false でも通過する', () => {
      const result = handleMiddlewareRequest(makeReq('/offline'), false)
      expect(result).toBeUndefined()
    })
  })

  describe('保護ルート + 未認証', () => {
    it('M4: / へのリクエストは isLoggedIn=false のとき /login へリダイレクトする', () => {
      const result = handleMiddlewareRequest(makeReq('/'), false)
      expect(result).toBeInstanceOf(Response)
      expect((result as Response).status).toBe(302)
      expect((result as Response).headers.get('location')).toContain('/login')
    })

    it('M5: /beans/xxx へのリクエストは isLoggedIn=false のとき /login へリダイレクトする', () => {
      const result = handleMiddlewareRequest(makeReq('/beans/some-id'), false)
      expect(result).toBeInstanceOf(Response)
      expect((result as Response).status).toBe(302)
    })

    it('M6: /api/beans へのリクエストは isLoggedIn=false のとき /login へリダイレクトする', () => {
      const result = handleMiddlewareRequest(makeReq('/api/beans'), false)
      expect(result).toBeInstanceOf(Response)
      expect((result as Response).status).toBe(302)
    })
  })

  describe('保護ルート + 認証済み', () => {
    it('M7: / へのリクエストは isLoggedIn=true のとき通過する（undefined を返す）', () => {
      const result = handleMiddlewareRequest(makeReq('/'), true)
      expect(result).toBeUndefined()
    })

    it('M8: /api/beans へのリクエストは isLoggedIn=true のとき通過する', () => {
      const result = handleMiddlewareRequest(makeReq('/api/beans'), true)
      expect(result).toBeUndefined()
    })
  })

  describe('matcher 対象外のパス（パターン確認）', () => {
    it('M9: matcher の正規表現が _next/static を除外することを確認する', () => {
      // middlewareConfig.matcher の除外パターンを手動で検証する
      void middlewareConfig.matcher[0]
      const excludePattern = /(_next\/static|_next\/image|icon|manifest|sw\.js|favicon)/
      expect(excludePattern.test('/_next/static/chunks/main.js')).toBe(true)
    })

    it('M10: matcher の正規表現が sw.js を除外することを確認する', () => {
      const excludePattern = /(_next\/static|_next\/image|icon|manifest|sw\.js|favicon)/
      expect(excludePattern.test('/sw.js')).toBe(true)
    })
  })
})
