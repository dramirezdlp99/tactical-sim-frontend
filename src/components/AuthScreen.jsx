import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from './apiConfig';
import { Icon } from './ui/Icon';
import Link from 'next/link';
import { Brand } from './ui/Shell';
import { HeroArt } from './ui/HeroArt';

export const AuthScreen = ({ onLoginSuccess, onSwitchToRegister }) => {
  // El login es de dos pasos reales.
  // 'CREDENTIALS' -> POST /login (valida email+password, emite tempToken)
  // 'OTP'         -> POST /verify-2fa (valida el código, entrega el JWT)
  const [step, setStep] = useState('CREDENTIALS');

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

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
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
      setErrorMessage('No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
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

        // El rol siempre lo determina el backend (lo que quedó guardado al
        // registrarse), nunca una elección hecha aquí en el login.
        onLoginSuccess({
          email,
          token,
          role: json.data.role,
          entityType: json.data.entityType || null
        });
      } else {
        // Código incorrecto o expirado: NO hay fallback de token falso.
        setErrorMessage(json?.message || 'Código inválido.');
      }
    } catch (err) {
      setErrorMessage('No se pudo conectar con el servidor.');
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
    <div className="ta-app ta-auth" data-sport="BASKETBALL">
      <section className="ta-auth-hero">
        <HeroArt />
        <Brand />
        <div className="ta-hero-copy">
          <span className="ta-eyebrow">Plataforma predictiva de alto rendimiento</span>
          <h2 className="ta-hero-title">Lee el juego <em>antes</em> de que ocurra.</h2>
          <p className="ta-hero-sub">
            Dibuja la jugada, deja que el cuerpo técnico virtual rival reaccione y
            mide la probabilidad real de éxito con un modelo entrenado, en
            baloncesto y tenis.
          </p>
          <div className="ta-hero-stats">
            <div><b>4.000</b><span>Escenarios por jugada</span></div>
            <div><b>80K</b><span>Posesiones de entrenamiento</span></div>
            <div><b>2FA</b><span>Acceso verificado</span></div>
          </div>
        </div>
      </section>

      <section className="ta-auth-panel">
        <div className="ta-auth-box">
          <div className="ta-secure">
            <span><Icon name="lock" /> ACCESO RESTRINGIDO · CUERPO TÉCNICO</span>
            <span>TLS 1.3</span>
          </div>

          <h1>{step === 'CREDENTIALS' ? 'Iniciar sesión' : 'Verificación en dos pasos'}</h1>
          <p className="ta-lead">
            {step === 'CREDENTIALS'
              ? 'Ingresa con tu cuenta del club, academia o federación.'
              : `Ingresa el código de 6 dígitos enviado a ${email}.`}
          </p>

          {errorMessage && (
            <div className="ta-notice err" role="alert"><Icon name="alert" /><div>{errorMessage}</div></div>
          )}

          {step === 'CREDENTIALS' && (
            <>
              <form onSubmit={handleCredentialsSubmit} className="ta-form">
                <div>
                  <label className="ta-label" htmlFor="login-email">Correo corporativo</label>
                  <div className="ta-inwrap">
                    <Icon name="mail" />
                    <input id="login-email" className="ta-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@organizacion.com" autoComplete="off" required />
                  </div>
                </div>
                <div>
                  <label className="ta-label" htmlFor="login-pass">Contraseña</label>
                  <div className="ta-inwrap">
                    <Icon name="key" />
                    <input id="login-pass" className="ta-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="off" required />
                    <button type="button" className="ta-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      <Icon name={showPassword ? 'eyeoff' : 'eye'} />
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="ta-btn ta-btn-primary ta-btn-block" style={{ marginTop: 6 }}>
                  {loading ? 'Validando credenciales…' : 'Continuar'} <Icon name="arrowright" />
                </button>
              </form>

              <div className="ta-links">
                <span>¿Tu club aún no tiene cuenta?</span>
                <button type="button" onClick={onSwitchToRegister} className="ta-link">
                  Solicitar alta enterprise <Icon name="arrowright" />
                </button>
              </div>
              <div className="ta-links" style={{ marginTop: 10 }}>
                <span>¿Quieres conocer el proyecto?</span>
                <Link href="/renderizado" className="ta-link">
                  Ver arquitectura y modelo <Icon name="arrowright" />
                </Link>
              </div>
            </>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleOtpSubmit} className="ta-form">
              <div className="ta-links" style={{ margin: 0 }}>
                <span className="ta-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="shield" /> Código de verificación</span>
                <span className="ta-timer">Expira en {formatTimer()}</span>
              </div>
              <div className="ta-otp">
                {otp.map((digit, idx) => (
                  <input
                    key={idx} id={`otp-${idx}`} type="text" inputMode="numeric" maxLength="1"
                    value={digit} data-filled={digit ? 1 : 0} placeholder="·"
                    aria-label={`Dígito ${idx + 1}`}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  />
                ))}
              </div>
              <button type="submit" disabled={loading} className="ta-btn ta-btn-primary ta-btn-block" style={{ marginTop: 6 }}>
                {loading ? 'Verificando código…' : 'Entrar a la sala táctica'} <Icon name="arrowright" />
              </button>
              <div className="ta-links" style={{ margin: 0 }}>
                <button type="button" onClick={handleBackToCredentials} className="ta-link mute"><Icon name="arrowleft" /> Volver</button>
                <button type="button" onClick={handleResendCode} disabled={loading} className="ta-link">Reenviar código</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
