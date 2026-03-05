import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        art: fileURLToPath(new URL('./project pages/art.html', import.meta.url)),
        biomaterial3DP: fileURLToPath(new URL('./project pages/biomaterial3DP.html', import.meta.url)),
        context: fileURLToPath(new URL('./project pages/context.html', import.meta.url)),
        geopolymer: fileURLToPath(new URL('./project pages/geopolymer.html', import.meta.url)),
        MN: fileURLToPath(new URL('./project pages/MN.html', import.meta.url)),
        tapestry: fileURLToPath(new URL('./project pages/tapestry.html', import.meta.url)),
        TMDlab: fileURLToPath(new URL('./project pages/TMDlab.html', import.meta.url))
      }
    }
  }
})
