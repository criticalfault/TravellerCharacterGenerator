import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CareerTermsTab from './CareerTermsTab';
import { CharacterProvider } from '../../context/CharacterContext';

describe('CareerTermsTab', () => {
  test('renders no career message when no active career', () => {
    render(
      <CharacterProvider>
        <CareerTermsTab />
      </CharacterProvider>
    );

    expect(screen.getByText('No active career. Please select a career first in the Career Selection tab.')).toBeInTheDocument();
  });

  test('renders component without crashing', () => {
    render(
      <CharacterProvider>
        <CareerTermsTab />
      </CharacterProvider>
    );

    expect(screen.getByText('Career Terms')).toBeInTheDocument();
    expect(screen.getByText('Progress through your career terms, facing survival challenges, events, and advancement opportunities.')).toBeInTheDocument();
  });

  test('shows career history section', () => {
    render(
      <CharacterProvider>
        <CareerTermsTab />
      </CharacterProvider>
    );

    expect(screen.getByText('Career History')).toBeInTheDocument();
    expect(screen.getByText('No career history yet.')).toBeInTheDocument();
  });
});