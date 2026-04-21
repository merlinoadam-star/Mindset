import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Stamp the service worker with a unique build id per deploy. Prefer
// the Vercel-provided commit SHA (stable per deploy); fall back to a
// timestamp for local builds. Without this, `public/sw.js` is byte-
// identical across deploys and browsers keep the previous SW + cached
// JS forever, which is exactly how the streak-sync bug persisted for
// users even after the fix shipped.
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  `local-${Date.now()}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sw-version-injector',
      apply: 'build',
      closeBundle() {
        const swPath = path.resolve('dist', 'sw.js')
        if (!fs.existsSync(swPath)) return
        const original = fs.readFileSync(swPath, 'utf8')
        const updated = original.replace(/__BUILD_ID__/g, BUILD_ID)
        if (updated !== original) {
          fs.writeFileSync(swPath, updated)
          // eslint-disable-next-line no-console
          console.log(`[sw-version-injector] stamped sw.js with ${BUILD_ID}`)
        }
      },
    },
  ],
  build: {
    chunkSizeWarningLimit: 300,
  },
})
