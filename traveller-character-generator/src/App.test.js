import { render, screen } from '@testing-library/react';
import App from './App';

test('renders traveller character generator', () => {
  render(<App />);
  const headerElement = screen.getByText(/Traveller Character Generator/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders character attributes section', () => {
  render(<App />);
  const attributesElement = screen.getByText(/Character Attributes/i);
  expect(attributesElement).toBeInTheDocument();
});
