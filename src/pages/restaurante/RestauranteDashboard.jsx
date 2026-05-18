import { useNavigate } from 'react-router-dom';
import fotoCapa from '@assets/images/fotoCapa.png';
import { clearStoredToken } from '@/services/api';

const cards = [
  {
    icon: '🧑‍🍳',
    titulo: 'Entregadores',
    descricao: 'Cadastre e gerencie seus entregadores',
    rota: '/restaurante/entregadores',
    cor: 'border-[#FFA801] bg-[#FFA801]/10',
  },
  {
    icon: '🍔',
    titulo: 'Cardápio',
    descricao: 'Gerencie categorias e itens do cardápio',
    rota: '/restaurante/cardapio',
    cor: 'border-[#FFA801] bg-[#FFA801]/10',
  },
  {
    icon: '📦',
    titulo: 'Pedidos',
    descricao: 'Em breve',
    rota: null,
    cor: 'border-white/20 bg-white/5 opacity-40',
  },
];

export default function RestauranteDashboard() {
  const navigate = useNavigate();

  function handleSair() {
    clearStoredToken();
    navigate('/', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#636363] font-sans text-[#FFA801]">

      {/* Header */}
      <header className="flex items-center justify-between bg-[#701515] px-5 py-4 shadow">
        <img src={fotoCapa} alt="NeloreBurguer" className="h-10 w-auto object-contain" />
        <div className="text-right">
          <p className="text-xs font-semibold text-white/70">Painel do Restaurante</p>
          <button
            type="button"
            onClick={handleSair}
            className="text-xs text-[#FFA801] underline hover:opacity-80"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-bold text-white">Olá! 👋</h1>
        <p className="text-sm text-white/60">O que deseja gerenciar hoje?</p>

        <div className="mt-4 flex flex-col gap-4">
          {cards.map((card) => (
            <button
              key={card.titulo}
              type="button"
              disabled={!card.rota}
              onClick={() => card.rota && navigate(card.rota)}
              className={`flex items-center gap-5 rounded-2xl border-2 px-6 py-5 text-left transition active:scale-95 ${card.cor} ${card.rota ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed'}`}
            >
              <span className="text-4xl">{card.icon}</span>
              <div>
                <p className="text-lg font-bold text-white">{card.titulo}</p>
                <p className="text-xs text-white/60">{card.descricao}</p>
              </div>
              {card.rota && (
                <span className="ml-auto text-[#FFA801] text-xl">›</span>
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
