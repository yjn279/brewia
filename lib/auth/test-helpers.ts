/**
 * Test helpers for auth-related tests.
 * Provides a mock getCurrentUser factory compatible with vi.mock.
 */

export const TEST_USER = {
  id: 'test-user-id-1',
  email: 'test@brewia.app',
}

/**
 * Returns a vi.mock factory that injects a logged-in user.
 * Usage:
 *   vi.mock('@/lib/auth/get-current-user', mockAuthenticatedUser())
 */
export function mockAuthenticatedUser(user = TEST_USER) {
  return () => ({
    getCurrentUser: () => Promise.resolve(user),
    requireUser: () => Promise.resolve([user, null] as const),
  })
}

/**
 * Returns a vi.mock factory that simulates an unauthenticated request.
 */
export function mockUnauthenticatedUser() {
  return () => ({
    getCurrentUser: () => Promise.resolve(null),
    requireUser: () => {
      const { NextResponse } = require('next/server') as typeof import('next/server')
      return Promise.resolve([null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })] as const)
    },
  })
}
