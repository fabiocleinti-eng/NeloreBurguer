import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoPequena from '@assets/images/logoPequena.png';
import { NotificacoesPanel } from './NotificacoesPanel';
import { totalNaoLidas, carregarNotificacoesDemo } from '@/utils/notificacoes';

function getEnderecoDisplay() {
  try { return sessionStorage.getItem('nelore_localizacao') || ''; } catch { return ''; }
}

export function LojaHeader() {
  const navigate = useNavigate();
  const [painelAberto, setPainelAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);

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
      <header className="flex w-full max-w-lg items-center justify-between px-4 pt-3 pb-3 gap-3">

        {/* Logo + nome */}
        <button type="button" onClick={() => navigate('/loja')} className="flex items-center gap-2 shrink-0">
          <img src={logoPequena} alt="PedeFácil" className="h-9 w-9 object-contain" />
          <span className="text-base font-extrabold tracking-tight text-[#FFA801]">PedeFácil</span>
        </button>

        {/* Endereço */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex flex-1 items-center justify-between rounded-[20px] border-2 border-[#FFA801] bg-[#FF0000]/60 px-3 py-1.5 min-w-0"
        >
          <span className="text-[#FFA801] text-sm shrink-0">📍</span>
          <span className="mx-2 flex-1 truncate text-center text-[10px] leading-tight text-[#FFA801]">
            {endereco || 'Definir localização'}
          </span>
          <span className="text-[#FFA801] text-sm shrink-0">✎</span>
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
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D02727] text-[9px] font-bold text-white">
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
