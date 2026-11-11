import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves this project from the repository path.
  base: '/Warehouse-Barcode-Studio/',
  plugins: [react()],
  build: {
    // Tracked static output is a deployment fallback when GitHub Actions cannot run.
    outDir: 'docs',
  },
})
