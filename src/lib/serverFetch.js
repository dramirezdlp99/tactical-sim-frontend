/**
 * serverFetch.js
 * fetch con limite de tiempo para las paginas del servidor. Los servicios gratis
 * de Render se duermen: la primera peticion puede tardar ~50 s, y una pagina
 * publica no debe quedarse colgada por eso. Nunca lanza: devuelve siempre
 * { ok, status, ms, body, error }.
 *
 * Guardar en: tactical-sim-frontend/src/lib/serverFetch.js
 */
export async function timedFetch(url, { timeoutMs = 4000, init = {} } = {}) {
  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    let body = null;
    try { body = await res.json(); } catch (e) { body = null; }
    return { ok: res.ok, status: res.status, ms: Date.now() - t0, body, error: null };
  } catch (err) {
    return {
      ok: false, status: 0, ms: Date.now() - t0, body: null,
      error: err?.name === 'AbortError' ? `sin respuesta en ${timeoutMs / 1000} s (puede estar despertando)` : String(err?.message || err),
    };
  } finally {
    clearTimeout(timer);
  }
}
