import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { TacticalSimulator } from './components/TacticalSimulator';
import { TennisSimulator } from './components/TennisSimulator';
import { SimulationHistory } from './components/SimulationHistory';

export function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'bball', 'tennis', 'history'
  // Recuerda desde qué simulador se entró al historial, para volver al correcto con "Volver al Simulador"
  const [previousSimulatorView, setPreviousSimulatorView] = useState('bball');

  // Verificar si ya existe un token en localStorage al recargar la página
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedEmail = localStorage.getItem('email');
    if (savedToken && savedEmail) {
      setUser({ email: savedEmail, token: savedToken });
      setCurrentView('bball');
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('bball');
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setCurrentView('bball');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser(null);
    setCurrentView('login');
  };

  // El Analista (o cualquier rol) pulsa "Ver Historial" desde cualquiera de los dos simuladores
  const handleViewHistory = () => {
    if (currentView === 'bball' || currentView === 'tennis') {
      setPreviousSimulatorView(currentView);
    }
    setCurrentView('history');
  };

  const handleBackToSimulator = () => {
    setCurrentView(previousSimulatorView);
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
      ) : currentView === 'history' ? (
        <SimulationHistory
          user={user}
          onLogout={handleLogout}
          onBackToSimulator={handleBackToSimulator}
        />
      ) : currentView === 'tennis' ? (
        <TennisSimulator
          user={user}
          onLogout={handleLogout}
          onSwitchToBasketball={() => setCurrentView('bball')}
          onViewHistory={handleViewHistory}
        />
      ) : (
        <TacticalSimulator
          user={user}
          onLogout={handleLogout}
          onSwitchToTennis={() => setCurrentView('tennis')}
          onViewHistory={handleViewHistory}
        />
      )}
    </div>
  );
}

export default App;