import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
// https://vitejs.dev/config/
export default defineConfig({
  // On Windows Git may check out public/blueprints as a text file instead of
  // a symlink. Copy the real blueprint directories and public assets explicitly.
  build: { copyPublicDir: false },
  plugins: [react(), tailwindcss(),
    viteStaticCopy({
			targets: [
				{
					src: ['public/*', '!public/blueprints'],
					dest: '.'
				},
				{
					src: '../blueprints/*',
					dest: 'blueprints' // raíz de dist (public root)
				}
				// meta.json is no longer copied from the repo root: it is
				// generated into app/public/meta.json by build-scripts/generate-meta.js
			]
		})

  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
