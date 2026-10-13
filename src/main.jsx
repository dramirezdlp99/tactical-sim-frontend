import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initPwa } from './pwa/registerSW';

// Service Worker + instalacion: solo en produccion (en desarrollo confunde al cachear).
initPwa({ enabled: import.meta.env.PROD });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
