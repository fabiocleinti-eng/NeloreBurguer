import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RocketLoader } from '@/components/RocketLoader';
import { restaurantePedidosApi, pedidosApi, entregadoresApi, mensagensApi } from '@/services/api';

// ─── Constantes de status ─────────────────────────────────────────────────────
const STATUS_LABEL = {
  AGUARDANDO_CONFIRMACAO: 'Aguardando',
  CONFIRMADO:             'Confirmado',
  EM_PREPARO:             'Em Preparo',
  EM_ENTREGA:             'Em Entrega',
  ENTREGUE:               'Entregue',
  CANCELADO:              'Cancelado',
};

const STATUS_COR = {
  AGUARDANDO_CONFIRMACAO: 'bg-amber-500/20  text-amber-300  border-amber-500/40',
  CONFIRMADO:             'bg-blue-500/20   text-blue-300   border-blue-500/40',
  EM_PREPARO:             'bg-orange-500/20 text-orange-300 border-orange-500/40',
  EM_ENTREGA:             'bg-purple-500/20 text-purple-300 border-purple-500/40',
  ENTREGUE:               'bg-green-500/20  text-green-300  border-green-500/40',
  CANCELADO:              'bg-red-500/20    text-red-300    border-red-500/40',
};

const PROXIMO_STATUS = {
  AGUARDANDO_CONFIRMACAO: { status: 'CONFIRMADO', label: '✅ Confirmar pedido',       precisaEntregador: false },
  CONFIRMADO:             { status: 'EM_PREPARO', label: '🍳 Iniciar preparo',         precisaEntregador: false },
  EM_PREPARO:             { status: 'EM_ENTREGA', label: '🛵 Enviar para entrega',     precisaEntregador: true  },
  EM_ENTREGA:             { status: 'ENTREGUE',   label: '📦 Marcar como entregue',   precisaEntregador: false },
};

const TABS = ['Novos', 'Em Preparo', 'Em Entrega', 'Concluídos'];

function statusDaTab(tab) {
  if (tab === 'Novos')      return ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADO'];
  if (tab === 'Em Preparo') return ['EM_PREPARO'];
  if (tab === 'Em Entrega') return ['EM_ENTREGA'];
  return                           ['ENTREGUE', 'CANCELADO'];
}

function formatarReais(centavos) {
  return `R$ ${((centavos || 0) / 100).toFixed(2).replace('.', ',')}`;
}

function formatarData(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hoje = new Date();
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === hoje.toDateString()) return `Hoje, ${hora}`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + hora;
}

