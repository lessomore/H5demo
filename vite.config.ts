import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function offlineHtmlPlugin(): Plugin {
  return {
    name: 'offline-html',
    enforce: 'post',
    generateBundle(_, bundle) {
      const htmlEntry = Object.entries(bundle).find(([fileName, item]) => {
        return item.type === 'asset' && fileName.endsWith('.html')
      })

      if (!htmlEntry) return

      const [htmlFileName, htmlAsset] = htmlEntry
      if (htmlAsset.type !== 'asset') return

      let html = String(htmlAsset.source)
      html = html.replace(/<link\b[^>]*rel=["'](?:alternate\s+)?icon["'][^>]*>/g, '')
      html = html.replace(
        /<script\b([^>]*?)type=["']module["']([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/g,
        '<script defer src="$3"></script>',
      )
      htmlAsset.source = html
    },
  }
}

export default defineConfig(({ mode }) => {
  const offline = mode === 'offline'

  return {
    plugins: [vue(), ...(offline ? [offlineHtmlPlugin()] : [])],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/variables" as *;\n`,
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
    // 移动端H5适配：以750px设计稿为基准
    base: './',
    build: {
      outDir: offline ? 'dist-offline' : 'dist',
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      modulePreload: !offline,
      rollupOptions: offline
        ? {
            output: {
              format: 'iife',
              inlineDynamicImports: true,
              entryFileNames: 'assets/[name].js',
              assetFileNames: 'assets/[name]-[hash][extname]',
            },
          }
        : undefined,
    },
  }
})
