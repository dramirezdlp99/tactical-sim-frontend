import React, { useState } from 'react';
import { BACKEND_URL } from './apiConfig';
import { Icon } from './ui/Icon';
import { Brand } from './ui/Shell';

/** Máscara de teléfono para Colombia: +57 300 123 4567 */
function formatColombianPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  const parts = [];
  if (digits.length > 0) parts.push(digits.slice(0, 3));
  if (digits.length > 3) parts.push(digits.slice(3, 6));
  if (digits.length > 6) parts.push(digits.slice(6, 10));
  return parts.join(' ');
}

function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('Mínimo 8 caracteres.');
  if (!/[A-Z]/.test(password)) errors.push('Debe incluir al menos una letra mayúscula.');
  if (!/[0-9]/.test(password)) errors.push('Debe incluir al menos un número.');
  return errors;
}

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
  const [passwordErrors, setPasswordErrors] = useState([]);

  const handlePhoneChange = (e) => {
    setPhone(formatColombianPhone(e.target.value));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordErrors(validatePassword(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const pwErrors = validatePassword(password);
    setPasswordErrors(pwErrors);
    if (pwErrors.length > 0) {
      setErrorMsg('La contraseña no cumple los requisitos mínimos de seguridad.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }
    if (!compliance) {
      setErrorMsg('Debe aceptar la certificación de normas internacionales GDPR / ISO 27001');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.split(' ')[0] || fullName,
          lastName: fullName.split(' ').slice(1).join(' ') || 'Especialista',
          email,
          password,
          role: role === 'coach' ? 'ROLE_COACH' : 'ROLE_ANALYST',
          // CAMBIO: RegisterRequest.java ahora sí tiene el campo entityType
          // (enum FRANCHISE/ACADEMY/FEDERATION). Jackson deserializa enums
          // en mayúsculas exactas por defecto, por eso .toUpperCase().
          entityType: orgType.toUpperCase()
        })
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.data?.accessToken) {
        onRegisterSuccess({
          email,
          token: json.data.accessToken,
          // CAMBIO CLAVE: antes NO se enviaba el rol aqui, entonces
          // user.role quedaba "undefined" justo despues de registrarse y
          // el boton "Ver Historial" (que depende de
          // user?.role === 'ROLE_ANALYST') nunca podia aparecer, sin
          // importar que rol hubieras elegido en el formulario. Se
          // prioriza lo que confirma el backend; si por lo que sea no
          // viene en la respuesta, se usa lo que el usuario eligio.
          role: json.data.role || (role === 'coach' ? 'ROLE_COACH' : 'ROLE_ANALYST'),
          entityType: json.data.entityType || orgType.toUpperCase()
        });
      } else {
        // CAMBIO CLAVE: sin fallback de token falso. Un registro fallido
        // (email duplicado, validación del backend, etc.) ahora se ve
        // como un error real en pantalla, no como un "éxito" fingido.
        setErrorMsg(json?.message || 'No se pudo completar el registro. Intenta nuevamente.');
      }
    } catch (err) {
      setErrorMsg('No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ta-app" data-sport="BASKETBALL">
      <div className="ta-reg">
        <div className="ta-reg-head">
          <div>
            <Brand />
            <h1 style={{ marginTop: 18 }}>Alta de organización</h1>
            <p style={{ color: 'var(--ta-mute)', margin: '8px 0 0', fontSize: 14 }}>
              Crea la cuenta del cuerpo técnico. Tu tipo de entidad define el enfoque del panel.
            </p>
          </div>
          <span className="ta-pill"><span className="ta-dot" /> TLS 1.3 · MULTI-TENANT</span>
        </div>

        {errorMsg && <div className="ta-notice err" role="alert"><Icon name="alert" /><div>{errorMsg}</div></div>}

        <form onSubmit={handleSubmit}>
          <div className="ta-steplabel"><i>1</i> Tipo de entidad operativa</div>
          <div className="ta-choices">
            {[
              ['franchise', 'stadium', 'Franquicia / Club', 'NBA, Euroliga, ATP'],
              ['academy', 'medal', 'Academia de rendimiento', 'Centros de élite'],
              ['federation', 'globe', 'Federación nacional', 'Selecciones']
            ].map(([id, icon, title, sub]) => (
              <button key={id} type="button" className="ta-choice" aria-pressed={orgType === id} onClick={() => setOrgType(id)}>
                <Icon name={icon} /><b>{title}</b><span>{sub}</span>
              </button>
            ))}
          </div>

          <div className="ta-steplabel"><i>2</i> Perfil operativo</div>
          <div className="ta-choices two">
            <button type="button" className="ta-choice" aria-pressed={role === 'coach'} onClick={() => setRole('coach')}>
              <Icon name="whistle" /><b>Entrenador principal</b><span>Corre simulaciones y guarda jugadas</span>
            </button>
            <button type="button" className="ta-choice" aria-pressed={role === 'analyst'} onClick={() => setRole('analyst')}>
              <Icon name="chart" /><b>Analista táctico</b><span>Consulta el historial y exporta reportes</span>
            </button>
          </div>

          <div className="ta-steplabel"><i>3</i> Datos de acceso</div>
          <div className="ta-two">
            <div>
              <label className="ta-label" htmlFor="reg-name">Nombre completo *</label>
              <input id="reg-name" className="ta-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej. Dr. Carlos Santillán" required />
            </div>
            <div>
              <label className="ta-label" htmlFor="reg-mail">Correo institucional *</label>
              <input id="reg-mail" className="ta-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="analyst@atptour.com" required />
            </div>
            <div>
              <label className="ta-label" htmlFor="reg-club">Club u organización *</label>
              <input id="reg-club" className="ta-input" type="text" value={club} onChange={(e) => setClub(e.target.value)} placeholder="Ej. Real Madrid / IMG Tennis" required />
            </div>
            <div>
              <label className="ta-label" htmlFor="reg-phone">Teléfono 2FA *</label>
              <div style={{ display: 'flex' }}>
                <span className="ta-input ta-mono" style={{ width: 62, display: 'grid', placeItems: 'center', borderRadius: '10px 0 0 10px', borderRight: 0, color: 'var(--ta-mute)', flexShrink: 0 }}>+57</span>
                <input id="reg-phone" className="ta-input" style={{ borderRadius: '0 10px 10px 0' }} type="tel" inputMode="numeric" value={phone} onChange={handlePhoneChange} placeholder="300 123 4567" required />
              </div>
            </div>
            <div>
              <label className="ta-label" htmlFor="reg-pass">Contraseña *</label>
              <input id="reg-pass" className="ta-input ta-mono" type={showPassword ? 'text' : 'password'} value={password} onChange={handlePasswordChange} placeholder="••••••••••••" required />
              {passwordErrors.length > 0 && (
                <ul className="ta-pwrules">{passwordErrors.map((err) => <li key={err}>• {err}</li>)}</ul>
              )}
            </div>
            <div>
              <label className="ta-label" htmlFor="reg-pass2">Confirmar contraseña *</label>
              <input id="reg-pass2" className="ta-input ta-mono" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••••••" required />
            </div>
          </div>
          <button type="button" className="ta-link mute" style={{ marginTop: 10 }} onClick={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'eyeoff' : 'eye'} /> {showPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
          </button>

          <label className="ta-check" style={{ marginTop: 22 }} htmlFor="compCheck">
            <input type="checkbox" id="compCheck" checked={compliance} onChange={(e) => setCompliance(e.target.checked)} />
            <span>Certifico la autorización para ingerir telemetría de jugadores de conformidad con las normas <b style={{ color: 'var(--ta-text)' }}>GDPR Sports Analytics</b> e <b style={{ color: 'var(--ta-text)' }}>ISO 27001</b>.</span>
          </label>

          <div className="ta-dock" style={{ paddingTop: 22 }}>
            <button type="button" className="ta-link" onClick={onSwitchToLogin}><Icon name="arrowleft" /> ¿Ya tienes credenciales? Iniciar sesión</button>
            <button type="submit" disabled={loading} className="ta-btn ta-btn-primary">
              {loading ? 'Registrando…' : 'Crear cuenta enterprise'} <Icon name="arrowright" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
