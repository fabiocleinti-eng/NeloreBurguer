const CHAVE = 'nelore_notificacoes';

/** @returns {Notificacao[]} */
export function getNotificacoes() {
  try { return JSON.parse(localStorage.getItem(CHAVE) || '[]'); } catch { return []; }
}

function salvar(lista) {
  try { localStorage.setItem(CHAVE, JSON.stringify(lista)); } catch { /* ignore */ }
}

/**
 * @param {{ tipo: 'PEDIDO'|'CUPOM'|'INFO', titulo: string, mensagem: string, pedidoId?: string }} dados
 */
export function adicionarNotificacao({ tipo, titulo, mensagem, pedidoId }) {
  const lista = getNotificacoes();
  // Evita duplicata de mesmo pedido + mensagem
  if (pedidoId && lista.some((n) => n.pedidoId === pedidoId && n.mensagem === mensagem)) return;
  lista.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tipo,
    titulo,
    mensagem,
    lida: false,
    criadaEm: new Date().toISOString(),
    pedidoId: pedidoId || null,
  });
  // Mantém no máximo 50 notificações
  salvar(lista.slice(0, 50));
}

export function marcarTodasLidas() {
  salvar(getNotificacoes().map((n) => ({ ...n, lida: true })));
}

export function marcarLida(id) {
  salvar(getNotificacoes().map((n) => n.id === id ? { ...n, lida: true } : n));
}

export function removerNotificacao(id) {
  salvar(getNotificacoes().filter((n) => n.id !== id));
}

export function limparTodas() {
  salvar([]);
}

export function totalNaoLidas() {
  return getNotificacoes().filter((n) => !n.lida).length;
}

// ─── Notificações de status de pedido ────────────────────────────────────────
const MENSAGENS_STATUS = {
  AGUARDANDO_CONFIRMACAO: { titulo: '📋 Pedido recebido',     mensagem: 'Seu pedido foi enviado e aguarda confirmação do restaurante.' },
  CONFIRMADO:             { titulo: '✅ Pedido confirmado',    mensagem: 'O restaurante confirmou seu pedido!' },
  EM_PREPARO:             { titulo: '👨‍🍳 Em preparo',           mensagem: 'Seu pedido está sendo preparado.' },
  EM_ENTREGA:             { titulo: '🛵 Saiu para entrega',    mensagem: 'Seu pedido está a caminho!' },
  ENTREGUE:               { titulo: '🎉 Pedido entregue',      mensagem: 'Seu pedido foi entregue. Bom apetite!' },
  CANCELADO:              { titulo: '❌ Pedido cancelado',     mensagem: 'Seu pedido foi cancelado.' },
};

export function notificarStatusPedido(pedidoId, status) {
  const info = MENSAGENS_STATUS[status];
  if (!info) return;
  adicionarNotificacao({ tipo: 'PEDIDO', ...info, pedidoId });
}

// ─── Notificações de app (cupons, novidades) ─────────────────────────────────
export function adicionarNotificacaoApp({ titulo, mensagem }) {
  adicionarNotificacao({ tipo: 'INFO', titulo, mensagem });
}

export function carregarNotificacoesDemo() {}
