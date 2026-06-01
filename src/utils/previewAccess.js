const STORAGE_KEY = 'nelore_preview_session';

/** Duração da sessão em ms (predefinição 8 h). */
export function getPreviewDurationMs() {
  const hours = Number(import.meta.env.VITE_PREVIEW_HOURS) || 8;
  return Math.max(1, hours) * 60 * 60 * 1000;
}

export function getPreviewTokenFromEnv() {
  return (import.meta.env.VITE_PREVIEW_TOKEN || '').trim();
}

export function isPreviewRequired() {
  return Boolean(getPreviewTokenFromEnv());
}

/**
 * @returns {{ exp: number } | null}
 */
export function readPreviewSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.exp !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isPreviewSessionValid() {
  if (!isPreviewRequired()) return true;
  const s = readPreviewSession();
  if (!s) return false;
  return Date.now() < s.exp;
}

export function clearPreviewSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Grava sessão temporária após token correto. */
export function activatePreviewSession() {
  const exp = Date.now() + getPreviewDurationMs();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ exp }));
}

// ── Flag de preview do próprio restaurante ──────────────────────────────────
const OWNER_PREVIEW_KEY = 'nelore_owner_preview';

export function activateOwnerPreview() {
  sessionStorage.setItem(OWNER_PREVIEW_KEY, '1');
}

export function deactivateOwnerPreview() {
  sessionStorage.removeItem(OWNER_PREVIEW_KEY);
}

export function isOwnerPreviewActive() {
  return sessionStorage.getItem(OWNER_PREVIEW_KEY) === '1';
}
