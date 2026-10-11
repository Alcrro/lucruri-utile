import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Home from './page';

test('pagina principală afișează numele magazinului', () => {
  render(<Home />);
  expect(screen.getByRole('heading', { level: 1, name: 'lucruri-utile.ro' })).toBeInTheDocument();
});
