import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Earthly application shell', () => {
  render(<App />);
  expect(screen.getByText('Earthly')).toBeInTheDocument();
  expect(screen.getByText('Replay')).toBeInTheDocument();
});
