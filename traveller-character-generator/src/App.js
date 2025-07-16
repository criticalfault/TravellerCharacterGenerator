import React from 'react';
import './App.css';
import { CharacterProvider } from './context/CharacterContext';
import Dashboard from './components/dashboard';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <CharacterProvider>
        <div className="App">
          <header className="App-header">
            <h1>Traveller Character Generator</h1>
            <p>Mongoose 2nd Edition</p>
          </header>
          <main>
            <Dashboard />
          </main>
        </div>
      </CharacterProvider>
    </ErrorBoundary>
  );
}

export default App;
