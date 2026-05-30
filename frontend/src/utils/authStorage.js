const AUTH_KEY = 'texton_auth';

export function loadAuth() {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuth({ role, username }) {
  try {
    sessionStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ role, username: username || null })
    );
  } catch {
    /* quota or private mode */
  }
}

export function clearAuth() {
  try {
    sessionStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
}

/** Key used for namespaced chat localStorage */
export function chatUserKey(auth) {
  if (auth?.username && auth?.role && auth.role !== 'guest') return auth.username;
  return 'guest';
}
