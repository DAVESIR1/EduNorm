import { defineConfig } from 'vite'
// Force Restart: 2026-02-16 20:20
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            // Whether to polyfill `node:` protocol imports.
            protocolImports: true,
        }),
    ],
    server: {
        port: 5173,
        open: true
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
                    'vendor-utils': ['jspdf', 'html2canvas', 'xlsx', 'idb'],
                    'vendor-mega': ['megajs']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    }
})
