import axios from 'axios';

const GATEWAY_BASE_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3080';

/** Chave única do JWT no localStorage (Zero Trust). */
export const TOKEN_KEY = 'nelore_jwt';

let authNavigate = null;

/**
 * Injeta `navigate` do React Router para redirecionar sem recarregar a SPA.
 * Deve ser chamado uma vez num componente dentro de `<BrowserRouter>`.
 */
export function setAuthNavigate(navigateFn) {
  authNavigate = typeof navigateFn === 'function' ? navigateFn : null;
}

function clearSessionAndRedirectToLogin() {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }

  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (authNavigate) {
    authNavigate('/login', { replace: true, state: { from: path } });
  } else {
    window.location.assign('/login');
  }
}

const api = axios.create({
  baseURL: GATEWAY_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 60_000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      clearSessionAndRedirectToLogin();
    }
    return Promise.reject(error);
  }
);

export default api;

/** Normaliza token devolvido pelo Gateway (várias convenções comuns). */
export function persistTokenFromResponse(data) {
  if (!data || typeof data !== 'object') return null;
  const raw =
    data.token ??
    data.accessToken ??
    data.access_token ??
    data.jwt ??
    data?.data?.token;
  if (typeof raw === 'string' && raw.length > 0) {
    localStorage.setItem(TOKEN_KEY, raw);
    return raw;
  }
  return null;
}

/**
 * Módulo Usuários e Autenticação — Gateway apenas.
 * POST /api/usuarios/login | /api/usuarios/cadastro
 */
export const usuariosApi = {
  login: (body) => api.post('/api/usuarios/login', body),
  cadastro: (body) => api.post('/api/usuarios/cadastro', body),
};

/**
 * Restaurantes e cardápio — GET /api/restaurantes
 */
export const restaurantesApi = {
  listar: () => api.get('/api/restaurantes'),
};

/**
 * Pedidos — POST /api/pedidos | GET /api/pedidos/meus-pedidos
 */
export const pedidosApi = {
  criar: (payload) => api.post('/api/pedidos', payload),
  meusPedidos: () => api.get('/api/pedidos/meus-pedidos'),
};

/**
 * Pagamentos — POST /api/pagamentos/processar
 */
export const pagamentosApi = {
  processar: (payload) => api.post('/api/pagamentos/processar', payload),
};

/**
 * Entregadores — GET /api/entregadores/status/:pedidoId
 */
export const entregadoresApi = {
  statusEntrega: (pedidoId) =>
    api.get(`/api/entregadores/status/${encodeURIComponent(pedidoId)}`),
};
