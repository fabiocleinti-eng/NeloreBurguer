import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { RocketLoader } from '@/components/RocketLoader';
import { pedidosApi, entregadoresApi, restaurantesApi } from '@/services/api';
import { notificarStatusPedido } from '@/utils/notificacoes';

/* ── Configuração dos status ─────────────────────────────── */
const FLUXO_STATUS = [
  { key: 'AGUARDANDO_CONFIRMACAO', label: 'Aguardando confirmação', emoji: '🕐' },
  { key: 'CONFIRMADO',             label: 'Confirmado',             emoji: '✅' },
  { key: 'EM_PREPARO',             label: 'Em preparo',             emoji: '👨‍🍳' },
  { key: 'EM_ENTREGA',             label: 'Saiu para entrega',      emoji: '🛵' },
  { key: 'ENTREGUE',               label: 'Entregue',               emoji: '🎉' },
];

const STATUS_LABEL = {
  AGUARDANDO_CONFIRMACAO: { label: 'Aguardando', cor: 'bg-yellow-100 text-yellow-700' },
  CONFIRMADO:             { label: 'Confirmado', cor: 'bg-blue-100 text-blue-700' },
  EM_PREPARO:             { label: 'Em preparo', cor: 'bg-orange-100 text-orange-700' },
  EM_ENTREGA:             { label: 'Saiu p/ entrega', cor: 'bg-purple-100 text-purple-700' },
  ENTREGUE:               { label: 'Entregue', cor: 'bg-green-100 text-green-700' },
  CANCELADO:              { label: 'Cancelado', cor: 'bg-red-100 text-red-600' },
};

