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

  // Verificar si ya existe un token en localStorage al recargar la página.
  // CAMBIO CLAVE: antes solo se guardaban/restauraban 'token' y 'email',
  // asi que el rol (y el tipo de entidad) se perdian en cada recarga de
  // pagina -- un Analista que refrescara el navegador dejaba de ver
  // "Ver Historial" aunque su sesion siguiera siendo valida. Ahora se
  // persisten y restauran tambien 'role' y 'entityType'.
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