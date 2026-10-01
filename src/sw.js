import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

// Injecté automatiquement par vite-plugin-pwa (strategy: injectManifest).
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

self.skipWaiting()
self.addEventListener('activate', () => self.clients.claim())
