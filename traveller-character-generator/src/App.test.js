import { render, screen } from '@testing-library/react';
import App from './App';

test('renders traveller character generator', () => {
  render(<App />);
  const headerElement = screen.getByText(/Traveller Character Generator/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders species selection section', () => {
  render(<App />);
  const speciesElement = screen.getByText(/Species Selection/i);
  expect(speciesElement).toBeInTheDocument();
});