const FORMA_LABEL = {
  PIX:            'Pix',
  CARTAO_CREDITO: 'Cartão de crédito',
  CARTAO_DEBITO:  'Cartão de débito',
  DINHEIRO:       'Dinheiro',
  VALE_REFEICAO:  'Vale-refeição',
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] ?? { label: status ?? '–', cor: 'bg-zinc-100 text-zinc-600' };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${s.cor}`}>
      {s.label}
    </span>
  );
}

/* ── Timeline de progresso ───────────────────────────────── */
function TimelinePedido({ status }) {
  if (status === 'CANCELADO') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3">
        <span className="text-2xl">❌</span>
        <span className="text-sm font-semibold text-red-600">Pedido cancelado</span>
      </div>
    );
  }

  const indiceAtual = FLUXO_STATUS.findIndex((s) => s.key === status);

  return (
    <div className="flex flex-col gap-0">
      {FLUXO_STATUS.map((step, i) => {
        const concluido = i < indiceAtual;
        const atual = i === indiceAtual;
        const pendente = i > indiceAtual;

        return (
          <div key={step.key} className="flex items-start gap-3">
            {/* Coluna do ícone + linha */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm
                  ${concluido ? 'bg-green-500 text-white' : ''}
                  ${atual     ? 'bg-[#3CB371] text-white shadow-md' : ''}
                  ${pendente  ? 'bg-zinc-200 text-zinc-400' : ''}
                `}
              >
                {concluido ? '✓' : step.emoji}
              </div>
              {i < FLUXO_STATUS.length - 1 && (
                <div
                  className={`mt-0.5 mb-0.5 w-0.5 flex-1 ${
                    concluido ? 'bg-green-400' : 'bg-zinc-200'
                  }`}
                  style={{ minHeight: '16px' }}
                />
              )}
            </div>

            {/* Texto */}
            <div className="pb-3 pt-1">
              <p
                className={`text-sm font-semibold leading-tight
                  ${concluido ? 'text-green-600' : ''}
                  ${atual     ? 'text-[#3CB371]' : ''}
                  ${pendente  ? 'text-zinc-400' : ''}
                `}
              >
                {step.label}
              </p>
              {atual && (
                <p className="text-xs text-zinc-500">Status atual</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Componente de avaliação ─────────────────────────────── */
function AvaliacaoPedido({ pedidoId }) {
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | enviado | erro
  const [erroMsg, setErroMsg] = useState('');

  async function handleEnviar() {
    if (nota === 0) return;
    setStatus('loading');
    setErroMsg('');
    try {
      await pedidosApi.avaliar(pedidoId, {
        nota,
        ...(comentario.trim() && { comentario: comentario.trim() }),
      });
      setStatus('enviado');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.erro ||
        err.message ||
        'Não foi possível enviar a avaliação.';
      setErroMsg(typeof msg === 'string' ? msg : 'Erro ao avaliar.');
      setStatus('erro');
    }
  }

  if (status === 'enviado') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-green-50 px-4 py-4 text-center">
        <span className="text-3xl">🌟</span>
        <p className="font-semibold text-green-700">Avaliação enviada!</p>
        <p className="text-xs text-green-500">Obrigado pelo seu feedback.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-amber-50 px-4 py-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-500">
        Avalie seu pedido ⭐
      </p>

      {/* Estrelas */}
      <div className="flex justify-center gap-2 mb-3">
        {[1, 2, 3, 4, 5].map((estrela) => (
          <button
            key={estrela}
            type="button"
            onClick={() => setNota(estrela)}
            onMouseEnter={() => setHover(estrela)}
            onMouseLeave={() => setHover(0)}
            className="text-3xl transition-transform hover:scale-110"
          >
            {estrela <= (hover || nota) ? '⭐' : '☆'}
          </button>
        ))}
      </div>

      {nota > 0 && (
        <p className="mb-3 text-center text-xs text-amber-600 font-semibold">
          {['', 'Muito ruim 😞', 'Ruim 😕', 'Regular 😐', 'Bom 😊', 'Excelente 🤩'][nota]}
        </p>
      )}

      {/* Comentário */}
      <textarea
        placeholder="Deixe um comentário (opcional)..."
        value={comentario}
        onChange={(e) => setComentario(e.target.value.slice(0, 1000))}
        disabled={status === 'loading'}
        rows={3}
        className="w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50"
      />
      <p className="mt-0.5 text-right text-xs text-zinc-400">
        {comentario.length}/1000
      </p>

      {status === 'erro' && (
        <p className="mt-1 text-xs text-red-500">{erroMsg}</p>
      )}

      <button
        type="button"
        disabled={nota === 0 || status === 'loading'}
        onClick={handleEnviar}
        className="mt-3 w-full rounded-2xl bg-amber-400 py-2.5 text-sm font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'loading' ? 'Enviando…' : 'Enviar avaliação'}
      </button>
    </div>
  );
}

/* ── Card de rastreamento do entregador ──────────────────── */
function CardEntregador({ pedidoId }) {
  const [entregador, setEntregador] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function buscar() {
      try {
        const { data } = await entregadoresApi.statusEntrega(pedidoId);
        if (!cancelado) setEntregador(data);
      } catch {
        // silencioso — entregador pode ainda não ter sido vinculado
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    buscar();

    // Atualiza a cada 30s enquanto o componente estiver montado
    const intervalo = setInterval(buscar, 30_000);
    return () => { cancelado = true; clearInterval(intervalo); };
  }, [pedidoId]);

  if (carregando) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-3">
        <span className="text-lg">🛵</span>
        <p className="text-sm text-purple-600">Localizando entregador…</p>
      </div>
    );
  }

  if (!entregador) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-purple-50 px-4 py-3">
        <span className="text-lg">🛵</span>
        <p className="text-sm text-purple-600">Entregador a caminho — info não disponível ainda.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-purple-50 px-4 py-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-purple-400">
        Entregador a caminho 🛵
      </p>

      <div className="flex items-center gap-3">
        {/* Foto */}
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-purple-200">
          {entregador.foto ? (
            <img
              src={entregador.foto}
              alt={entregador.nome}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">
              👤
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-0.5">
          <p className="font-bold text-purple-800">{entregador.nome}</p>
          {entregador.telefone && (
            <a
              href={`tel:${entregador.telefone}`}
              className="text-sm text-purple-600 underline"
            >
              📞 {entregador.telefone}
            </a>
          )}
        </div>
      </div>

      {/* Veículo */}
      {entregador.veiculo && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 text-sm text-purple-700">
          <span>🏍️</span>
          <span>
            {entregador.veiculo.modelo} — {entregador.veiculo.placa}
          </span>
        </div>
      )}

      <p className="mt-2 text-right text-xs text-purple-400">
        Atualizado automaticamente a cada 30s
      </p>
    </div>
  );
}

