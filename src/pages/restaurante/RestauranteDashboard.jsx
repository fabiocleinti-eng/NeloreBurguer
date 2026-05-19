import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearStoredToken, getStoredToken, restaurantesApi } from '@/services/api';

/** Lê o ID do restaurante: sessionStorage → JWT payload */
function resolverRestauranteId() {
  const salvo = sessionStorage.getItem('nelore_restaurante_id');
  if (salvo) return salvo;
  try {
    const token = getStoredToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const id = payload.restauranteId || payload.restaurante_id || payload.id || payload.sub;
    if (id) sessionStorage.setItem('nelore_restaurante_id', id); // salva para próximas telas
    return id || null;
  } catch { return null; }
}

const CARDS = [
  {
    icon: '🏪',
    titulo: 'Perfil',
    descricao: 'Logo, fotos e informações do restaurante',
    rota: '/restaurante/perfil',
    cor: 'border-[#00C4B4] bg-[#00C4B4]/10',
  },
  {
    icon: '🍔',
    titulo: 'Cardápio',
    descricao: 'Gerencie categorias e itens do cardápio',
    rota: '/restaurante/cardapio',
    cor: 'border-[#00C4B4] bg-[#00C4B4]/10',
  },
  {
    icon: '🧑‍🍳',
    titulo: 'Entregadores',
    descricao: 'Cadastre e gerencie seus entregadores',
    rota: '/restaurante/entregadores',
    cor: 'border-[#00C4B4] bg-[#00C4B4]/10',
  },
  {
    icon: '📦',
    titulo: 'Pedidos',
    descricao: 'Em breve',
    rota: null,
    cor: 'border-white/20 bg-white/5 opacity-40',
  },
];

function AvatarRestaurante({ nome, imagem }) {
  const iniciais = nome
    ? nome.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
    : '?';

  return (
    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[#00C4B4]/50 bg-[#1A2B4A] shadow-lg">
      {imagem ? (
        <img src={imagem} alt={nome} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-[#00C4B4]">
          {iniciais}
        </div>
      )}
    </div>
  );
}

export default function RestauranteDashboard() {
  const navigate = useNavigate();
  // Pré-carrega nome do JWT para exibir imediatamente sem esperar a API
  function nomePeloJwt() {
    try {
      const token = getStoredToken();
      if (!token) return null;
      const p = JSON.parse(atob(token.split('.')[1]));
      return p.nome || p.nomeRestaurante || p.name || null;
    } catch { return null; }
  }
  const [restaurante, setRestaurante] = useState(() => {
    const nome = nomePeloJwt();
    return nome ? { nome, imagem: null, tipo: '' } : null;
  });

  useEffect(() => {
    const restauranteId = resolverRestauranteId();
    if (!restauranteId) return;

    restaurantesApi
      .buscarPorId(restauranteId)
      .then(({ data }) => {
        const r = data?.data ?? data;
        setRestaurante({
          nome: r?.nome || r?.name || '',
          imagem: r?.imagem || r?.logo || null,
          tipo: r?.tipo || r?.categoria || '',
        });
      })
      .catch(() => { /* silencioso */ });
  }, []);

  function handleSair() {
    clearStoredToken();
    navigate('/', { replace: true });
  }

  const nomeExibido = restaurante?.nome || 'Restaurante';

  return (
    <div className="flex min-h-screen flex-col bg-[#0F1E34] font-sans">

      {/* Header — PedeFácil */}
      <header className="flex items-center justify-between bg-[#1A2B4A] px-5 py-4 shadow">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            Pede<span className="text-[#00C4B4]">Fácil</span>
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-white/50">Painel do Restaurante</p>
          <button
            type="button"
            onClick={handleSair}
            className="text-xs text-[#00C4B4] underline hover:opacity-80"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-8">

        {/* Card do restaurante */}
        <div className="flex items-center gap-4 rounded-2xl border border-[#00C4B4]/20 bg-[#1A2B4A]/60 px-5 py-4">
          <AvatarRestaurante nome={restaurante?.nome} imagem={restaurante?.imagem} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#00C4B4]/70">
              {restaurante?.tipo || 'Restaurante'}
            </p>
            <h2 className="text-xl font-extrabold leading-tight text-white">{nomeExibido}</h2>
          </div>
        </div>

        {/* Saudação */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Olá, {nomeExibido.split(' ')[0]}! 👋
          </h1>
          <p className="mt-1 text-sm text-white/50">O que deseja gerenciar hoje?</p>
        </div>

        {/* Cards de ação */}
        <div className="mt-2 flex flex-col gap-4">
          {CARDS.map((card) => (
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
                <span className="ml-auto text-xl text-[#00C4B4]">›</span>
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
