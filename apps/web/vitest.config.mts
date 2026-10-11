import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Componente sincrone, hook-uri și utilitare. Componentele async (RSC) și fluxurile întregi
// se testează în e2e/ cu Playwright: Vitest nu randează async Server Components.
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
