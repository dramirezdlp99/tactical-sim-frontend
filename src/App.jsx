import React, { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { TacticalSimulator } from './components/TacticalSimulator';
import { TennisSimulator } from './components/TennisSimulator';

export function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'bball', 'tennis'

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('bball');
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setCurrentView('bball');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  return (
    <div className="w-full min-h-screen">
      {!user ? (
        currentView === 'login' ? (
          <AuthScreen
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        ) : (
          <RegisterScreen
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )
      ) : currentView === 'tennis' ? (
        <TennisSimulator
          user={user}
          onLogout={handleLogout}
          onSwitchToBasketball={() => setCurrentView('bball')}
        />
      ) : (
        <TacticalSimulator
          user={user}
          onLogout={handleLogout}
          onSwitchToTennis={() => setCurrentView('tennis')}
        />
      )}
    </div>
  );
}

export default App;