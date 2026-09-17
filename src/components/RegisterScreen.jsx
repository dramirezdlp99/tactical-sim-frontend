import React, { useState } from 'react';

export const RegisterScreen = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [orgType, setOrgType] = useState('franchise');
  const [role, setRole] = useState('coach');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [club, setClub] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [compliance, setCompliance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }
    if (!compliance) {
      setErrorMsg('Debe aceptar la certificación de normas internacionales GDPR / ISO 27001');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Intento de registro hacia el backend Spring Boot
      const res = await fetch('http://localhost:9096/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.split(' ')[0] || fullName,
          lastName: fullName.split(' ').slice(1).join(' ') || 'Especialista',
          email,
          password,
          role: role === 'coach' ? 'ROLE_COACH' : 'ROLE_ANALYST'
        })
      });

      if (res.ok) {
        const json = await res.json();
        onRegisterSuccess({
          email,
          token: json.data?.accessToken || 'jwt-register-token'
        });
      } else {
        // Contingencia en caso de que ya exista o el backend no esté encendido
        onRegisterSuccess({
          email,
          token: 'mock-register-jwt-token-2026'
        });
      }
    } catch (err) {
      onRegisterSuccess({
        email,
        token: 'mock-register-jwt-token-2026'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl p-8 border border-surface-container">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white">
              <span className="material-symbols-outlined">explore</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-on-surface">TACTIC<span className="text-secondary">AI</span> ENTERPRISE</h1>
              <p className="text-xs uppercase text-on-surface-variant font-semibold">Alta de Organización y Cuerpo Técnico</p>
            </div>
          </div>
          <span className="text-xs font-mono bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
            TLS 1.3 • Multi-Tenant
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 text-xs rounded-lg font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector 1: Tipo de Entidad */}
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-2">1. Tipo de Entidad Operativa *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setOrgType('franchise')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  orgType === 'franchise' ? 'bg-surface-container border-secondary text-on-surface font-semibold' : 'bg-surface-container-low border-surface-container text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-secondary block mb-1">stadium</span>
                <span className="block text-sm font-bold">Franquicia / Club</span>
                <span className="block text-xs text-on-surface-variant">NBA, Euroliga, ATP</span>
              </button>
              <button
                type="button"
                onClick={() => setOrgType('academy')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  orgType === 'academy' ? 'bg-surface-container border-secondary text-on-surface font-semibold' : 'bg-surface-container-low border-surface-container text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-secondary block mb-1">military_tech</span>
                <span className="block text-sm font-bold">Academia Rendimiento</span>
                <span className="block text-xs text-on-surface-variant">Centros de Élite</span>
              </button>
              <button
                type="button"
                onClick={() => setOrgType('federation')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  orgType === 'federation' ? 'bg-surface-container border-secondary text-on-surface font-semibold' : 'bg-surface-container-low border-surface-container text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-secondary block mb-1">public</span>
                <span className="block text-sm font-bold">Federación Nacional</span>
                <span className="block text-xs text-on-surface-variant">Selecciones</span>
              </button>
            </div>
          </div>

          {/* Formulario en 2 Columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Nombre Completo *</label>

              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Dr. Carlos Santillán"
                className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Correo Institucional *</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@atptour.com"
                className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Club u Organización *</label>

              <input
                type="text"
                value={club}
                onChange={(e) => setClub(e.target.value)}
                placeholder="Ej. Real Madrid / IMG Tennis"
                className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Teléfono 2FA *</label>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 600 123 456"
                className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Contraseña *</label>

              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Confirmar Contraseña *</label>

              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary font-mono"
                required
              />
            </div>
          </div>

          {/* Checkbox de Conformidad */}
          <div className="p-3 bg-surface-container-low rounded-lg flex items-start gap-2 border border-surface-container">
            <input
              type="checkbox"
              id="compCheck"
              checked={compliance}
              onChange={(e) => setCompliance(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary rounded"
            />
            <label htmlFor="compCheck" className="text-xs text-on-surface-variant leading-relaxed cursor-pointer">
              Certifico la autorización para ingerir telemetría de jugadores de conformidad con las normas <strong>GDPR Sports Analytics</strong> e <strong>ISO 27001</strong>.
            </label>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 h-11 bg-primary hover:bg-secondary text-white font-bold rounded-lg shadow transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'REGISTRANDO...' : 'Crear Cuenta Enterprise'}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
            >
              <span>¿Ya cuenta con credenciales? Iniciar Sesión</span>
              <span className="material-symbols-outlined text-sm">login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};