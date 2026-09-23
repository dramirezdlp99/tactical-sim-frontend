import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from './apiConfig';

export const AuthScreen = ({ onLoginSuccess, onSwitchToRegister }) => {
  // CAMBIO CLAVE: el login ahora es de dos pasos reales.
  // 'CREDENTIALS' -> POST /login (valida email+password, emite tempToken)
  // 'OTP'         -> POST /verify-2fa (valida el código, entrega el JWT)
  const [step, setStep] = useState('CREDENTIALS');

  const [role, setRole] = useState('coach');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [tempToken, setTempToken] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (step !== 'OTP') return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTimer = () => {
    const mins = String(Math.floor(timer / 60)).padStart(2, '0');
    const secs = String(timer % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Paso 1: valida email+password contra el backend y pide el código
  const requestTwoFactorCode = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.data?.tempToken) {
        setTempToken(json.data.tempToken);
        setTimer(json.data.expiresInSeconds || 300);
        setOtp(['', '', '', '', '', '']);
        setStep('OTP');
        setTimeout(() => document.getElementById('otp-0')?.focus(), 50);
      } else {
        setErrorMessage(json?.message || 'Correo o contraseña incorrectos.');
      }
    } catch (err) {
      setErrorMessage('No se pudo conectar con el servidor (puerto 9096). Verifica que el backend esté encendido.');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    await requestTwoFactorCode();
  };

  // Paso 2: valida el código de 6 dígitos y, si es correcto, recibe el JWT real
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');

    if (code.length !== 6) {
      setErrorMessage('Ingresa los 6 dígitos del código.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code })
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.data?.accessToken) {
        const token = json.data.accessToken;
        localStorage.setItem('token', token);
        localStorage.setItem('email', email);

        onLoginSuccess({
          email,
          token,
          role: json.data.role || (role === 'coach' ? 'ROLE_COACH' : 'ROLE_ANALYST'),
          entityType: json.data.entityType || null
        });
      } else {
        // Código incorrecto o expirado: NO hay fallback de token falso.
        setErrorMessage(json?.message || 'Código inválido.');
      }
    } catch (err) {
      setErrorMessage('No se pudo conectar con el servidor (puerto 9096).');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('CREDENTIALS');
    setErrorMessage('');
    setTempToken(null);
  };

  const handleResendCode = async () => {
    await requestTwoFactorCode();
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-xl p-8 border border-surface-container">

        {/* Banner de Seguridad */}
        <div className="mb-6 inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-surface-container-low shadow-sm w-full justify-between">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="text-xs font-semibold uppercase tracking-wider">Acceso Restringido • Cuerpo Técnico</span>
          </div>
          <span className="text-xs text-on-surface-variant font-mono">TLS 1.3 • Zero-Trust</span>
        </div>

        {/* Encabezado */}
        <div className="flex flex-col items-center text-center pb-6">
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            {step === 'CREDENTIALS' ? 'Iniciar Sesión Táctica' : 'Verificación de Dos Pasos'}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {step === 'CREDENTIALS'
              ? 'Plataforma Predictiva de Alto Rendimiento Deportivo'
              : `Ingresa el código de 6 dígitos enviado a ${email}`}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 text-xs rounded-lg font-semibold">
            {errorMessage}
          </div>
        )}

        {step === 'CREDENTIALS' && (
          <>
            {/* Selector de Rol */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-2">Perfil Operativo</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-low rounded-lg">
                <button
                  type="button"
                  onClick={() => setRole('coach')}
                  className={`flex items-start gap-2.5 p-2.5 rounded-md text-left transition-all ${
                    role === 'coach' ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold' : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-secondary">sports</span>
                  <div>
                    <span className="block text-sm font-semibold">Entrenador Principal</span>
                    <span className="block text-xs text-on-surface-variant">Control de juego en vivo</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('analyst')}
                  className={`flex items-start gap-2.5 p-2.5 rounded-md text-left transition-all ${
                    role === 'analyst' ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold' : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-secondary">query_stats</span>
                  <div>
                    <span className="block text-sm font-semibold">Analista Táctico</span>
                    <span className="block text-xs text-on-surface-variant">Modelos predictivos</span>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Correo Corporativo</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@organizacion.com"
                    autoComplete="off"
                    className="w-full h-11 pl-10 pr-10 bg-surface-container-low text-on-surface text-sm rounded-lg border border-surface-container focus:outline-none focus:ring-2 focus:ring-secondary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Contraseña Táctica</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">vpn_key</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
                    className="w-full h-11 pl-10 pr-10 bg-surface-container-low text-on-surface text-sm rounded-lg border border-surface-container focus:outline-none focus:ring-2 focus:ring-secondary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-4 bg-primary hover:bg-secondary text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{loading ? 'VALIDANDO CREDENCIALES...' : 'Continuar'}</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-surface-container flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">¿No tiene cuenta de club registrada?</span>
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
              >
                <span>Solicitar Alta Enterprise</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </button>
            </div>
          </>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="p-4 bg-surface-container-low rounded-lg border border-surface-container">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">security</span>
                  Código de Verificación (2FA)
                </span>
                <span className="text-xs text-error font-mono font-medium">Expira en {formatTimer()}</span>
              </div>
              <div className="grid grid-cols-6 gap-2 mt-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    placeholder="•"
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    className="h-12 text-center font-mono text-lg text-on-surface bg-surface-container-lowest rounded-lg border border-surface-container focus:ring-2 focus:ring-secondary font-bold"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 bg-primary hover:bg-secondary text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{loading ? 'VERIFICANDO CÓDIGO...' : 'Acceder a la Terminal Táctica'}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleBackToCredentials}
                className="text-xs font-bold text-on-surface-variant hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Volver
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-xs font-bold text-secondary hover:underline"
              >
                Reenviar código
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};