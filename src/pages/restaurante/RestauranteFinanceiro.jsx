import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RocketLoader } from '@/components/RocketLoader';
import { restaurantePedidosApi } from '@/services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatarReais(centavos) {
  return `R$ ${((centavos || 0) / 100).toFixed(2).replace('.', ',')}`;
}

function ehHoje(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const hoje = new Date();
  return d.toDateString() === hoje.toDateString();
}

function formatarHora(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const METODO_INFO = {
  PIX:                 { icon: '⚡', label: 'PIX',               cor: 'text-green-400',  bg: 'bg-green-500/10  border-green-500/30'  },
  CARTAO_CREDITO:      { icon: '💳', label: 'Crédito (online)',   cor: 'text-blue-400',   bg: 'bg-blue-500/10   border-blue-500/30'   },
  MAQUININHA_CREDITO:  { icon: '💳', label: 'Crédito (maq.)',     cor: 'text-blue-300',   bg: 'bg-blue-500/10   border-blue-500/30'   },
  MAQUININHA_DEBITO:   { icon: '💳', label: 'Débito (maq.)',      cor: 'text-cyan-400',   bg: 'bg-cyan-500/10   border-cyan-500/30'   },
  DINHEIRO:            { icon: '💵', label: 'Dinheiro',           cor: 'text-amber-400',  bg: 'bg-amber-500/10  border-amber-500/30'  },
  VALE_REFEICAO:       { icon: '🎫', label: 'Vale-refeição',      cor: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  CARTAO_DEBITO:       { icon: '💳', label: 'Débito (online)',    cor: 'text-cyan-300',   bg: 'bg-cyan-500/10   border-cyan-500/30'   },
};

function campo(p, snake, camel) {
  return p[camel] ?? p[snake] ?? 0;
}

// Agrupa pedidos entregues por forma de pagamento
function calcularFinanceiro(pedidos) {
  const hoje = pedidos.filter((p) =>
    p.status === 'ENTREGUE' && ehHoje(p.criadoEm ?? p.criado_em)
  );
  const totalGeral   = hoje.reduce((s, p) => s + campo(p, 'total_centavos',         'total'),        0);
  const totalSemTaxa = hoje.reduce((s, p) => s + campo(p, 'subtotal_centavos',       'subtotal'),     0);
  const totalTaxa    = hoje.reduce((s, p) => s + campo(p, 'taxa_entrega_centavos',   'taxaEntrega'),  0);

  const porMetodo = {};
  for (const p of hoje) {
    const m = p.formaPagamento ?? p.forma_pagamento ?? 'OUTRO';
    if (!porMetodo[m]) porMetodo[m] = { total: 0, qtd: 0 };
    porMetodo[m].total += campo(p, 'total_centavos', 'total');
    porMetodo[m].qtd   += 1;
  }

  return { hoje, totalGeral, totalSemTaxa, totalTaxa, porMetodo };
}

// ─── Cartão de método de pagamento ───────────────────────────────────────────
function CardMetodo({ metodo, total, qtd }) {
  const info = METODO_INFO[metodo] || { icon: '💰', label: metodo, cor: 'text-white/60', bg: 'bg-white/5 border-white/10' };
  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${info.bg}`}>
      <span className="text-2xl">{info.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold ${info.cor}`}>{info.label}</p>
        <p className="text-[10px] text-white/40">{qtd} {qtd === 1 ? 'pedido' : 'pedidos'}</p>
      </div>
      <p className={`text-base font-extrabold ${info.cor}`}>{formatarReais(total)}</p>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function RestauranteFinanceiro() {
  const navigate = useNavigate();
  const restauranteId = sessionStorage.getItem('nelore_restaurante_id') || '';

  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState(null);
  const [periodoLabel] = useState(() => {
    return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  });

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      try {
        const { data } = await restaurantePedidosApi.listar(restauranteId);
        const lista = Array.isArray(data) ? data : data?.data ?? [];
        setDados(calcularFinanceiro(lista));
      } catch {
        setDados({ hoje: [], totalGeral: 0, totalSemTaxa: 0, totalTaxa: 0, porMetodo: {} });
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [restauranteId]);

  const metodos = dados ? Object.entries(dados.porMetodo).sort((a, b) => b[1].total - a[1].total) : [];

  return (
    <div className="flex min-h-screen flex-col bg-[#0F1E34] font-sans">

      {/* Header */}
      <header className="flex items-center gap-3 bg-[#1A2B4A] px-5 py-4 shadow">
        <button type="button" onClick={() => navigate('/restaurante/dashboard')} className="text-white text-xl">‹</button>
        <div>
          <h1 className="text-lg font-bold text-white">Financeiro</h1>
          <p className="text-xs text-white/40 capitalize">{periodoLabel}</p>
        </div>
      </header>

      {carregando ? (
        <RocketLoader mensagem="Carregando dados financeiros…" />
      ) : (
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 flex flex-col gap-6">

          {/* ── Resumo do dia ─────────────────────────────────────── */}
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#00C4B4]">Resumo do dia</h2>

            {/* Total principal */}
            <div className="rounded-2xl bg-gradient-to-br from-[#00C4B4]/20 to-[#1A2B4A] border border-[#00C4B4]/30 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50">Total faturado</p>
                <p className="text-3xl font-extrabold text-white mt-1">{formatarReais(dados.totalGeral)}</p>
                <p className="text-xs text-white/40 mt-1">{dados.hoje.length} {dados.hoje.length === 1 ? 'pedido entregue' : 'pedidos entregues'}</p>
              </div>
              <span className="text-5xl opacity-40">💰</span>
            </div>

            {/* Breakdown subtotal vs taxa */}
            {dados.totalGeral > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <p className="text-[10px] text-white/40">Produtos</p>
                  <p className="text-base font-bold text-white">{formatarReais(dados.totalSemTaxa)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <p className="text-[10px] text-white/40">Taxa de entrega</p>
                  <p className="text-base font-bold text-white">{formatarReais(dados.totalTaxa)}</p>
                </div>
              </div>
            )}
          </section>

          {/* ── Entradas por forma de pagamento ─────────────────── */}
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#00C4B4]">Entradas por pagamento</h2>

            {metodos.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center">
                <p className="text-3xl">📊</p>
                <p className="mt-2 text-sm text-white/60">Nenhum pedido entregue hoje ainda.</p>
                <p className="mt-1 text-xs text-white/30">Os dados aparecem conforme os pedidos forem concluídos.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {metodos.map(([metodo, { total, qtd }]) => (
                  <CardMetodo key={metodo} metodo={metodo} total={total} qtd={qtd} />
                ))}
              </div>
            )}
          </section>

          {/* ── Lista de pedidos do dia ───────────────────────────── */}
          {dados.hoje.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#00C4B4]">Pedidos entregues hoje</h2>
              <div className="flex flex-col gap-2">
                {[...dados.hoje].reverse().map((p) => {
                  const fp = p.formaPagamento ?? p.forma_pagamento;
                  const info = METODO_INFO[fp] || { icon: '💰', label: fp };
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1A2B4A]/60 px-4 py-3">
                      <span className="text-lg">{info.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white">#{p.id?.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] text-white/40 truncate">{p.cliente?.nome ?? `Cliente #${String(p.clienteId ?? '').slice(-4)}`} · {info.label}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-[#00C4B4]">{formatarReais(p.total ?? p.total_centavos)}</p>
                        <p className="text-[10px] text-white/30">{formatarHora(p.criadoEm ?? p.criado_em)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="h-4" />
        </main>
      )}
    </div>
  );
}
