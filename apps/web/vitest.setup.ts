import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Fără `globals: true`, RTL nu își face singur cleanup-ul între teste.
afterEach(cleanup);
