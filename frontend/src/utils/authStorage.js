const AUTH_KEY = 'texton_auth';

export function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuth({ token, role, username }) {
  try {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ token, role, username: username || null })
    );
  } catch {
    /* quota or private mode */
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
}

/** Key used for namespaced chat localStorage */
export function chatUserKey(auth) {
  if (auth?.token && auth?.username) return auth.username;
  return 'guest';
}
