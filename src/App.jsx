import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { TacticalSimulator } from './components/TacticalSimulator';
import { TennisSimulator } from './components/TennisSimulator';
import { SimulationHistory } from './components/SimulationHistory';
import { MirrorViewer } from './components/MirrorViewer';

export function App() {
  // Pantalla del proyector (duplicación de pantalla): /?viewer=CODIGO, sin login.
  const viewerCode = new URLSearchParams(window.location.search).get('viewer');

  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'bball', 'tennis', 'history'
  // Recuerda desde qué simulador se entró al historial, para volver al correcto con "Volver al Simulador"
  const [previousSimulatorView, setPreviousSimulatorView] = useState('bball');

  // Restaura la sesión al recargar. Se persisten token, email, rol y tipo de entidad
  // (si no, un Analista que refrescara dejaría de ver "Historial").
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedEmail = localStorage.getItem('email');
    const savedRole = localStorage.getItem('role');
    const savedEntityType = localStorage.getItem('entityType');
    if (savedToken && savedEmail) {
      setUser({
        email: savedEmail,
        token: savedToken,
        role: savedRole || null,
        entityType: savedEntityType || null
      });
      setCurrentView('bball');
    }
  }, []);

  const persistUser = (userData) => {
    localStorage.setItem('token', userData.token || '');
    localStorage.setItem('email', userData.email || '');
    localStorage.setItem('role', userData.role || '');
    localStorage.setItem('entityType', userData.entityType || '');
  };

  const handleLoginSuccess = (userData) => {
    persistUser(userData);
    setUser(userData);
    setCurrentView('bball');
  };

  const handleRegisterSuccess = (userData) => {
    persistUser(userData);
    setUser(userData);
    setCurrentView('bball');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('entityType');
    setUser(null);
    setCurrentView('login');
  };

  const handleViewHistory = () => {
    if (currentView === 'bball' || currentView === 'tennis') {
      setPreviousSimulatorView(currentView);
    }
    setCurrentView('history');
  };

  const handleBackToSimulator = () => {
    setCurrentView(previousSimulatorView);
  };

  if (viewerCode) {
    return <MirrorViewer roomCode={viewerCode} />;
  }

  return (
    <div className="ta-root">
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
