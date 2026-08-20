import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    port: 3000,
    proxy: {
      '/api/proxy': {
        target: 'https://api.xkiro.com/v1',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost:3000');
          const target = url.searchParams.get('target');
          if (target) {
            return target.replace(/^https?:\/\/[^/]+/, '');
          }
          return '/chat/completions';
        },
      },
    },
  },
})
