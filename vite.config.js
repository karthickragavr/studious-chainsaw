import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// Public, account-free build of the single-player games ("the arcade").
// Fully static: no Supabase, no game server, no Sentry. src/ is a verbatim
// copy of the files the arcade uses from play-mangatha; the two hooks that
// write to Supabase there (and are not copied here) are
// swapped at bundle time (bet history → localStorage, achievements → no-op)
// so the games stay untouched.
const local = (path) => fileURLToPath(new URL(`./arcade/${path}.js`, import.meta.url))

export default defineConfig({
    root: fileURLToPath(new URL('./arcade', import.meta.url)),
    // Relative base + HashRouter: works at /arcade/ on the main server, on
    // a Render static site, or any static host, with no rewrite rules.
    base: './',
    publicDir: false,
    plugins: [react()],
    resolve: {
        alias: [
            { find: /^\.\.\/hooks\/useBetHistory$/, replacement: local('local/useBetHistory') },
            { find: /^\.\.\/hooks\/useAchievements$/, replacement: local('stubs/useAchievements') },
        ],
    },
    css: {
        postcss: {
            plugins: [tailwindcss({ config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)) }), autoprefixer()],
        },
    },
    build: {
        outDir: fileURLToPath(new URL('./dist', import.meta.url)),
        emptyOutDir: true,
    },
    server: {
        port: 5175,
    },
})
