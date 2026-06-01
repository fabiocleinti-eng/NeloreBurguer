import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificacoesPanel } from './NotificacoesPanel';
import { totalNaoLidas, carregarNotificacoesDemo } from '@/utils/notificacoes';
import { isOwnerPreviewActive, deactivateOwnerPreview } from '@/utils/previewAccess';

function getEnderecoDisplay() {
  try { return sessionStorage.getItem('nelore_localizacao') || ''; } catch { return ''; }
}

export function LojaHeader() {
  const navigate = useNavigate();
  const [painelAberto, setPainelAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [modoPreview] = useState(isOwnerPreviewActive);

  const atualizarContador = useCallback(() => {
    setNaoLidas(totalNaoLidas());
  }, []);

  useEffect(() => {
    carregarNotificacoesDemo();
    atualizarContador();
  }, [atualizarContador]);

  const endereco = getEnderecoDisplay();

  return (
    <>
      {/* ── Banner "Você está em modo preview" ── */}
      {modoPreview && (
        <div className="w-full bg-amber-400 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm shrink-0">👁️</span>
            <span className="text-xs font-semibold text-amber-900 truncate">
              Visualizando como cliente
            </span>
          </div>
          <button
            type="button"
            onClick={() => { deactivateOwnerPreview(); navigate('/restaurante/dashboard'); }}
            className="shrink-0 rounded-xl bg-amber-900 px-3 py-1 text-xs font-bold text-amber-100 hover:opacity-90 transition whitespace-nowrap"
          >
            ← Voltar ao painel
          </button>
        </div>
      )}

      <header className="flex w-full max-w-lg items-center justify-between px-4 pt-3 pb-3 gap-3">

        {/* Logo + nome */}
        <button type="button" onClick={() => navigate('/loja')} className="flex items-center gap-2 shrink-0">
          <span className="text-3xl leading-none">🚀</span>
          <span className="text-base font-extrabold tracking-tight text-white">Pede<span className="text-[#a8f0e0]">Fácil</span></span>
        </button>

        {/* Endereço */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex flex-1 items-center justify-between rounded-[20px] border-2 border-white/40 bg-white/20 px-3 py-1.5 min-w-0"
        >
          <span className="text-white text-sm shrink-0">📍</span>
          <span className="mx-2 flex-1 truncate text-center text-[10px] leading-tight text-white">
            {endereco || 'Definir localização'}
          </span>
          <span className="text-white text-sm shrink-0">✎</span>
        </button>

        {/* Sino com badge */}
        <button
          type="button"
          onClick={() => { setPainelAberto(true); atualizarContador(); }}
          className="relative shrink-0"
          aria-label="Notificações"
        >
          <span className="text-2xl">🔔</span>
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#2D7A4F]">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </button>
      </header>

      {/* Painel de notificações */}
      <NotificacoesPanel
        aberto={painelAberto}
        onFechar={() => { setPainelAberto(false); atualizarContador(); }}
        onAtualizar={atualizarContador}
      />
    </>
  );
}
