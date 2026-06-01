import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { RocketLoader } from '@/components/RocketLoader';
import { restaurantesApi, getStoredToken } from '@/services/api';

const RESTAURANTE_ID_KEY = 'nelore_restaurante_id';

function salvarRestauranteId(id) {
  try { sessionStorage.setItem(RESTAURANTE_ID_KEY, id); } catch { /* ignore */ }
}

function BadgeStatus({ status }) {
  if (!status || status === 'ABERTO') {
    return (
      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[11px] font-semibold text-green-300">
        ● Aberto
      </span>
    );
  }
  return (
    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-semibold text-red-300">
      ● Fechado
    </span>
  );
}

function CardRestaurante({ restaurante, onClick }) {
  const taxa = restaurante.taxaEntrega
    ? `R$ ${(restaurante.taxaEntrega / 100).toFixed(2).replace('.', ',')}`
    : 'Grátis';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.98] text-left"
    >
      {/* Logo do restaurante */}
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#E8E8E8]">
        {restaurante.imagem ? (
          <img src={restaurante.imagem} alt={restaurante.nome} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">🍔</div>
        )}
      </div>

      {/* Infos */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="font-bold text-zinc-800">{restaurante.nome}</p>
          <BadgeStatus status={restaurante.status} />
        </div>
        <p className="text-xs text-zinc-500">{restaurante.tipo}</p>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          {restaurante.avaliacao && (
            <span>⭐ {restaurante.avaliacao}</span>
          )}
          <span>🛵 {taxa}</span>
          {restaurante.tempoEstimado && (
            <span>⏱ {restaurante.tempoEstimado}</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function LojaHome() {
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState([]);
  const [nomeUsuario] = useState(() => {
    try {
      const token = getStoredToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const nome = payload.nome || payload.name || payload.nomeCliente || null;
      return nome ? nome.split(' ')[0] : null;
    } catch { return null; }
  });
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    let cancelado = false;

    // Segurança: após 2s exibe o que tiver (mock já carregado)
    const timeoutSeguranca = setTimeout(() => {
      if (!cancelado) setCarregando(false);
    }, 2000);

    async function carregar() {
      try {
        const { data } = await restaurantesApi.listar();
        if (cancelado) return;
        const lista = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        if (lista.length > 0) {
          setRestaurantes(lista.map((r) => ({
            id: r.id,
            nome: r.nome || r.name || '',
            tipo: r.tipo || r.categoria || r.type || 'Restaurante',
            status: r.status || 'ABERTO',
            taxaEntrega: r.taxaEntrega ?? r.taxa_entrega ?? 500,
            tempoEstimado: r.tempoEstimado || r.tempo_estimado || '',
            avaliacao: r.avaliacao ?? null,
            imagem: r.imagem || r.logo || null,
          })));
        }
      } catch { /* silencioso */ } finally {
        clearTimeout(timeoutSeguranca);
        if (!cancelado) setCarregando(false);
      }
    }
    carregar();
    return () => { cancelado = true; clearTimeout(timeoutSeguranca); };
  }, []);

  function abrirRestaurante(restaurante) {
    salvarRestauranteId(restaurante.id);
    navigate(`/loja/restaurante/${restaurante.id}`);
  }

  const filtrados = restaurantes
    .filter((r) =>
      r.nome.toLowerCase().includes(busca.toLowerCase()) ||
      r.tipo.toLowerCase().includes(busca.toLowerCase())
    )
    .sort((a, b) => {
      const aAberto = a.status === 'ABERTO';
      const bAberto = b.status === 'ABERTO';
      if (aAberto !== bAberto) return aAberto ? -1 : 1;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#2D7A4F] to-[#3CB371]">

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaHeader />
      </div>

      {/* Saudação */}
      {nomeUsuario && (
        <div className="mx-auto w-full max-w-lg shrink-0 px-5 pb-1">
          <p className="text-base font-semibold text-white">Olá, {nomeUsuario}! 👋</p>
        </div>
      )}

      {/* Barra de busca */}
      <div className="mx-auto w-full max-w-lg shrink-0 px-4 pb-3">
        <input
          type="text"
          placeholder="🔍  Buscar restaurante..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full rounded-2xl border-2 border-white/30 bg-white/20 px-4 py-2.5 text-sm text-white placeholder:text-white/60 focus:border-white/60 focus:outline-none"
        />
      </div>

      {/* Lista */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-[#F0F7F1]">
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">

          {carregando ? (
            <RocketLoader mensagem="Buscando restaurantes…" />
          ) : (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {`${filtrados.length} restaurante${filtrados.length !== 1 ? 's' : ''} disponível${filtrados.length !== 1 ? 'is' : ''}`}
              </p>

              {filtrados.length === 0 ? (
                <div className="mt-10 text-center text-zinc-400">
                  <p className="text-4xl">🍽️</p>
                  <p className="mt-2 text-sm">Nenhum restaurante encontrado.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filtrados.map((r) => (
                    <CardRestaurante
                      key={r.id}
                      restaurante={r}
                      onClick={() => abrirRestaurante(r)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaBottomNav />
      </div>
    </div>
  );
}