// ─── Modal: Selecionar entregador ─────────────────────────────────────────────
function ModalEntregador({ entregadores, pedidosAtivos, onConfirmar, onFechar }) {

  // IDs de entregadores que já estão em uma entrega ativa
  const ocupadosIds = new Set(
    pedidosAtivos
      .filter((p) => p.status === 'EM_ENTREGA' && p.entregador?.id)
      .map((p) => p.entregador.id)
  );

  const ativos = entregadores.filter((e) => e.ativo !== false);
  const disponiveis = ativos.filter((e) => !ocupadosIds.has(e.id));

  const [selecionado, setSelecionado] = useState(disponiveis[0]?.id ?? null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl bg-[#1A2B4A] p-6 pb-8 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">🛵 Selecionar entregador</h2>
          <button type="button" onClick={onFechar} className="text-white/40 hover:text-white text-xl">✕</button>
        </div>

        {ativos.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center">
            <p className="text-3xl">🛵</p>
            <p className="mt-2 text-sm text-white/60">Nenhum entregador ativo cadastrado.</p>
            <p className="mt-1 text-xs text-white/30">Cadastre entregadores primeiro.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
            {ativos.map((e) => {
              const ocupado = ocupadosIds.has(e.id);
              const isSel   = e.id === selecionado && !ocupado;

              // Pedido ativo deste entregador (para mostrar qual entrega ele está fazendo)
              const pedidoAtivo = ocupado
                ? pedidosAtivos.find((p) => p.status === 'EM_ENTREGA' && p.entregador?.id === e.id)
                : null;

              return (
                <button
                  key={e.id}
                  type="button"
                  disabled={ocupado}
                  onClick={() => !ocupado && setSelecionado(e.id)}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition
                    ${ocupado
                      ? 'border-red-500/20 bg-red-500/5 opacity-60 cursor-not-allowed'
                      : isSel
                        ? 'border-[#00C4B4] bg-[#00C4B4]/10 cursor-pointer'
                        : 'border-white/10 bg-white/5 hover:border-white/30 cursor-pointer'}`}
                >
                  {/* Avatar */}
                  <div className={`h-11 w-11 shrink-0 overflow-hidden rounded-xl border bg-[#0F1E34]
                    ${ocupado ? 'border-red-500/30' : 'border-[#00C4B4]/30'}`}>
                    {e.foto ? (
                      <img src={e.foto} alt={e.nome} className="h-full w-full object-cover" />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center font-bold
                        ${ocupado ? 'text-red-400' : 'text-[#00C4B4]'}`}>
                        {e.nome?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white truncate">{e.nome}</p>
                      {ocupado ? (
                        <span className="rounded-full bg-red-500/80 px-2 py-0.5 text-[9px] font-bold text-white shrink-0">
                          EM ENTREGA
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-600/60 px-2 py-0.5 text-[9px] font-bold text-white shrink-0">
                          LIVRE
                        </span>
                      )}
                    </div>
                    {ocupado && pedidoAtivo ? (
                      <p className="text-[10px] text-red-300/70">
                        Pedido #{pedidoAtivo.id?.slice(-6).toUpperCase()} · {pedidoAtivo.endereco?.split(',')[0] ?? ''}
                      </p>
                    ) : e.veiculo ? (
                      <p className="text-xs text-[#00C4B4]/70">🛵 {e.veiculo}{e.placa ? ` · ${e.placa}` : ''}</p>
                    ) : null}
                  </div>

                  {isSel && <span className="text-[#00C4B4] text-xl shrink-0">✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {disponiveis.length === 0 && ativos.length > 0 && (
          <p className="mt-3 text-center text-xs text-red-300/70">
            Todos os entregadores estão em entrega no momento.
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 rounded-xl border-2 border-white/20 py-3 text-sm text-white/70 hover:border-white/40"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selecionado || disponiveis.length === 0}
            onClick={() => {
              const entregador = disponiveis.find((e) => e.id === selecionado);
              if (entregador) onConfirmar(entregador);
            }}
            className="flex-1 rounded-xl bg-[#00C4B4] py-3 font-bold text-[#0F1E34] hover:opacity-90 disabled:opacity-40 transition"
          >
            Confirmar envio
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de contato com o cliente ──────────────────────────────────────────
function ModalContato({ pedido, onFechar }) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto]         = useState('');
  const [enviando, setEnviando]   = useState(false);
  const listaRef                  = useRef(null);

  useEffect(() => {
    mensagensApi.listarPorPedido(pedido.id)
      .then(({ data }) => setMensagens(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [pedido.id]);

  // Rolar para o final quando chegam novas mensagens
  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensagens]);

  async function handleEnviar() {
    const t = texto.trim();
    if (!t) return;
    setEnviando(true);
    try {
      const { data } = await mensagensApi.enviar({ pedidoId: pedido.id, texto: t });
      setMensagens((prev) => [...prev, data]);
      setTexto('');
    } finally {
      setEnviando(false);
    }
  }

  const shortId = pedido.id?.slice(-6).toUpperCase() ?? '------';
  const clienteNome = pedido.cliente?.nome || 'Cliente';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl bg-[#1A2B4A] flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-[#00C4B4]/20 border border-[#00C4B4]/30 flex items-center justify-center font-bold text-[#00C4B4]">
            {clienteNome[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{clienteNome}</p>
            <p className="text-[10px] text-white/40">Pedido #{shortId}</p>
          </div>
          <button type="button" onClick={onFechar} className="text-white/40 hover:text-white text-xl">✕</button>
        </div>

        {/* Aviso */}
        <div className="mx-4 mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 shrink-0">
          <p className="text-[10px] text-amber-300/80">
            📢 O cliente receberá esta mensagem na área de pedidos. Apenas o restaurante pode iniciar a conversa.
          </p>
        </div>

        {/* Lista de mensagens */}
        <div ref={listaRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0">
          {mensagens.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center py-6">
              <p className="text-3xl">💬</p>
              <p className="mt-2 text-sm text-white/40">Nenhuma mensagem ainda.</p>
              <p className="text-xs text-white/25 mt-1">Envie uma mensagem ao cliente abaixo.</p>
            </div>
          ) : (
            mensagens.map((m) => (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#00C4B4]/20 border border-[#00C4B4]/30 px-4 py-2">
                  <p className="text-sm text-white">{m.texto}</p>
                  <p className="text-[9px] text-white/30 mt-1 text-right">
                    {new Date(m.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input de envio */}
        <div className="flex gap-2 px-4 py-4 border-t border-white/10 shrink-0">
          <input
            type="text"
            placeholder="Digite sua mensagem…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleEnviar()}
            className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#00C4B4]/60 focus:outline-none"
          />
          <button
            type="button"
            disabled={!texto.trim() || enviando}
            onClick={handleEnviar}
            className="rounded-xl bg-[#00C4B4] px-4 py-2 text-sm font-bold text-[#0F1E34] disabled:opacity-40 transition hover:opacity-90"
          >
            {enviando ? '…' : '↑'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de pedido ───────────────────────────────────────────────────────────
function CardPedido({ pedido, onAvancar, onCancelar, avancando, onContato }) {
  const [expandido, setExpandido] = useState(false);
  const prox = PROXIMO_STATUS[pedido.status];
  const corStatus = STATUS_COR[pedido.status] || 'bg-white/10 text-white/60';
  const shortId = pedido.id?.slice(-6).toUpperCase() ?? '------';

  return (
    <div className="rounded-2xl border border-[#00C4B4]/20 bg-[#1A2B4A]/70 overflow-hidden">
      {/* Cabeçalho */}
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">#{shortId}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${corStatus}`}>
              {STATUS_LABEL[pedido.status] ?? pedido.status}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-0.5 truncate">
            {pedido.cliente?.nome || 'Cliente'} · {pedido.itens?.length ?? 0} {pedido.itens?.length === 1 ? 'item' : 'itens'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-[#00C4B4] text-sm">{formatarReais(pedido.total_centavos)}</p>
          {pedido.taxa_entrega_centavos > 0 && (
            <p className="text-[10px] text-white/30">+ {formatarReais(pedido.taxa_entrega_centavos)} entrega</p>
          )}
          <p className="text-[10px] text-white/30">{formatarData(pedido.criado_em)}</p>
        </div>
        <span className="text-white/40 ml-1">{expandido ? '▲' : '▼'}</span>
      </button>

      {/* Detalhes */}
      {expandido && (
        <div className="border-t border-white/10 px-4 py-3 flex flex-col gap-3">

          {/* Entregador vinculado */}
          {pedido.entregador && (
            <div className="flex items-center gap-3 rounded-xl bg-purple-500/10 border border-purple-500/30 px-3 py-2">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-purple-400/30 bg-[#0F1E34]">
                {pedido.entregador.foto ? (
                  <img src={pedido.entregador.foto} alt={pedido.entregador.nome} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-purple-300">
                    {pedido.entregador.nome?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-200">{pedido.entregador.nome}</p>
                {pedido.entregador.veiculo && (
                  <p className="text-[10px] text-purple-300/70">🛵 {pedido.entregador.veiculo}{pedido.entregador.placa ? ` · ${pedido.entregador.placa}` : ''}</p>
                )}
              </div>
              <span className="ml-auto text-[10px] text-purple-300/60">Entregador</span>
            </div>
          )}

          {/* Itens */}
          <div className="flex flex-col gap-1">
            {(pedido.itens || []).map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-white/80">{item.quantidade ?? 1}× {item.nome || item.name || '–'}</span>
                <span className="text-[#00C4B4]">{formatarReais((item.preco_centavos ?? item.preco ?? 0) * (item.quantidade ?? 1))}</span>
              </div>
            ))}
          </div>

          {/* Resumo de valores */}
          <div className="rounded-xl bg-white/5 px-3 py-2 flex flex-col gap-1 text-xs">
            {pedido.subtotal_centavos != null && (
              <div className="flex justify-between text-white/50">
                <span>Subtotal</span>
                <span>{formatarReais(pedido.subtotal_centavos)}</span>
              </div>
            )}
            {pedido.taxa_entrega_centavos != null && (
              <div className="flex justify-between text-white/50">
                <span>Taxa de entrega</span>
                <span>{pedido.taxa_entrega_centavos === 0 ? 'Grátis' : formatarReais(pedido.taxa_entrega_centavos)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white border-t border-white/10 mt-1 pt-1">
              <span>Total</span>
              <span className="text-[#00C4B4]">{formatarReais(pedido.total_centavos)}</span>
            </div>
          </div>

          {/* Pagamento */}
          {pedido.forma_pagamento && (() => {
            const fp = pedido.forma_pagamento;
            const local = pedido.local_pagamento === 'local';
            const labelMap = {
              PIX:                 '⚡ PIX (online)',
              CARTAO_CREDITO:      `💳 Cartão crédito${pedido.ultimos4 ? ` ···· ${pedido.ultimos4}` : local ? ' (maquininha)' : ' (online)'}`,
              MAQUININHA_CREDITO:  '💳 Crédito — maquininha na entrega',
              MAQUININHA_DEBITO:   '💳 Débito — maquininha na entrega',
              DINHEIRO:            '💵 Dinheiro',
              VALE_REFEICAO:       '🎫 Vale-refeição — maquininha na entrega',
            };
            return <p className="text-xs text-white/50">{labelMap[fp] ?? fp}</p>;
          })()}

          {/* Troco */}
          {pedido.forma_pagamento === 'DINHEIRO' && pedido.nota_dinheiro != null && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/30 px-3 py-2 flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-green-300">💵 Troco a preparar</p>
                <p className="text-[10px] text-green-300/60">Nota entregue pelo cliente: {formatarReais(pedido.nota_dinheiro)}</p>
              </div>
              <p className="text-lg font-extrabold text-green-300">{formatarReais(pedido.troco_centavos)}</p>
            </div>
          )}

          {/* Maquininha */}
          {(pedido.forma_pagamento === 'MAQUININHA_CREDITO' || pedido.forma_pagamento === 'MAQUININHA_DEBITO' || pedido.forma_pagamento === 'VALE_REFEICAO') && (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 px-3 py-2">
              <p className="text-xs font-semibold text-blue-300">💳 Enviar maquininha com o entregador</p>
            </div>
          )}

          {pedido.observacoes && <p className="text-xs text-white/40 italic">📝 {pedido.observacoes}</p>}
          {pedido.endereco    && <p className="text-xs text-white/40">📍 {pedido.endereco}</p>}

          {/* Ações */}
          <div className="flex gap-2 mt-1">
            {prox && (
              <button
                type="button"
                disabled={avancando}
                onClick={() => onAvancar(pedido, prox)}
                className="flex-1 rounded-xl bg-[#00C4B4] py-2 text-xs font-bold text-[#0F1E34] hover:opacity-90 disabled:opacity-50 transition"
              >
                {avancando ? 'Atualizando…' : prox.label}
              </button>
            )}
            {/* Botão de contato */}
            <button
              type="button"
              onClick={() => onContato(pedido)}
              className="rounded-xl border border-[#00C4B4]/40 px-3 py-2 text-xs text-[#00C4B4] hover:bg-[#00C4B4]/10 transition"
              title="Enviar mensagem ao cliente"
            >
              💬
            </button>
            {pedido.status === 'AGUARDANDO_CONFIRMACAO' && (
              <button
                type="button"
                disabled={avancando}
                onClick={() => onCancelar(pedido.id)}
                className="rounded-xl border border-red-500/40 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition"
              >
                Recusar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function RestaurantePedidos() {
  const navigate = useNavigate();
  const restauranteId = sessionStorage.getItem('nelore_restaurante_id') || '';
  const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true';

  const [tab, setTab] = useState('Novos');
  const [pedidos, setPedidos] = useState([]);
  const [entregadores, setEntregadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [avancando, setAvancando] = useState({});

  // Modal de entregador
  const [modalPedido, setModalPedido] = useState(null); // pedido aguardando seleção
  const [modalProx, setModalProx]     = useState(null); // próximo status

  // Modal de contato com cliente
  const [modalContato, setModalContato] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [resPed, resEnt] = await Promise.all([
        restaurantePedidosApi.listar(restauranteId),
        entregadoresApi.listar(),
      ]);
      const lista = Array.isArray(resPed.data) ? resPed.data : resPed.data?.data ?? [];
      lista.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
      setPedidos(lista);

      const ents = Array.isArray(resEnt.data) ? resEnt.data : resEnt.data?.data ?? [];
      setEntregadores(ents);
    } catch {
      setPedidos([]);
    } finally {
      setCarregando(false);
    }
  }, [restauranteId]);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 15_000);
    return () => clearInterval(interval);
  }, [carregar]);

  // Clique no botão de avançar status
  function handleAvancarClick(pedido, prox) {
    if (prox.precisaEntregador) {
      // Abre modal para escolher entregador
      setModalPedido(pedido);
      setModalProx(prox);
    } else {
      confirmarAvancar(pedido.id, prox.status, null);
    }
  }

  async function confirmarAvancar(pedidoId, novoStatus, entregador) {
    setModalPedido(null);
    setModalProx(null);
    setAvancando((p) => ({ ...p, [pedidoId]: true }));
    try {
      await restaurantePedidosApi.atualizarStatus(pedidoId, novoStatus, entregador);
      await carregar();
    } finally {
      setAvancando((p) => ({ ...p, [pedidoId]: false }));
    }
  }

  async function handleCancelar(id) {
    if (!window.confirm('Recusar este pedido?')) return;
    setAvancando((p) => ({ ...p, [id]: true }));
    try {
      await pedidosApi.cancelar(id);
      await carregar();
    } finally {
      setAvancando((p) => ({ ...p, [id]: false }));
    }
  }

  function limparPedidosTeste() {
    if (!window.confirm('Apagar todos os pedidos de teste do localStorage?')) return;
    localStorage.removeItem('pedefacil_pedidos');
    carregar();
  }

  async function criarPedidoTeste() {
    await pedidosApi.criar({
      restauranteId,
      itens: [
        { nome: 'NB Classic',   quantidade: 2, preco_centavos: 3290 },
        { nome: 'Batata Frita', quantidade: 1, preco_centavos: 1490 },
      ],
      total_centavos: 8070,
      forma_pagamento: 'PIX',
      observacoes: 'Sem cebola, por favor.',
      endereco: 'Rua das Flores, 42 — Apto 3',
      clienteNome: 'João Silva',
      clienteEmail: 'joao@demo.com',
    });
    carregar();
  }

  const filtrados    = pedidos.filter((p) => statusDaTab(tab).includes(p.status));
  const qtdNovos     = pedidos.filter((p) => p.status === 'AGUARDANDO_CONFIRMACAO').length;
  const qtdEmPreparo = pedidos.filter((p) => p.status === 'EM_PREPARO').length;
  const qtdEmEntrega = pedidos.filter((p) => p.status === 'EM_ENTREGA').length;

  return (
    <>
      <div className="flex min-h-screen flex-col bg-[#0F1E34] font-sans">

        {/* Header */}
        <header className="flex items-center justify-between bg-[#1A2B4A] px-5 py-4 shadow">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/restaurante/dashboard')} className="text-white text-xl">‹</button>
            <h1 className="text-lg font-bold text-white">Pedidos</h1>
          </div>
          <div className="flex items-center gap-3">
            {pedidos.filter((p) => p.status === 'AGUARDANDO_CONFIRMACAO').length > 0 && (
              <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">
                {pedidos.filter((p) => p.status === 'AGUARDANDO_CONFIRMACAO').length} novo(s)
              </span>
            )}
            <button
              type="button"
              onClick={carregar}
              className="rounded-xl border border-[#00C4B4]/40 px-3 py-1.5 text-xs text-[#00C4B4] hover:bg-[#00C4B4]/10 transition"
            >
              ↺
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="mx-auto flex w-full max-w-lg gap-2 px-4 pt-4">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`relative flex-1 rounded-xl py-2 text-xs font-semibold transition
                ${tab === t ? 'bg-[#00C4B4] text-[#0F1E34]' : 'border border-[#00C4B4]/40 text-[#00C4B4]/70 hover:border-[#00C4B4]'}`}
            >
              {t}
              {t === 'Novos'      && qtdNovos     > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                  {qtdNovos}
                </span>
              )}
              {t === 'Em Preparo' && qtdEmPreparo > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                  {qtdEmPreparo}
                </span>
              )}
              {t === 'Em Entrega' && qtdEmEntrega > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[9px] font-bold text-white">
                  {qtdEmEntrega}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
          {carregando ? (
            <RocketLoader mensagem="Carregando pedidos…" />
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-center">
              <p className="text-4xl">📭</p>
              <p className="text-sm text-white/60">
                {tab === 'Novos' ? 'Nenhum pedido aguardando.' : `Nenhum pedido em "${tab}".`}
              </p>
              {DEV_BYPASS && (tab === 'Novos' || tab === 'Em Preparo') && (
                <button
                  type="button"
                  onClick={criarPedidoTeste}
                  className="rounded-xl border border-[#00C4B4]/50 px-4 py-2 text-xs font-semibold text-[#00C4B4] hover:bg-[#00C4B4]/10 transition"
                >
                  🧪 Criar pedido de teste
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtrados.map((pedido) => (
                <CardPedido
                  key={pedido.id}
                  pedido={pedido}
                  onAvancar={handleAvancarClick}
                  onCancelar={handleCancelar}
                  avancando={avancando[pedido.id]}
                  onContato={setModalContato}
                />
              ))}
            </div>
          )}

          {DEV_BYPASS && pedidos.length > 0 && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={criarPedidoTeste}
                className="flex-1 rounded-xl border border-dashed border-[#00C4B4]/30 py-3 text-xs text-[#00C4B4]/50 hover:border-[#00C4B4]/60 hover:text-[#00C4B4]/80 transition"
              >
                🧪 Simular novo pedido
              </button>
              <button
                type="button"
                onClick={limparPedidosTeste}
                className="rounded-xl border border-dashed border-red-500/20 px-4 py-3 text-xs text-red-400/50 hover:border-red-500/40 hover:text-red-400/80 transition"
              >
                🗑️ Limpar
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modal de seleção de entregador */}
      {modalPedido && (
        <ModalEntregador
          entregadores={entregadores}
          pedidosAtivos={pedidos}
          onFechar={() => { setModalPedido(null); setModalProx(null); }}
          onConfirmar={(entregador) => confirmarAvancar(modalPedido.id, modalProx.status, entregador)}
        />
      )}

      {/* Modal de contato com cliente */}
      {modalContato && (
        <ModalContato
          pedido={modalContato}
          onFechar={() => setModalContato(null)}
        />
      )}
    </>
  );
}
