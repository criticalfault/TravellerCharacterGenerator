import React from 'react';
import './App.css';
import { CharacterProvider } from './context/CharacterContext';
import Dashboard from './components/dashboard';

function App() {
  return (
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
  );
}

export default App;
