import axios from 'axios';

const GATEWAY_BASE_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3080';

export const TOKEN_KEY = 'nelore_jwt';

let authNavigate = null;

export function setAuthNavigate(navigateFn) {
  authNavigate = typeof navigateFn === 'function' ? navigateFn : null;
}

function generateRequestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearStoredToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

function clearSessionAndRedirectToLogin(requestUrl = '') {
  clearStoredToken();
  const isRestauranteContext =
    window.location.pathname.startsWith('/restaurante') ||
    requestUrl.includes('/restaurantes');
  const loginPath = isRestauranteContext ? '/restaurante/login' : '/login';
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (authNavigate) {
    authNavigate(loginPath, { replace: true, state: { from: path } });
  } else {
    window.location.assign(loginPath);
  }
}

// ─── Instância Axios ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: GATEWAY_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 8_000,
});

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-Request-Id'] = generateRequestId();
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      clearSessionAndRedirectToLogin(error.config?.url || '');
      return Promise.reject(error);
    }
    if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      return Promise.reject(new Error(
        retryAfter
          ? `Muitas tentativas. Aguarde ${retryAfter}s e tente novamente.`
          : 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
      ));
    }
    if (status === 503 || (!error.response && error.code === 'ECONNABORTED')) {
      return Promise.reject(new Error('Serviço temporariamente indisponível. Tente novamente em instantes.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('Sem conexão com o servidor. Verifique sua internet.'));
    }
    return Promise.reject(error);
  }
);

export default api;

export function persistTokenFromResponse(data) {
  if (!data || typeof data !== 'object') return null;
  const raw = data.token ?? data.accessToken ?? data.access_token ?? data.jwt ?? data?.data?.token;
  if (typeof raw === 'string' && raw.length > 0) {
    try { sessionStorage.setItem(TOKEN_KEY, raw); } catch { return null; }
    return raw;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// APIs
// ─────────────────────────────────────────────────────────────────────────────

export const usuariosApi = {
  login:          (body) => api.post('/api/usuarios/login', body),
  cadastro:       (body) => api.post('/api/usuarios/register', body),
  esqueciSenha:   (body) => api.post('/api/usuarios/esqueci-senha', body),
  redefinirSenha: (body) => api.post('/api/usuarios/redefinir-senha', body),
  loginGoogle:    (body) => api.post('/api/usuarios/login/google', body),
  atualizarPerfil:(body) => api.put('/api/usuarios/me', body),
};

export const restaurantesApi = {
  listar:     ()         => api.get('/api/restaurantes'),
  buscarPorId:(id)       => api.get(`/api/restaurantes/${encodeURIComponent(id)}`),
  atualizar:  (id, body) => api.put(`/api/restaurantes/${encodeURIComponent(id)}`, body),
};

export const cardapioApi = {
  categoriasPorRestaurante: (restauranteId) =>
    api.get(`/api/categorias/restaurante/${encodeURIComponent(restauranteId)}`),

  itensPorCategoria: (categoriaId) =>
    api.get(`/api/itens?categoria_id=${encodeURIComponent(categoriaId)}`),

  criarCategoria: (body) => {
    const restauranteId = sessionStorage.getItem('nelore_restaurante_id') || '';
    return api.post('/api/categorias', { ...body, restaurante_id: restauranteId });
  },

  criarItem: (body) => api.post('/api/itens', body),

  atualizarItem: (itemId, body) =>
    api.patch(`/api/itens/${encodeURIComponent(itemId)}`, body),

  atualizarItemImagem: (itemId, _categoriaId, dataUrl) =>
    api.patch(`/api/itens/${encodeURIComponent(itemId)}/imagem`, { imagem: dataUrl }),

  deletarCategoria: (categoriaId) =>
    api.delete(`/api/categorias/${encodeURIComponent(categoriaId)}`),

  deletarItem: (_categoriaId, itemId) =>
    api.delete(`/api/itens/${encodeURIComponent(itemId)}`),
};

export const pedidosApi = {
  criar:       (payload) => api.post('/api/pedidos', payload),
  meusPedidos: ()        => api.get('/api/pedidos'),
  buscarPorId: (id)      => api.get(`/api/pedidos/${encodeURIComponent(id)}`),
  cancelar:    (id)      => api.delete(`/api/pedidos/${encodeURIComponent(id)}`),
  avaliar:     (id, payload) => api.post(`/api/pedidos/${encodeURIComponent(id)}/avaliacao`, payload),
};

export const restaurantePedidosApi = {
  listar: (restauranteId) => {
    const rid = restauranteId || sessionStorage.getItem('nelore_restaurante_id') || '';
    return api.get(`/api/pedidos/restaurante/${encodeURIComponent(rid)}`);
  },
  atualizarStatus: (id, status, entregador) =>
    api.patch(`/api/pedidos/${encodeURIComponent(id)}/status`, {
      status,
      origem: 'SISTEMA',
      entregador_id: entregador?.id,
    }),
};

export const pagamentosApi = {
  processar: (payload) => api.post('/api/pagamentos/processar', payload),
};

export const entregadoresApi = {
  statusEntrega: (pedidoId) => api.get(`/api/entregadores/status/${encodeURIComponent(pedidoId)}`),
  listar:        ()         => api.get('/api/entregadores'),
  cadastrar:     (body)     => api.post('/api/entregadores', body),
  atualizarStatus: (id, ativoOuStatus) => {
    const status = typeof ativoOuStatus === 'string'
      ? ativoOuStatus
      : ativoOuStatus ? 'DISPONIVEL' : 'INATIVO';
    return api.patch(`/api/entregadores/${encodeURIComponent(id)}/status`, { status });
  },
  deletar: (id) => api.delete(`/api/entregadores/${encodeURIComponent(id)}`),
};

export const restauranteApi = {
  login:   (body) => api.post('/api/restaurantes/login', body),
  cadastro:(body) => api.post('/api/restaurantes/cadastro', body),
};