/* ── Seção com título ────────────────────────────────────── */
function Secao({ titulo, children }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">{titulo}</p>
      {children}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */
function centavosParaReais(v) {
  return (Number(v) / 100).toFixed(2).replace('.', ',');
}

function formatarData(d) {
  if (!d) return null;
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function normalizarPedido(raw) {
  const end = raw.endereco ?? {
    rua: raw.enderecoRua,
    numero: raw.enderecoNumero,
    complemento: raw.enderecoComplemento,
    bairro: raw.enderecoBairro,
    cidade: raw.enderecoCidade,
    estado: raw.enderecoEstado,
    cep: raw.enderecoCep,
  };
  return {
    ...raw,
    endereco: end,
    criadoEm:        raw.criadoEm        ?? raw.criado_em              ?? null,
    subtotal:        raw.subtotal        ?? raw.subtotal_centavos       ?? 0,
    taxaEntrega:     raw.taxaEntrega     ?? raw.taxa_entrega_centavos   ?? 0,
    desconto:        raw.desconto        ?? 0,
    total:           raw.total           ?? raw.total_centavos          ?? 0,
    formaPagamento:  raw.formaPagamento  ?? raw.forma_pagamento         ?? null,
    restauranteNome: raw.restauranteNome ?? raw.nomeRestaurante         ?? raw.restaurante?.nome ?? null,
  };
}

/* ── Página principal ────────────────────────────────────── */
export default function LojaPedidoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido]         = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]             = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [cancelado, setCancelado]   = useState(false);
  const statusAnterior              = useRef(null);

  useEffect(() => {
    let canceladoEffect = false;

    pedidosApi.buscarPorId(id)
      .then(async (resPedido) => {
        if (canceladoEffect) return;

        const raw = resPedido.data?.data ?? resPedido.data;
        const p = normalizarPedido(raw);
        if (p.status && statusAnterior.current && statusAnterior.current !== p.status) {
          notificarStatusPedido(id, p.status);
        }
        statusAnterior.current = p.status;

        // Busca nome do restaurante se não veio na resposta
        if (!p.restauranteNome && p.restauranteId) {
          try {
            const { data: rest } = await restaurantesApi.buscarPorId(p.restauranteId);
            const nome = rest?.data?.nome ?? rest?.nome ?? null;
            if (nome) p.restauranteNome = nome;
          } catch { /* silencioso */ }
        }

        if (!canceladoEffect) setPedido(p);
      })
      .catch((err) => {
        if (canceladoEffect) return;
        const msg =
          err.response?.data?.message ||
          err.response?.data?.erro ||
          err.message ||
          'Não foi possível carregar o pedido.';
        setErro(typeof msg === 'string' ? msg : 'Erro ao carregar pedido.');
      })
      .finally(() => {
        if (!canceladoEffect) setCarregando(false);
      });

    return () => { canceladoEffect = true; };
  }, [id]);

  async function handleCancelar() {
    if (!pedido) return;
    setCancelando(true);
    try {
      await pedidosApi.cancelar(id);
      setPedido((p) => ({ ...p, status: 'CANCELADO' }));
      setCancelado(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.erro ||
        err.message ||
        'Não foi possível cancelar o pedido.';
      setErro(typeof msg === 'string' ? msg : 'Erro ao cancelar.');
    } finally {
      setCancelando(false);
    }
  }

  const podeCancelar =
    !cancelado &&
    pedido?.status === 'AGUARDANDO_CONFIRMACAO';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#2D7A4F] to-[#3CB371]">

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaHeader />
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-white">

        {/* Barra de título */}
        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-100 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate('/loja/pedidos')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          >
            ‹
          </button>
          <h2 className="text-base font-bold text-zinc-800">
            {carregando ? 'Carregando…' : pedido ? `Pedido #${pedido.id?.slice(-8) ?? id}` : 'Detalhe do pedido'}
          </h2>
          {pedido && <StatusBadge status={pedido.status} />}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">

          {/* Loading */}
          {carregando && (
            <RocketLoader mensagem="Carregando pedido…" />
          )}

          {/* Erro */}
          {!carregando && erro && (
            <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {erro}
            </div>
          )}

          {/* Conteúdo */}
          {!carregando && pedido && (
            <div className="flex flex-col gap-4">

              {/* Restaurante + Data */}
              {pedido.restauranteNome && (
                <div className="flex items-center gap-2">
                  <span className="text-base">🍽️</span>
                  <p className="text-sm font-semibold text-zinc-700">{pedido.restauranteNome}</p>
                </div>
              )}
              {pedido.criadoEm && (
                <p className="text-xs text-zinc-400">
                  Realizado em {formatarData(pedido.criadoEm)}
                </p>
              )}

              {/* Timeline */}
              <Secao titulo="Acompanhar pedido">
                <TimelinePedido status={pedido.status} />
              </Secao>

              {/* Rastreamento do entregador — só quando EM_ENTREGA */}
              {pedido.status === 'EM_ENTREGA' && (
                <CardEntregador pedidoId={pedido.id} />
              )}

              {/* Avaliação — só quando ENTREGUE */}
              {pedido.status === 'ENTREGUE' && (
                <AvaliacaoPedido pedidoId={pedido.id} />
              )}

              {/* Itens */}
              {Array.isArray(pedido.itens) && pedido.itens.length > 0 && (
                <Secao titulo="Itens do pedido">
                  <ul className="flex flex-col gap-2">
                    {pedido.itens.map((it, i) => (
                      <li key={it.id ?? i} className="flex justify-between text-sm">
                        <span className="text-zinc-700">
                          {it.quantidade}× {it.nomeProduto ?? it.nome ?? '–'}
                        </span>
                        <span className="font-semibold text-zinc-800">
                          R$ {centavosParaReais((it.precoUnitario ?? 0) * (it.quantidade ?? 1))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Secao>
              )}

              {/* Resumo financeiro */}
              <Secao titulo="Valores">
                <div className="flex flex-col gap-1 text-sm text-zinc-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {centavosParaReais(pedido.subtotal ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de entrega</span>
                    <span>R$ {centavosParaReais(pedido.taxaEntrega ?? 0)}</span>
                  </div>
                  {pedido.desconto > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto</span>
                      <span>− R$ {centavosParaReais(pedido.desconto)}</span>
                    </div>
                  )}
                  <div className="mt-1 flex justify-between border-t border-zinc-200 pt-2 text-base font-bold text-zinc-800">
                    <span>Total</span>
                    <span>R$ {centavosParaReais(pedido.total ?? 0)}</span>
                  </div>
                  {pedido.formaPagamento && (
                    <p className="mt-1 text-xs text-zinc-400">
                      Pagamento: {FORMA_LABEL[pedido.formaPagamento] ?? pedido.formaPagamento}
                    </p>
                  )}
                </div>
              </Secao>

              {/* Endereço */}
              {pedido.endereco?.rua && (
                <Secao titulo="Endereço de entrega">
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    {pedido.endereco.rua}, {pedido.endereco.numero}
                    {pedido.endereco.complemento ? ` — ${pedido.endereco.complemento}` : ''}<br />
                    {pedido.endereco.bairro} · {pedido.endereco.cidade}/{pedido.endereco.estado}<br />
                    CEP {pedido.endereco.cep}
                  </p>
                </Secao>
              )}

              {/* Observações */}
              {pedido.observacoes && (
                <Secao titulo="Observações">
                  <p className="text-sm text-zinc-600">{pedido.observacoes}</p>
                </Secao>
              )}

              {/* Cancelar */}
              {podeCancelar && (
                <button
                  type="button"
                  disabled={cancelando}
                  onClick={handleCancelar}
                  className="w-full rounded-2xl border border-red-300 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {cancelando ? 'Cancelando…' : 'Cancelar pedido'}
                </button>
              )}

              {cancelado && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                  Pedido cancelado com sucesso.
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaBottomNav />
      </div>

    </div>
  );
}
