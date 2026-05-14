import { useNavigate } from 'react-router-dom';
import logoHome from '@assets/images/logoHome.png';
import fotoCapa from '@assets/images/fotoCapa.png';
import { clearStoredToken } from '@/services/api';

export default function HomePlaceholder() {
  const navigate = useNavigate();

  function handleLogout() {
    clearStoredToken();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#701515] to-[#D02727]">
      <header className="flex items-center justify-between px-6 py-4">
        <img src={logoHome} alt="NeloreBuguer" className="h-10 object-contain" />
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
        >
          Sair
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-16 text-center">
        <img
          src={fotoCapa}
          alt=""
          className="h-[160px] w-[280px] max-w-full object-contain"
        />

        <h1 className="text-3xl font-bold text-[#FFA801]">
          Bem-vindo à Nelore Burguer!
        </h1>
        <p className="max-w-xs text-base text-white/80">
          Escolha o que vai querer hoje.
        </p>

        <div className="mt-4 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate('/loja')}
            className="w-full rounded-2xl bg-[#FFA801] py-4 text-lg font-bold text-[#701515] transition hover:opacity-90"
          >
            Ver cardápio
          </button>

          <button
            type="button"
            onClick={() => navigate('/loja/carrinho')}
            className="w-full rounded-2xl border-2 border-[#FFA801] bg-transparent py-3 text-base font-semibold text-[#FFA801] transition hover:bg-[#FFA801]/10"
          >
            Meu carrinho
          </button>
        </div>
      </main>
    </div>
  );
}
