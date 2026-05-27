import axios from 'axios';

const GATEWAY_BASE_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3080';
const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true';

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

function clearSessionAndRedirectToLogin() {
  clearStoredToken();
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (authNavigate) {
    authNavigate('/login', { replace: true, state: { from: path } });
  } else {
    window.location.assign('/login');
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
      if (!DEV_BYPASS) clearSessionAndRedirectToLogin();
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
// MOCK LOCAL — usado apenas quando VITE_DEV_BYPASS=true
// Persiste dados no localStorage para simular o backend durante demonstrações.
// Chave: pedefacil_mock_<entidade>_<id>
// ─────────────────────────────────────────────────────────────────────────────
function gerarId() {
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function mockLer(chave) {
  try { return JSON.parse(localStorage.getItem(chave) || '[]'); } catch { return []; }
}

function mockSalvar(chave, lista) {
  try { localStorage.setItem(chave, JSON.stringify(lista)); } catch { /* ignore */ }
}

const mock = {
  // ── Categorias ──────────────────────────────────────────────────────────────
  listarCategorias(restauranteId) {
    return mockLer(`pedefacil_categorias_${restauranteId}`);
  },
  criarCategoria(restauranteId, body) {
    const lista = this.listarCategorias(restauranteId);
    const nova = {
      id:           gerarId(),
      restaurante_id: restauranteId,
      titulo:       body.titulo || '',
      destaque:     body.destaque || '',
      descricao:    body.descricao || '',
      criado_em:    new Date().toISOString(),
    };
    lista.push(nova);
    mockSalvar(`pedefacil_categorias_${restauranteId}`, lista);
    return nova;
  },
  deletarCategoria(restauranteId, categoriaId) {
    const lista = this.listarCategorias(restauranteId).filter((c) => c.id !== categoriaId);
    mockSalvar(`pedefacil_categorias_${restauranteId}`, lista);
  },

  // ── Itens ────────────────────────────────────────────────────────────────────
  listarItens(categoriaId) {
    return mockLer(`pedefacil_itens_${categoriaId}`);
  },
  criarItem(body) {
    const lista = this.listarItens(body.categoria_id);
    const novo = {
      id:            gerarId(),
      categoria_id:  body.categoria_id,
      nome:          body.nome || '',
      descricao:     body.descricao || '',
      preco_centavos: body.preco_centavos || 0,
      disponivel:    body.disponivel ?? true,
      imagem:        null,
      criado_em:     new Date().toISOString(),
    };
    lista.push(novo);
    mockSalvar(`pedefacil_itens_${body.categoria_id}`, lista);
    return novo;
  },
  atualizarItemImagem(itemId, categoriaId, dataUrl) {
    const lista = this.listarItens(categoriaId).map((i) =>
      i.id === itemId ? { ...i, imagem: dataUrl } : i
    );
    mockSalvar(`pedefacil_itens_${categoriaId}`, lista);
  },
  deletarItem(categoriaId, itemId) {
    const lista = this.listarItens(categoriaId).filter((i) => i.id !== itemId);
    mockSalvar(`pedefacil_itens_${categoriaId}`, lista);
  },

  // ── Pedidos ───────────────────────────────────────────────────────────────────
  listarPedidos() {
    return mockLer('pedefacil_pedidos');
  },
  criarPedido(payload) {
    const lista = this.listarPedidos();
    const restauranteId = sessionStorage.getItem('nelore_restaurante_id') || 'dev-restaurante-001';

    // Normaliza itens — suporta LojaCarrinho (nomeProduto/precoUnitario)
    // e criarPedidoTeste (nome/preco_centavos)
    const itens = (payload.itens || []).map((i) => ({
      id:            i.id || i.produtoId || gerarId(),
      nome:          i.nome || i.nomeProduto || i.name || '–',
      quantidade:    i.quantidade || 1,
      preco_centavos: i.preco_centavos
        ?? i.precoUnitario
        ?? (i.preco != null ? Math.round(Number(i.preco) * 100) : 0),
    }));

    // Taxa de entrega
    const taxa_entrega_centavos = payload.taxaEntrega ?? payload.taxa_entrega_centavos ?? 0;

    // Subtotal dos itens
    const subtotal_centavos = payload.subtotal_centavos
      || itens.reduce((s, i) => s + i.preco_centavos * i.quantidade, 0);

    // Total: subtotal + taxa de entrega
    const total_centavos = payload.total_centavos
      || (subtotal_centavos + taxa_entrega_centavos);

    // Endereço: pode ser objeto (LojaCarrinho) ou string (criarPedidoTeste)
    let endereco = 'Endereço não informado';
    if (payload.endereco) {
      if (typeof payload.endereco === 'string') {
        endereco = payload.endereco;
      } else {
        const e = payload.endereco;
        endereco = [e.rua, e.numero, e.bairro, e.cidade, e.estado]
          .filter(Boolean).join(', ');
      }
    }

    const novo = {
      id:             gerarId(),
      restaurante_id: payload.restauranteId || restauranteId,
      status:         'AGUARDANDO_CONFIRMACAO',
      itens,
      subtotal_centavos,
      taxa_entrega_centavos,
      total_centavos,
      forma_pagamento:  payload.formaPagamento  || payload.forma_pagamento  || 'PIX',
      local_pagamento:  payload.localPagamento  || payload.local_pagamento  || 'local',
      nota_dinheiro:    payload.nota_dinheiro   ?? null,
      troco_centavos:   payload.troco_centavos  ?? null,
      ultimos4:         payload.ultimos4        ?? null,
      observacoes:      payload.observacoes     || '',
      endereco,
      cliente: { nome: payload.clienteNome || 'Cliente Demo', email: payload.clienteEmail || 'cliente@demo.com' },
      criado_em: new Date().toISOString(),
    };
    lista.push(novo);
    mockSalvar('pedefacil_pedidos', lista);
    return novo;
  },
  atualizarStatusPedido(id, status, entregador) {
    const lista = this.listarPedidos().map((p) =>
      p.id === id
        ? { ...p, status, atualizado_em: new Date().toISOString(), ...(entregador ? { entregador } : {}) }
        : p
    );
    mockSalvar('pedefacil_pedidos', lista);
    return lista.find((p) => p.id === id) || null;
  },
  buscarPedido(id) {
    return this.listarPedidos().find((p) => p.id === id) || null;
  },
  atribuirEntregador(pedidoId, entregador) {
    const lista = this.listarPedidos().map((p) =>
      p.id === pedidoId ? { ...p, entregador } : p
    );
    mockSalvar('pedefacil_pedidos', lista);
  },

  // ── Entregadores ─────────────────────────────────────────────────────────────
  listarEntregadores() {
    return mockLer('pedefacil_entregadores');
  },
  cadastrarEntregador(body) {
    const lista = this.listarEntregadores();
    const novo = {
      id:         gerarId(),
      nome:       body.nome    || '',
      email:      body.email   || '',
      telefone:   body.telefone || '',
      veiculo:    body.veiculo || '',
      placa:      body.placa   || '',
      foto:       body.foto    || null,
      ativo:      true,
      criado_em:  new Date().toISOString(),
    };
    lista.push(novo);
    mockSalvar('pedefacil_entregadores', lista);
    return novo;
  },
  atualizarStatusEntregador(id, ativo) {
    const lista = this.listarEntregadores().map((e) =>
      e.id === id ? { ...e, ativo } : e
    );
    mockSalvar('pedefacil_entregadores', lista);
  },

  // ── Mensagens (restaurante → cliente) ────────────────────────────────────────
  listarMensagens() {
    return mockLer('pedefacil_mensagens');
  },
  enviarMensagem({ pedidoId, restauranteId, clienteEmail, texto }) {
    const lista = this.listarMensagens();
    const nova = {
      id:             gerarId(),
      pedidoId,
      restauranteId,
      clienteEmail:   clienteEmail || '',
      texto,
      criadoEm:       new Date().toISOString(),
      lida:           false,
    };
    lista.push(nova);
    mockSalvar('pedefacil_mensagens', lista);
    return nova;
  },
  mensagensPorPedido(pedidoId) {
    return this.listarMensagens().filter((m) => m.pedidoId === pedidoId);
  },
  mensagensParaCliente(clienteEmail) {
    return this.listarMensagens().filter((m) => m.clienteEmail === clienteEmail);
  },
  marcarMensagemLida(id) {
    const lista = this.listarMensagens().map((m) =>
      m.id === id ? { ...m, lida: true } : m
    );
    mockSalvar('pedefacil_mensagens', lista);
  },
  marcarTodasLidasDoPedido(pedidoId) {
    const lista = this.listarMensagens().map((m) =>
      m.pedidoId === pedidoId ? { ...m, lida: true } : m
    );
    mockSalvar('pedefacil_mensagens', lista);
  },

  // ── Restaurante ──────────────────────────────────────────────────────────────
  lerRestaurante(id) {
    try { return JSON.parse(localStorage.getItem(`pedefacil_restaurante_${id}`) || 'null'); } catch { return null; }
  },
  salvarRestaurante(id, dados) {
    try { localStorage.setItem(`pedefacil_restaurante_${id}`, JSON.stringify({ id, ...dados })); } catch { /* ignore */ }
  },
};

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
  listar: () => {
    if (DEV_BYPASS) {
      const rid   = sessionStorage.getItem('nelore_restaurante_id') || 'dev-restaurante-001';
      const salvo = mock.lerRestaurante(rid);
      const demo  = salvo || { id: rid, nome: 'Nelore Burger', tipo: 'Hambúrgueres Artesanais', status: 'ABERTO', imagem: null };
      return Promise.resolve({ data: [demo] });
    }
    return api.get('/api/restaurantes');
  },
  buscarPorId:(id)    => {
    if (DEV_BYPASS) {
      const salvo = mock.lerRestaurante(id);
      const demo  = salvo || {
        id,
        nome:    'Nelore Burger',
        tipo:    'Hambúrgueres Artesanais',
        status:  'ABERTO',
        imagem:  null,
      };
      return Promise.resolve({ data: demo });
    }
    return api.get(`/api/restaurantes/${encodeURIComponent(id)}`);
  },
  atualizar:  (id, body) => {
    if (DEV_BYPASS) {
      const atual = mock.lerRestaurante(id) || { id };
      mock.salvarRestaurante(id, { ...atual, ...body });
      return Promise.resolve({ data: { id, ...atual, ...body } });
    }
    return api.put(`/api/restaurantes/${encodeURIComponent(id)}`, body);
  },
};

export const cardapioApi = {
  categoriasPorRestaurante: (restauranteId) => {
    if (DEV_BYPASS) {
      return Promise.resolve({ data: mock.listarCategorias(restauranteId) });
    }
    return api.get(`/api/categorias/restaurante/${encodeURIComponent(restauranteId)}`);
  },

  itensPorCategoria: (categoriaId) => {
    if (DEV_BYPASS) {
      return Promise.resolve({ data: mock.listarItens(categoriaId) });
    }
    return api.get(`/api/itens?categoria_id=${encodeURIComponent(categoriaId)}`);
  },

  criarCategoria: (body) => {
    if (DEV_BYPASS) {
      const restauranteId = sessionStorage.getItem('nelore_restaurante_id') || 'dev-restaurante-001';
      const nova = mock.criarCategoria(restauranteId, body);
      return Promise.resolve({ data: nova });
    }
    const restauranteId = sessionStorage.getItem('nelore_restaurante_id') || '';
    return api.post('/api/categorias', { ...body, restaurante_id: restauranteId });
  },

  criarItem: (body) => {
    if (DEV_BYPASS) {
      const novo = mock.criarItem(body);
      return Promise.resolve({ data: novo });
    }
    return api.post('/api/itens', body);
  },

  atualizarItemImagem: (itemId, categoriaId, dataUrl) => {
    if (DEV_BYPASS) {
      mock.atualizarItemImagem(itemId, categoriaId, dataUrl);
      return Promise.resolve({ data: { id: itemId, imagem: dataUrl } });
    }
    // Produção: enviar FormData com o arquivo
    return api.patch(`/api/itens/${encodeURIComponent(itemId)}/imagem`, { imagem: dataUrl });
  },

  deletarCategoria: (categoriaId) => {
    if (DEV_BYPASS) {
      const restauranteId = sessionStorage.getItem('nelore_restaurante_id') || 'dev-restaurante-001';
      mock.deletarCategoria(restauranteId, categoriaId);
      return Promise.resolve({ data: { ok: true } });
    }
    return api.delete(`/api/categorias/${encodeURIComponent(categoriaId)}`);
  },

  deletarItem: (categoriaId, itemId) => {
    if (DEV_BYPASS) {
      mock.deletarItem(categoriaId, itemId);
      return Promise.resolve({ data: { ok: true } });
    }
    return api.delete(`/api/itens/${encodeURIComponent(itemId)}`);
  },
};

export const pedidosApi = {
  criar: (payload) => {
    if (DEV_BYPASS) return Promise.resolve({ data: mock.criarPedido(payload) });
    return api.post('/api/pedidos', payload);
  },
  meusPedidos: () => {
    if (DEV_BYPASS) return Promise.resolve({ data: mock.listarPedidos() });
    return api.get('/api/pedidos');
  },
  buscarPorId: (id) => {
    if (DEV_BYPASS) {
      const p = mock.buscarPedido(id);
      return p ? Promise.resolve({ data: p }) : Promise.reject(new Error('Pedido não encontrado'));
    }
    return api.get(`/api/pedidos/${encodeURIComponent(id)}`);
  },
  cancelar: (id) => {
    if (DEV_BYPASS) {
      mock.atualizarStatusPedido(id, 'CANCELADO');
      return Promise.resolve({ data: { ok: true } });
    }
    return api.delete(`/api/pedidos/${encodeURIComponent(id)}`);
  },
  avaliar: (id, payload) => api.post(`/api/pedidos/${encodeURIComponent(id)}/avaliacao`, payload),
};

export const restaurantePedidosApi = {
  listar: (restauranteId) => {
    if (DEV_BYPASS) {
      const rid = restauranteId || sessionStorage.getItem('nelore_restaurante_id') || '';
      const todos = mock.listarPedidos().filter((p) =>
        !rid || p.restaurante_id === rid
      );
      return Promise.resolve({ data: todos });
    }
    const rid = restauranteId || sessionStorage.getItem('nelore_restaurante_id') || '';
    return api.get(`/api/restaurantes/${encodeURIComponent(rid)}/pedidos`);
  },
  atualizarStatus: (id, status, entregador) => {
    if (DEV_BYPASS) {
      const atualizado = mock.atualizarStatusPedido(id, status, entregador);
      return Promise.resolve({ data: atualizado });
    }
    return api.patch(`/api/pedidos/${encodeURIComponent(id)}/status`, { status, entregador_id: entregador?.id });
  },
};

export const pagamentosApi = {
  processar: (payload) => api.post('/api/pagamentos/processar', payload),
};

export const entregadoresApi = {
  statusEntrega: (pedidoId) => api.get(`/api/entregadores/status/${encodeURIComponent(pedidoId)}`),

  listar: () => {
    if (DEV_BYPASS) return Promise.resolve({ data: mock.listarEntregadores() });
    return api.get('/api/entregadores');
  },

  cadastrar: (body) => {
    if (DEV_BYPASS) {
      return Promise.resolve({ data: mock.cadastrarEntregador(body) });
    }
    return api.post('/api/entregadores', body);
  },

  atualizarStatus: (id, ativo) => {
    if (DEV_BYPASS) {
      mock.atualizarStatusEntregador(id, ativo);
      return Promise.resolve({ data: { ok: true } });
    }
    return api.patch(`/api/entregadores/${encodeURIComponent(id)}`, { ativo });
  },
};

export const restauranteApi = {
  login:   (body) => api.post('/api/usuarios/login', body),
  cadastro:(body) => api.post('/api/usuarios/register/restaurante', body),
};

export const mensagensApi = {
  // Restaurante envia mensagem ao cliente de um pedido
  enviar: ({ pedidoId, texto }) => {
    if (DEV_BYPASS) {
      const restauranteId = sessionStorage.getItem('nelore_restaurante_id') || '';
      // Buscar email do cliente no pedido
      const pedido = mock.buscarPedido(pedidoId);
      const clienteEmail = pedido?.cliente?.email || '';
      const nova = mock.enviarMensagem({ pedidoId, restauranteId, clienteEmail, texto });
      return Promise.resolve({ data: nova });
    }
    return api.post(`/api/pedidos/${encodeURIComponent(pedidoId)}/mensagens`, { texto });
  },

  // Busca mensagens de um pedido específico
  listarPorPedido: (pedidoId) => {
    if (DEV_BYPASS) {
      return Promise.resolve({ data: mock.mensagensPorPedido(pedidoId) });
    }
    return api.get(`/api/pedidos/${encodeURIComponent(pedidoId)}/mensagens`);
  },

  // Busca todas as mensagens para o cliente logado
  listarParaMim: () => {
    if (DEV_BYPASS) {
      // Identifica o cliente pelo email no JWT ou usa um email demo fixo
      let email = 'cliente@demo.com';
      try {
        const token = sessionStorage.getItem('nelore_jwt');
        if (token) {
          const p = JSON.parse(atob(token.split('.')[1]));
          email = p.email || p.sub || email;
        }
      } catch { /* ignore */ }
      return Promise.resolve({ data: mock.mensagensParaCliente(email) });
    }
    return api.get('/api/mensagens/para-mim');
  },

  // Conta mensagens não lidas
  naoLidasCount: () => {
    if (DEV_BYPASS) {
      let email = 'cliente@demo.com';
      try {
        const token = sessionStorage.getItem('nelore_jwt');
        if (token) {
          const p = JSON.parse(atob(token.split('.')[1]));
          email = p.email || p.sub || email;
        }
      } catch { /* ignore */ }
      const count = mock.mensagensParaCliente(email).filter((m) => !m.lida).length;
      return Promise.resolve({ data: { count } });
    }
    return api.get('/api/mensagens/nao-lidas');
  },

  // Marca todas as mensagens de um pedido como lidas
  marcarLidasDoPedido: (pedidoId) => {
    if (DEV_BYPASS) {
      mock.marcarTodasLidasDoPedido(pedidoId);
      return Promise.resolve({ data: { ok: true } });
    }
    return api.patch(`/api/pedidos/${encodeURIComponent(pedidoId)}/mensagens/lidas`);
  },
};
