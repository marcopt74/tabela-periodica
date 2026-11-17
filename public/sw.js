const CACHE = 'elementar-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      try {
        const fresh = await fetch(request)
        if (fresh.ok) await cache.put(request, fresh.clone())
        return fresh
      } catch {
        const cached = await cache.match(request)
        if (cached) return cached
        if (request.mode === 'navigate') {
          const scope = self.registration.scope
          return (await cache.match(scope)) || (await cache.match(new URL('index.html', scope))) || Response.error()
        }
        return Response.error()
      }
    })(),
  )
})
