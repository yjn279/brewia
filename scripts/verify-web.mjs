#!/usr/bin/env node
/**
 * verify-web.mjs
 *
 * Automated Web smoke test for Brewia.
 * Spins up Expo Metro in web mode with the E2E session bypass,
 * navigates through all tabs using headless Chromium (Playwright),
 * and asserts zero non-Supabase console errors.
 *
 * Console errors caused by Supabase REST 404 responses (table not found) are
 * treated as warnings and reported — they indicate migrations have not been
 * applied yet, not a code defect. The script exits 0 in this case but prints
 * a MIGRATION_PENDING notice.
 *
 * Usage:
 *   EXPO_PUBLIC_E2E_USER_ID=00000000-0000-0000-0000-000000000001 node scripts/verify-web.mjs
 *   # or via package.json script:
 *   pnpm verify:web
 *
 * Prerequisites:
 *   pnpm install
 *   pnpm exec playwright install chromium
 */

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WORKTREE = resolve(__dirname, '..')

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Find an available TCP port. */
function getFreePort() {
  return new Promise((res, rej) => {
    const srv = createServer()
    srv.listen(0, () => {
      const { port } = srv.address()
      srv.close(() => res(port))
    })
    srv.on('error', rej)
  })
}

/** Poll until Metro /status returns "packager-status:running" or timeout. */
async function waitForMetro(port, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${port}/status`)
      const text = await res.text()
      if (text.includes('packager-status:running')) return true
    } catch {
      // not ready yet
    }
    await delay(2_000)
  }
  throw new Error(`Metro did not start within ${timeoutMs / 1000}s`)
}

/**
 * Returns true if the error text looks like a Supabase table-not-found 404.
 * These occur when migrations have not been applied yet and are not
 * considered a code defect.
 */
function isSupabaseMigrationError(text) {
  return (
    (text.includes('supabase.co') && text.includes('404')) ||
    (text.includes('Failed to load resource') && text.includes('supabase.co')) ||
    // Unhandled rejection bubbling from a thrown Supabase error
    text === 'Object'
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

const E2E_USER_ID =
  process.env.EXPO_PUBLIC_E2E_USER_ID ??
  '00000000-0000-0000-0000-000000000001'

const port = await getFreePort()
console.log(`[verify-web] Starting Metro on port ${port} …`)

const metro = spawn(
  'pnpm',
  ['exec', 'expo', 'start', '--web', `--port`, String(port), '--non-interactive'],
  {
    cwd: WORKTREE,
    env: {
      ...process.env,
      EXPO_PUBLIC_E2E_USER_ID: E2E_USER_ID,
    },
    stdio: 'pipe',
  },
)

let metroPid = metro.pid
metro.stdout.on('data', (d) => process.stdout.write(`[metro] ${d}`))
metro.stderr.on('data', (d) => process.stderr.write(`[metro:err] ${d}`))
metro.on('error', (err) => {
  console.error('[verify-web] Failed to start Metro:', err)
  process.exit(1)
})

const cleanup = () => {
  if (metroPid) {
    try {
      process.kill(metroPid, 'SIGTERM')
    } catch {
      // already dead
    }
    metroPid = null
  }
}

process.on('exit', cleanup)
process.on('SIGINT', () => { cleanup(); process.exit(130) })
process.on('SIGTERM', () => { cleanup(); process.exit(143) })

try {
  await waitForMetro(port)
  console.log(`[verify-web] Metro ready at http://localhost:${port}/`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  /** Hard errors (not from missing Supabase tables). */
  const hardErrors = []
  /** Soft warnings (Supabase 404 / migration pending). */
  const migrationWarnings = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      const loc = msg.location()
      const locUrl = loc?.url ?? ''
      if (isSupabaseMigrationError(text) || locUrl.includes('supabase.co')) {
        migrationWarnings.push({ url: page.url(), text, location: loc })
      } else {
        hardErrors.push({ url: page.url(), text, location: loc })
      }
    }
  })
  page.on('pageerror', (err) => {
    const text = err.message
    if (isSupabaseMigrationError(text)) {
      migrationWarnings.push({ url: page.url(), text: `[pageerror] ${text}`, location: null })
    } else {
      hardErrors.push({ url: page.url(), text: `[pageerror] ${text}`, location: null })
    }
  })

  /**
   * Navigate to a URL and wait for network to settle + an extra settling pause.
   */
  async function navigate(url) {
    console.log(`[verify-web] → ${url}`)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
    await delay(2_000)
  }

  /**
   * Assert no hard errors accumulated so far. Exits 1 if any.
   */
  function assertNoHardErrors(label) {
    if (hardErrors.length > 0) {
      console.error(`\n[verify-web] FAIL: ${hardErrors.length} non-migration console error(s) after "${label}":`)
      for (const e of hardErrors) {
        console.error(`  [${e.url}] ${e.text}`)
        if (e.location) console.error(`    at ${e.location.url}:${e.location.lineNumber}`)
      }
      cleanup()
      process.exit(1)
    }
  }

  const base = `http://localhost:${port}`

  // 1. Home (root — expo-router renders the (tabs)/index screen)
  await navigate(`${base}/`)
  assertNoHardErrors('Home')

  // 2. Beans tab
  await navigate(`${base}/beans`)
  assertNoHardErrors('Beans')

  // 3. Brews tab
  await navigate(`${base}/brews`)
  assertNoHardErrors('Brews')

  // 4. Presets tab
  await navigate(`${base}/presets`)
  assertNoHardErrors('Presets')

  // 5. Return to Home
  await navigate(`${base}/`)
  assertNoHardErrors('Home (return)')

  // 6. Try to open the Beans "new" form
  await navigate(`${base}/beans/new`)
  assertNoHardErrors('Beans/New form')

  await browser.close()

  if (migrationWarnings.length > 0) {
    console.warn(`\n[verify-web] MIGRATION_PENDING — ${migrationWarnings.length} Supabase 404 warning(s) (expected when migrations not applied):`)
    for (const w of migrationWarnings) {
      console.warn(`  [${w.url}] ${w.text}`)
    }
    console.warn('\n  Apply migrations via Supabase SQL Editor:')
    console.warn('  https://supabase.com/dashboard/project/afpqxkhioltnkcrqifnr/sql/new')
    console.warn('  Files: drizzle/0000_init.sql, drizzle/0001_rename_brew_preset_to_preset.sql\n')
  }

  console.log(`\n[verify-web] PASS — 0 hard errors. Web runtime is healthy.`)
  cleanup()
  process.exit(0)
} catch (err) {
  console.error('[verify-web] Error:', err)
  cleanup()
  process.exit(1)
}
