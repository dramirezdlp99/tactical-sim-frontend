import React, { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { TacticalSimulator } from './components/TacticalSimulator';

export function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="w-full min-h-screen">
      {!user ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <TacticalSimulator user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;