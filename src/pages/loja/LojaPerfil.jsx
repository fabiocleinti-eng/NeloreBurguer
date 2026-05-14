import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { clearStoredToken, getStoredToken } from '@/services/api';

function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

const ENDERECO = 'Laranjeiras, R. Soares Cabral n°8 / 104';

export default function LojaPerfil() {
  const navigate = useNavigate();

  const usuario = useMemo(() => {
    const token = getStoredToken();
    if (!token) return null;
    return decodeToken(token);
  }, []);

  function handleLogout() {
    clearStoredToken();
    navigate('/login', { replace: true });
  }

  const nome = usuario?.nome ?? usuario?.name ?? usuario?.sub ?? 'Usuário';
  const email = usuario?.email ?? '';
  const initials = nome
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#701515] to-[#D02727]">

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaHeader />
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-white">
        <div className="flex-1 overflow-y-auto px-4 py-6">

          {/* Avatar + nome */}
          <div className="flex flex-col items-center gap-3 pb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D02727] text-2xl font-bold text-white">
              {initials || '👤'}
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-zinc-800">{nome}</p>
              {email && (
                <p className="mt-0.5 text-sm text-zinc-500">{email}</p>
              )}
            </div>
          </div>

          <hr className="border-zinc-100" />

          {/* Informações */}
          <div className="mt-5 flex flex-col gap-3">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Endereço de entrega
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-700">{ENDERECO}</p>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Conta
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {email || 'Sem e-mail disponível'}
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              disabled
              title="Disponível em breve"
              className="w-full rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-400 cursor-not-allowed"
            >
              Editar perfil (em breve)
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-2xl bg-[#D02727] py-3 text-base font-bold text-white transition hover:opacity-90"
            >
              Sair da conta
            </button>
          </div>

        </div>
      </div>

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaBottomNav />
      </div>

    </div>
  );
}
