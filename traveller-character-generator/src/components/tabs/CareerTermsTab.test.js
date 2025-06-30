import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CareerTermsTab from './CareerTermsTab';
import { CharacterProvider } from '../../context/CharacterContext';

describe('CareerTermsTab', () => {

  test('renders component without crashing', () => {
    render(
      <CharacterProvider>
        <CareerTermsTab />
      </CharacterProvider>
    );

    expect(screen.getByText('Career Terms')).toBeInTheDocument();
  });

  test('shows no career message when no active career', () => {
    render(
      <CharacterProvider>
        <CareerTermsTab />
      </CharacterProvider>
    );

    expect(screen.getByText('No active career. Please select a career first in the Career Selection tab.')).toBeInTheDocument();
  });
});