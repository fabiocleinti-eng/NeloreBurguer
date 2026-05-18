import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNotificacoes,
  marcarTodasLidas,
  marcarLida,
  removerNotificacao,
  limparTodas,
} from '@/utils/notificacoes';

function tempoRelativo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const d    = Math.floor(diff / 86400000);
  if (min < 1)  return 'agora';
  if (min < 60) return `${min} min atrás`;
  if (h < 24)   return `${h}h atrás`;
  return `${d}d atrás`;
}

const ICONE_TIPO = { PEDIDO: '🛵', CUPOM: '🎁', INFO: 'ℹ️' };
const COR_TIPO   = {
  PEDIDO: 'border-l-[#D02727]',
  CUPOM:  'border-l-[#FFA801]',
  INFO:   'border-l-blue-400',
};

export function NotificacoesPanel({ aberto, onFechar, onAtualizar }) {
  const navigate   = useNavigate();
  const panelRef   = useRef(null);
  const [lista, setLista] = useState([]);

  useEffect(() => {
    if (aberto) setLista(getNotificacoes());
  }, [aberto]);

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e) {
      if (aberto && panelRef.current && !panelRef.current.contains(e.target)) onFechar();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [aberto, onFechar]);

  function handleMarcarTodas() {
    marcarTodasLidas();
    setLista(getNotificacoes());
    onAtualizar();
  }

  function handleRemover(id) {
    removerNotificacao(id);
    setLista(getNotificacoes());
    onAtualizar();
  }

  function handleLimpar() {
    limparTodas();
    setLista([]);
    onAtualizar();
  }

  function handleClicarNotificacao(n) {
    marcarLida(n.id);
    setLista(getNotificacoes());
    onAtualizar();
    if (n.pedidoId) {
      navigate(`/loja/pedidos/${n.pedidoId}`);
      onFechar();
    }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} />

      {/* Painel */}
      <div
        ref={panelRef}
        className="relative z-10 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl"
        style={{ animation: 'slideInRight .2s ease' }}
      >
        {/* Header do painel */}
        <div className="flex items-center justify-between bg-[#701515] px-4 py-4">
          <h2 className="text-base font-bold text-white">🔔 Notificações</h2>
          <button type="button" onClick={onFechar} className="text-white/70 hover:text-white text-xl">✕</button>
        </div>

        {/* Ações */}
        {lista.length > 0 && (
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2">
            <button type="button" onClick={handleMarcarTodas}
              className="text-xs text-[#D02727] underline hover:opacity-80">
              Marcar todas como lidas
            </button>
            <button type="button" onClick={handleLimpar}
              className="text-xs text-zinc-400 underline hover:text-zinc-600">
              Limpar tudo
            </button>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {lista.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="text-5xl">🔕</span>
              <p className="text-sm text-zinc-400">Nenhuma notificação por enquanto.</p>
            </div>
          ) : (
            lista.map((n) => (
              <div
                key={n.id}
                className={`flex gap-3 border-b border-zinc-50 border-l-4 px-4 py-3 transition hover:bg-zinc-50 ${COR_TIPO[n.tipo] || 'border-l-zinc-300'} ${!n.lida ? 'bg-orange-50/50' : 'bg-white'}`}
              >
                {/* Ícone */}
                <span className="mt-0.5 text-xl shrink-0">{ICONE_TIPO[n.tipo] || '🔔'}</span>

                {/* Conteúdo */}
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => handleClicarNotificacao(n)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.lida ? 'text-zinc-800' : 'text-zinc-500'}`}>
                      {n.titulo}
                    </p>
                    {!n.lida && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D02727]" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 leading-snug">{n.mensagem}</p>
                  <p className="mt-1 text-[10px] text-zinc-400">{tempoRelativo(n.criadaEm)}</p>
                </button>

                {/* Remover */}
                <button
                  type="button"
                  onClick={() => handleRemover(n.id)}
                  className="shrink-0 self-start text-zinc-300 hover:text-red-400 transition"
                  title="Remover"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
