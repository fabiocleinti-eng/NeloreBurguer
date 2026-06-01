import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RocketLoader } from '@/components/RocketLoader';
import { restaurantePedidosApi, pedidosApi, entregadoresApi, getStoredToken } from '@/services/api';

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

const LIMITES_ATRASO = {
  AGUARDANDO_CONFIRMACAO: { ambar: 5,  vermelho: 10 },
  CONFIRMADO:             { ambar: 10, vermelho: 20 },
  EM_PREPARO:             { ambar: 20, vermelho: 35 },
  EM_ENTREGA:             { ambar: 30, vermelho: 50 },
};

function minutosDecorridos(criadoEm) {
  if (!criadoEm) return 0;
  return (Date.now() - new Date(criadoEm).getTime()) / 60_000;
}

function TempoDecorrido({ criadoEm, status }) {
  const [mins, setMins] = useState(() => minutosDecorridos(criadoEm));

  useEffect(() => {
    const id = setInterval(() => setMins(minutosDecorridos(criadoEm)), 1_000);
    return () => clearInterval(id);
  }, [criadoEm]);

  const limites = LIMITES_ATRASO[status];
  if (!limites) return null;

  const total = Math.floor(mins);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const display = h > 0 ? `${h}h ${m}min` : `${m}min`;

  const cor = total >= limites.vermelho
    ? 'text-red-400'
    : total >= limites.ambar
      ? 'text-amber-400'
      : 'text-green-400';

  return <span className={`text-[10px] font-bold ${cor}`}>⏱ {display}</span>;
}

const PROXIMO_STATUS = {
  AGUARDANDO_CONFIRMACAO: { status: 'CONFIRMADO', label: '✅ Confirmar pedido',     precisaEntregador: false },
  CONFIRMADO:             { status: 'EM_PREPARO', label: '🍳 Iniciar preparo',       precisaEntregador: false },
  // EM_PREPARO: controlado pelo botão "Marcar como pronto" (estado local)
  EM_ENTREGA:             { status: 'ENTREGUE',   label: '📦 Marcar como entregue', precisaEntregador: false },
};

const TABS = ['Novos', 'Em Preparo', 'Pronto p/ Entrega', 'Em Entrega', 'Concluídos'];

