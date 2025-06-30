import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SummaryTab from './SummaryTab';
import { CharacterProvider } from '../../context/CharacterContext';

const renderSummaryTab = () => {
  return render(
    <CharacterProvider>
      <SummaryTab />
    </CharacterProvider>
  );
};

describe('SummaryTab', () => {
  test('renders character summary with default values', () => {
    renderSummaryTab();
    
    expect(screen.getByText('Character Summary')).toBeInTheDocument();
    expect(screen.getByText('Complete overview of your Traveller character.')).toBeInTheDocument();
    expect(screen.getByText('Unnamed Character')).toBeInTheDocument();
  });

  test('displays character attributes correctly', () => {
    renderSummaryTab();
    
    // Check that all attribute names are displayed
    expect(screen.getByText('STR')).toBeInTheDocument();
    expect(screen.getByText('DEX')).toBeInTheDocument();
    expect(screen.getByText('END')).toBeInTheDocument();
    expect(screen.getByText('INT')).toBeInTheDocument();
    expect(screen.getByText('EDU')).toBeInTheDocument();
    expect(screen.getByText('SOC')).toBeInTheDocument();
  });

  test('displays character statistics', () => {
    renderSummaryTab();
    
    expect(screen.getByText('Character Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Attribute Points:')).toBeInTheDocument();
    expect(screen.getByText('Average Attribute:')).toBeInTheDocument();
    expect(screen.getByText('Total Skill Levels:')).toBeInTheDocument();
    expect(screen.getByText('Years in Service:')).toBeInTheDocument();
    expect(screen.getByText('Benefit Rolls Earned:')).toBeInTheDocument();
    expect(screen.getByText('Current Wealth:')).toBeInTheDocument();
  });

  test('displays empty states correctly', () => {
    renderSummaryTab();
    
    expect(screen.getByText('No skills acquired.')).toBeInTheDocument();
    expect(screen.getByText('No career history.')).toBeInTheDocument();
    expect(screen.getByText('No relationships established.')).toBeInTheDocument();
  });

  test('displays action buttons', () => {
    renderSummaryTab();
    
    expect(screen.getByText('Export Character JSON')).toBeInTheDocument();
    expect(screen.getByText('Print Character Sheet')).toBeInTheDocument();
    expect(screen.getByText('Create New Character')).toBeInTheDocument();
  });

  test('displays character overview information', () => {
    renderSummaryTab();
    
    expect(screen.getByText('Species:')).toBeInTheDocument();
    expect(screen.getByText('Age:')).toBeInTheDocument();
    expect(screen.getByText('Total Terms:')).toBeInTheDocument();
    expect(screen.getByText('Highest Rank:')).toBeInTheDocument();
    expect(screen.getByText('Skills Known:')).toBeInTheDocument();
    expect(screen.getByText('Best Skill:')).toBeInTheDocument();
  });

  test('displays health information', () => {
    renderSummaryTab();
    
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Physical Damage:')).toBeInTheDocument();
  });

  test('displays possessions section', () => {
    renderSummaryTab();
    
    expect(screen.getByText('Possessions')).toBeInTheDocument();
    expect(screen.getByText('Credits:')).toBeInTheDocument();
  });

  test('displays relationships section', () => {
    renderSummaryTab();
    
    expect(screen.getByText('Relationships')).toBeInTheDocument();
  });

  test('displays career history section', () => {
    renderSummaryTab();
    
    expect(screen.getByText('Career History')).toBeInTheDocument();
  });

  test('displays skills section', () => {
    renderSummaryTab();
    
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });
});