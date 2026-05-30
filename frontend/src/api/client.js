import axios from 'axios';

const apiClient = axios.create({
  withCredentials: true,
});

let refreshPromise = null;

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios.post('/auth/refresh', {}, { withCredentials: true })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.includes('/auth/login')
      || original?.url?.includes('/auth/signup')
      || original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && original && !original._retried && !isAuthRoute) {
      try {
        await refreshSession();
        original._retried = true;
        return apiClient.request(original);
      } catch {
        clearSessionHint();
      }
    }

    if (error.response?.status === 401 && !isAuthRoute) {
      clearSessionHint();
    }

    return Promise.reject(error);
  }
);

function clearSessionHint() {
  try {
    sessionStorage.removeItem('texton_auth');
  } catch {
    /* ignore */
  }
}

export default apiClient;
