// NOTE: SW のフェッチ戦略や precache 対象を変更したら CACHE_NAME をバンプすること。
// バンプしないと既存クライアントで古いキャッシュが残り続ける。
const CACHE_NAME = 'brewia-shell-v1'
const PRECACHE_URLS = ['/offline', '/icon-192.png', '/icon-512.png']

// Install: precache shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  )
})

// Activate: clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

// Fetch: routing strategy
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Ignore API calls
  if (url.pathname.startsWith('/api/')) return

  // Cache First for Next.js static assets
  if (url.pathname.includes('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached

        const response = await fetch(event.request)
        if (response && response.ok) {
          cache.put(event.request, response.clone())
        }
        return response
      }),
    )
    return
  }

  // Network First for everything else
  event.respondWith(
    fetch(event.request).catch(async (err) => {
      if (event.request.mode === 'navigate') {
        const cache = await caches.open(CACHE_NAME)
        const offline = await cache.match('/offline')
        if (offline) return offline
      }
      throw err
    }),
  )
})
