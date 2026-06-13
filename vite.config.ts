import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function preventServerLeakPlugin() {
  let isSsr = false
  return {
    name: 'prevent-server-leak',
    configResolved(config: any) {
      isSsr = !!config.build?.ssr
    },
    generateBundle(_options: any, bundle: any) {
      if (isSsr) return

      for (const file of Object.values(bundle) as any[]) {
        if (file.type === 'chunk') {
          for (const moduleId of file.moduleIds || []) {
            const normalized = moduleId.replace(/\\/g, '/')
            if (
              normalized.includes('node_modules/@libsql/client') ||
              normalized.includes('node_modules/drizzle-orm') ||
              normalized.includes('/src/db/') ||
              normalized.includes('-db.ts') ||
              normalized.startsWith('node:') ||
              normalized.includes('node_modules/better-sqlite3')
            ) {
              throw new Error(
                `\n[Server Leak Protection] Server-only module "${moduleId}" was bundled into client chunk "${file.fileName}"!\n` +
                `This is not allowed as it will crash the browser. Please move database/server-only operations to a separate file (e.g. ending with -db.ts) and ensure it is not imported by client files.`
              )
            }
          }
        }
      }
    },
  }
}

function clientAliasPlugin() {
  return {
    name: 'client-alias',
    enforce: 'pre' as const,
    resolveId(source: string, importer: any, options: any) {
      if (options?.ssr) {
        return null
      }
      if (
        source === 'drizzle-orm' ||
        source.startsWith('drizzle-orm/') ||
        source === '@libsql/client' ||
        source.startsWith('@libsql/client/') ||
        source === 'better-sqlite3' ||
        source.startsWith('better-sqlite3/')
      ) {
        return resolve(__dirname, './src/lib/empty.ts')
      }
      return null
    }
  }
}

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
    },
  },
  plugins: [
    tailwindcss(),
    clientAliasPlugin(),
    tanstackStart({
      srcDirectory: 'src',
      router: {
        routesDirectory: 'routes',
        generatedRouteTree: 'routeTree.gen.ts',
      },
    }),
    viteReact(),
    preventServerLeakPlugin(),
  ],
})

