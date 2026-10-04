import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * Bundelt het ChatGPT-widget tot één ES-module zonder externe imports, zodat `lib/mcp/widget.ts`
 * hem inline in de `ui://`-resource kan zetten. Geen CSS-bestand: de stijl staat in de component.
 */
export default defineConfig({
  root: resolve(__dirname),
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    minify: true,
    target: 'es2020',
    lib: { entry: resolve(__dirname, 'exercise/main.tsx'), formats: ['es'], fileName: () => 'exercise.js' },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
