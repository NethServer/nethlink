import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

if (
  process.platform === 'linux' &&
  (process.env['XDG_SESSION_TYPE'] === 'wayland' ||
    !!process.env['WAYLAND_DISPLAY'])
) {
  const electronArgs: string[] = process.env['ELECTRON_CLI_ARGS']
    ? JSON.parse(process.env['ELECTRON_CLI_ARGS'])
    : []
  if (!electronArgs.some((arg) => arg.startsWith('--ozone-platform'))) {
    process.env['ELECTRON_CLI_ARGS'] = JSON.stringify([
      '--ozone-platform=x11',
      ...electronArgs,
    ])
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@/lib': resolve('src/main/lib'),
        '@/classes': resolve('src/main/classes'),
        '@shared': resolve('src/shared'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
      },
    },
  },
  renderer: {
    assetsInclude: ['src/renderer/public/**/*'],
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
        '@/hooks': resolve('src/renderer/src/hooks'),
        '@/assets': resolve('src/renderer/src/assets'),
        '@/pages': resolve('src/renderer/src/pages'),
        '@/components': resolve('src/renderer/src/components'),
        '@/utils': resolve('src/renderer/src/utils'),
      },
    },
    plugins: [react()],
  },
})
