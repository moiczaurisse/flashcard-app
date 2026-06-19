import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

// Injecté automatiquement par vite-plugin-pwa (strategy: injectManifest).
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

self.skipWaiting()
self.addEventListener('activate', () => self.clients.claim())

// Ouvre (ou met au premier plan) la page ciblée par la notification quotidienne.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = allClients.find((c) => c.url.includes(targetUrl))
      if (existing) {
        existing.focus()
        return
      }
      await self.clients.openWindow(targetUrl)
    })()
  )
})