function statusDaTab(tab, prontos = new Set()) {
  if (tab === 'Novos')             return ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADO'];
  if (tab === 'Em Preparo')        return ['EM_PREPARO'];
  if (tab === 'Pronto p/ Entrega') return ['EM_PREPARO']; // filtrado por prontos
  if (tab === 'Em Entrega')        return ['EM_ENTREGA'];
  return                                  ['ENTREGUE', 'CANCELADO'];
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

  // Usa o status real do entregador vindo do delivery-entregador service
  const ativos      = entregadores.filter((e) => e.status !== 'INATIVO');
  const disponiveis = ativos.filter((e) => e.status === 'DISPONIVEL');

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
              const ocupado = e.status === 'EM_ENTREGA';
              const isSel   = e.id === selecionado && !ocupado;

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
                    {ocupado ? (
                      <p className="text-[10px] text-red-300/70">Em entrega — indisponível no momento</p>
                    ) : e.veiculo ? (
                      <p className="text-xs text-[#00C4B4]/70">🛵 {typeof e.veiculo === 'object' ? e.veiculo.tipo : e.veiculo}{(typeof e.veiculo === 'object' ? e.veiculo.placa : e.placa) ? ` · ${typeof e.veiculo === 'object' ? e.veiculo.placa : e.placa}` : ''}</p>
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

// ─── Card de pedido ───────────────────────────────────────────────────────────
function CardPedido({ pedido, onAvancar, onCancelar, onMarcarPronto, isPronto, avancando }) {
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
            <TempoDecorrido criadoEm={pedido.criadoEm ?? pedido.criado_em} status={pedido.status} />
          </div>
          <p className="text-xs text-white/50 mt-0.5 truncate">
            {pedido.cliente?.nome ?? `Cliente #${String(pedido.clienteId ?? '').slice(-4)}`} · {pedido.itens?.length ?? 0} {pedido.itens?.length === 1 ? 'item' : 'itens'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-[#00C4B4] text-sm">{formatarReais(pedido.total ?? pedido.total_centavos)}</p>
          {(pedido.taxaEntrega ?? pedido.taxa_entrega_centavos) > 0 && (
            <p className="text-[10px] text-white/30">+ {formatarReais(pedido.taxaEntrega ?? pedido.taxa_entrega_centavos)} entrega</p>
          )}
          <p className="text-[10px] text-white/30">{formatarData(pedido.criadoEm ?? pedido.criado_em)}</p>
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
                  <p className="text-[10px] text-purple-300/70">🛵 {typeof pedido.entregador.veiculo === 'object' ? pedido.entregador.veiculo.tipo : pedido.entregador.veiculo}{(typeof pedido.entregador.veiculo === 'object' ? pedido.entregador.veiculo.placa : pedido.entregador.placa) ? ` · ${typeof pedido.entregador.veiculo === 'object' ? pedido.entregador.veiculo.placa : pedido.entregador.placa}` : ''}</p>
                )}
              </div>
              <span className="ml-auto text-[10px] text-purple-300/60">Entregador</span>
            </div>
          )}

          {/* Itens */}
          <div className="flex flex-col gap-1">
            {(pedido.itens || []).map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-white/80">{item.quantidade ?? 1}× {item.nomeProduto ?? item.nome ?? item.name ?? '–'}</span>
                <span className="text-[#00C4B4]">{formatarReais((item.precoUnitario ?? item.preco_centavos ?? item.preco ?? 0) * (item.quantidade ?? 1))}</span>
              </div>
            ))}
          </div>

          {/* Resumo de valores */}
          <div className="rounded-xl bg-white/5 px-3 py-2 flex flex-col gap-1 text-xs">
            {(pedido.subtotal ?? pedido.subtotal_centavos) != null && (
              <div className="flex justify-between text-white/50">
                <span>Subtotal</span>
                <span>{formatarReais(pedido.subtotal ?? pedido.subtotal_centavos)}</span>
              </div>
            )}
            {(pedido.taxaEntrega ?? pedido.taxa_entrega_centavos) != null && (
              <div className="flex justify-between text-white/50">
                <span>Taxa de entrega</span>
                <span>{(pedido.taxaEntrega ?? pedido.taxa_entrega_centavos) === 0 ? 'Grátis' : formatarReais(pedido.taxaEntrega ?? pedido.taxa_entrega_centavos)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white border-t border-white/10 mt-1 pt-1">
              <span>Total</span>
              <span className="text-[#00C4B4]">{formatarReais(pedido.total ?? pedido.total_centavos)}</span>
            </div>
          </div>

          {/* Pagamento */}
          {(pedido.formaPagamento ?? pedido.forma_pagamento) && (() => {
            const fp = pedido.formaPagamento ?? pedido.forma_pagamento;
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
          {(pedido.formaPagamento ?? pedido.forma_pagamento) === 'DINHEIRO' && (pedido.nota_dinheiro ?? pedido.notaDinheiro) != null && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/30 px-3 py-2 flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-green-300">💵 Troco a preparar</p>
                <p className="text-[10px] text-green-300/60">Nota entregue pelo cliente: {formatarReais(pedido.nota_dinheiro ?? pedido.notaDinheiro)}</p>
              </div>
              <p className="text-lg font-extrabold text-green-300">{formatarReais(pedido.troco_centavos ?? pedido.trocoCentavos)}</p>
            </div>
          )}

          {/* Maquininha */}
          {(['MAQUININHA_CREDITO','MAQUININHA_DEBITO','VALE_REFEICAO'].includes(pedido.formaPagamento ?? pedido.forma_pagamento)) && (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 px-3 py-2">
              <p className="text-xs font-semibold text-blue-300">💳 Enviar maquininha com o entregador</p>
            </div>
          )}

          {pedido.observacoes && <p className="text-xs text-white/40 italic">📝 {pedido.observacoes}</p>}
          {pedido.endereco && (() => {
            const e = pedido.endereco;
            const linha = typeof e === 'string'
              ? e
              : [e.rua, e.numero, e.bairro, e.cidade, e.estado].filter(Boolean).join(', ');
            return linha ? <p className="text-xs text-white/40">📍 {linha}</p> : null;
          })()}

          {/* Ações */}
          <div className="flex gap-2 mt-1">
            {/* EM_PREPARO: dois caminhos — marcar pronto ou enviar */}
            {pedido.status === 'EM_PREPARO' && !isPronto && (
              <button
                type="button"
                disabled={avancando}
                onClick={() => onMarcarPronto(pedido.id)}
                className="flex-1 rounded-xl bg-green-600 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition"
              >
                ✅ Marcar como pronto
              </button>
            )}
            {pedido.status === 'EM_PREPARO' && isPronto && (
              <button
                type="button"
                disabled={avancando}
                onClick={() => onAvancar(pedido, { status: 'EM_ENTREGA', label: '🛵 Enviar para entrega', precisaEntregador: true })}
                className="flex-1 rounded-xl bg-[#00C4B4] py-2 text-xs font-bold text-[#0F1E34] hover:opacity-90 disabled:opacity-50 transition"
              >
                {avancando ? 'Atualizando…' : '🛵 Enviar para entrega'}
              </button>
            )}
            {/* Demais status */}
            {prox && pedido.status !== 'EM_PREPARO' && (
              <button
                type="button"
                disabled={avancando}
                onClick={() => onAvancar(pedido, prox)}
                className="flex-1 rounded-xl bg-[#00C4B4] py-2 text-xs font-bold text-[#0F1E34] hover:opacity-90 disabled:opacity-50 transition"
              >
                {avancando ? 'Atualizando…' : prox.label}
              </button>
            )}
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
  // Resolve o restauranteId — sessionStorage ou fallback via JWT
  const restauranteId = (() => {
    const salvo = sessionStorage.getItem('nelore_restaurante_id');
    if (salvo) return salvo;
    try {
      const token = getStoredToken();
      if (!token) return '';
      const payload = JSON.parse(atob(token.split('.')[1]));
      const id = payload.restauranteId || payload.restaurante_id || payload.id || payload.sub || '';
      if (id) sessionStorage.setItem('nelore_restaurante_id', String(id));
      return String(id);
    } catch { return ''; }
  })();

  const [tab, setTab] = useState('Novos');
  const [pedidos, setPedidos] = useState([]);
  const [entregadores, setEntregadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [avancando, setAvancando] = useState({});
  const [alertaNovo, setAlertaNovo] = useState(false);

  // IDs de pedidos marcados como "pronto" (estado local — EM_PREPARO no DB)
  const [prontos, setProntos] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('pedidos_prontos') || '[]')); }
    catch { return new Set(); }
  });

  function marcarPronto(id) {
    setProntos((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { sessionStorage.setItem('pedidos_prontos', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  function desmarcarPronto(id) {
    setProntos((prev) => {
      const next = new Set(prev);
      next.delete(id);
      try { sessionStorage.setItem('pedidos_prontos', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  const qtdNovosRef = useRef(-1); // -1 = primeira carga (não alerta)

  // Modal de entregador
  const [modalPedido, setModalPedido] = useState(null);
  const [modalProx, setModalProx]     = useState(null);

  function tocarSom() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 150, 300].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880 - i * 110;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay / 1000);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.25);
        osc.start(ctx.currentTime + delay / 1000);
        osc.stop(ctx.currentTime + delay / 1000 + 0.3);
      });
    } catch { /* navegador sem suporte */ }
  }

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resPed = await restaurantePedidosApi.listar(restauranteId);
      const lista = Array.isArray(resPed.data) ? resPed.data : resPed.data?.data ?? [];
      lista.sort((a, b) => new Date(b.criadoEm ?? b.criado_em) - new Date(a.criadoEm ?? a.criado_em));
      setPedidos(lista);

      const novos = lista.filter(p => p.status === 'AGUARDANDO_CONFIRMACAO').length;
      if (qtdNovosRef.current >= 0 && novos > qtdNovosRef.current) {
        setAlertaNovo(true);
        tocarSom();
        setTimeout(() => setAlertaNovo(false), 6000);
      }
      qtdNovosRef.current = novos;
    } catch (err) {
      console.error('[RestaurantePedidos] Erro ao carregar pedidos:', err?.response?.data ?? err?.message ?? err);
      setPedidos([]);
    }

    try {
      const resEnt = await entregadoresApi.listar();
      const ents = Array.isArray(resEnt.data) ? resEnt.data : resEnt.data?.data ?? [];
      setEntregadores(ents);
    } catch {
      // entregadores não bloqueiam os pedidos
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

      // Remove do set de prontos ao enviar para entrega
      if (novoStatus === 'EM_ENTREGA') desmarcarPronto(pedidoId);

      // Sincroniza status do entregador com o status do pedido
      if (novoStatus === 'EM_ENTREGA' && entregador?.id) {
        await entregadoresApi.atualizarStatus(entregador.id, 'EM_ENTREGA').catch(() => {});
      } else if (novoStatus === 'ENTREGUE' || novoStatus === 'CANCELADO') {
        // Libera o entregador do pedido — busca nos dados atuais ou recarrega
        const pedidoAtual = pedidos.find(p => p.id === pedidoId);
        const entregadorId = pedidoAtual?.entregadorId
          ?? pedidoAtual?.entregador_id
          ?? pedidoAtual?.entregador?.id;

        if (entregadorId) {
          await entregadoresApi.atualizarStatus(entregadorId, 'DISPONIVEL').catch(() => {});
        } else {
          // Fallback: libera todos que estão EM_ENTREGA sem pedido ativo
          await carregar();
          const emEntrega = entregadores.filter(e => e.status === 'EM_ENTREGA');
          const pedidosAtivos = pedidos.filter(p => p.status === 'EM_ENTREGA' && p.id !== pedidoId);
          for (const ent of emEntrega) {
            const temPedidoAtivo = pedidosAtivos.some(p =>
              p.entregadorId === ent.id || p.entregador_id === ent.id
            );
            if (!temPedidoAtivo) {
              await entregadoresApi.atualizarStatus(ent.id, 'DISPONIVEL').catch(() => {});
            }
          }
        }
      }

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

  const filtrados = pedidos.filter((p) => {
    if (tab === 'Em Preparo')        return p.status === 'EM_PREPARO' && !prontos.has(p.id);
    if (tab === 'Pronto p/ Entrega') return p.status === 'EM_PREPARO' && prontos.has(p.id);
    return statusDaTab(tab).includes(p.status);
  });
  const qtdNovos     = pedidos.filter((p) => p.status === 'AGUARDANDO_CONFIRMACAO').length;
  const qtdEmPreparo = pedidos.filter((p) => p.status === 'EM_PREPARO' && !prontos.has(p.id)).length;
  const qtdProntos   = pedidos.filter((p) => p.status === 'EM_PREPARO' && prontos.has(p.id)).length;
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

        {/* Banner de novo pedido */}
        {alertaNovo && (
          <div className="mx-auto w-full max-w-lg px-4 pt-3">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-400/60 bg-amber-500/20 px-4 py-3 animate-pulse">
              <span className="text-2xl">🔔</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-300">Novo pedido recebido!</p>
                <p className="text-xs text-amber-300/70">Verifique a aba "Novos" para confirmar.</p>
              </div>
              <button
                type="button"
                onClick={() => { setAlertaNovo(false); setTab('Novos'); }}
                className="rounded-xl bg-amber-500 px-3 py-1 text-xs font-bold text-[#0F1E34] hover:bg-amber-400 transition"
              >
                Ver agora
              </button>
            </div>
          </div>
        )}

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
              {t === 'Novos'             && qtdNovos     > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">{qtdNovos}</span>
              )}
              {t === 'Em Preparo'        && qtdEmPreparo > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">{qtdEmPreparo}</span>
              )}
              {t === 'Pronto p/ Entrega' && qtdProntos   > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold text-white">{qtdProntos}</span>
              )}
              {t === 'Em Entrega'        && qtdEmEntrega > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[9px] font-bold text-white">{qtdEmEntrega}</span>
              )}
            </button>
          ))}
        </div>

        {/* Banner de atraso */}
        {(() => {
          const atrasados = pedidos.filter((p) => {
            const l = LIMITES_ATRASO[p.status];
            return l && minutosDecorridos(p.criadoEm ?? p.criado_em) >= l.ambar;
          });
          if (atrasados.length === 0) return null;
          const criticos = atrasados.filter((p) => minutosDecorridos(p.criadoEm ?? p.criado_em) >= LIMITES_ATRASO[p.status].vermelho);
          const temCritico = criticos.length > 0;
          return (
            <div className="mx-auto w-full max-w-lg px-4 pt-2">
              <div className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5
                ${temCritico ? 'border-red-500/40 bg-red-500/10' : 'border-amber-500/40 bg-amber-500/10'}`}>
                <span className="text-base">{temCritico ? '🔴' : '🟡'}</span>
                <p className={`text-xs font-semibold ${temCritico ? 'text-red-300' : 'text-amber-300'}`}>
                  {temCritico
                    ? `${criticos.length} pedido${criticos.length > 1 ? 's' : ''} com atraso crítico!`
                    : `${atrasados.length} pedido${atrasados.length > 1 ? 's' : ''} precisando de atenção`}
                </p>
              </div>
            </div>
          );
        })()}

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
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtrados.map((pedido) => (
                <CardPedido
                  key={pedido.id}
                  pedido={pedido}
                  onAvancar={handleAvancarClick}
                  onCancelar={handleCancelar}
                  onMarcarPronto={marcarPronto}
                  isPronto={prontos.has(pedido.id)}
                  avancando={avancando[pedido.id]}
                />
              ))}
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

    </>
  );
}
