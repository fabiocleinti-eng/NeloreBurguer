import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearStoredToken, getStoredToken, restaurantesApi, restaurantePedidosApi } from '@/services/api';
import { activatePreviewSession, activateOwnerPreview } from '@/utils/previewAccess';

function resolverRestauranteId() {
  const salvo = sessionStorage.getItem('nelore_restaurante_id');
  if (salvo) return salvo;
  try {
    const token = getStoredToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const id = payload.restauranteId || payload.restaurante_id || payload.id || payload.sub;
    if (id) sessionStorage.setItem('nelore_restaurante_id', id);
    return id || null;
  } catch { return null; }
}

const CARDS = [
  { icon: '🏪', titulo: 'Perfil',        descricao: 'Logo, fotos e informações do restaurante', rota: '/restaurante/perfil' },
  { icon: '🍔', titulo: 'Cardápio',       descricao: 'Gerencie categorias e itens do cardápio',   rota: '/restaurante/cardapio' },
  { icon: '📦', titulo: 'Pedidos',        descricao: 'Acompanhe e gerencie os pedidos recebidos', rota: '/restaurante/pedidos' },
  { icon: '💰', titulo: 'Financeiro',     descricao: 'Vendas do dia e entradas por pagamento',    rota: '/restaurante/financeiro' },
  { icon: '🧑‍🍳', titulo: 'Entregadores',  descricao: 'Cadastre e gerencie seus entregadores',     rota: '/restaurante/entregadores' },
  { icon: '⭐', titulo: 'Avaliações',     descricao: 'Veja o feedback dos seus clientes',         rota: '/restaurante/avaliacoes' },
];

function AvatarRestaurante({ nome, imagem }) {
  const iniciais = nome ? nome.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') : '?';
  return (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-[#00C4B4]/50 bg-[#1A2B4A] shadow-lg">
      {imagem
        ? <img src={imagem} alt={nome} className="h-full w-full object-cover" />
        : <div className="flex h-full w-full items-center justify-center text-xl font-extrabold text-[#00C4B4]">{iniciais}</div>
      }
    </div>
  );
}

// ─── Toggle Aberto / Fechado ──────────────────────────────────────────────────
function StatusToggle({ status, onChange, salvando }) {
  const aberto = status === 'ABERTO';
  return (
    <button
      type="button"
      disabled={salvando}
      onClick={() => onChange(aberto ? 'FECHADO' : 'ABERTO')}
      className={`flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-xs font-bold transition
        ${aberto
          ? 'border-green-500/50 bg-green-500/15 text-green-300 hover:bg-green-500/25'
          : 'border-red-500/50 bg-red-500/15 text-red-300 hover:bg-red-500/25'}
        ${salvando ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
    >
      <span className={`h-2 w-2 rounded-full ${aberto ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      {salvando ? 'Salvando…' : aberto ? 'Aberto' : 'Fechado'}
    </button>
  );
}

export default function RestauranteDashboard() {
  const navigate = useNavigate();

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
    return nome ? { nome, imagem: null, tipo: '', status: 'ABERTO' } : null;
  });
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const [qtdNovos, setQtdNovos] = useState(0);
  const [piscando, setPiscando] = useState(false);
  const qtdNovosRef = useRef(-1);

  function tocarSom() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 180, 360].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay / 1000);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.2);
        osc.start(ctx.currentTime + delay / 1000);
        osc.stop(ctx.currentTime + delay / 1000 + 0.25);
      });
    } catch { /* sem suporte */ }
  }

  useEffect(() => {
    const restauranteId = resolverRestauranteId();
    if (!restauranteId) return;
    restaurantesApi.buscarPorId(restauranteId)
      .then(({ data }) => {
        const r = data?.data ?? data;
        setRestaurante({
          nome:   r?.nome   || r?.name     || '',
          imagem: r?.imagem || r?.logo     || null,
          tipo:   r?.tipo   || r?.categoria || '',
          status: r?.status || 'ABERTO',
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const rid = resolverRestauranteId();
    if (!rid) return;

    async function verificarNovos() {
      try {
        const { data } = await restaurantePedidosApi.listar(rid);
        const lista = Array.isArray(data) ? data : data?.data ?? [];
        const novos = lista.filter(p => p.status === 'AGUARDANDO_CONFIRMACAO').length;
        setQtdNovos(novos);

        if (qtdNovosRef.current >= 0 && novos > qtdNovosRef.current) {
          setPiscando(true);
          tocarSom();
        }
        if (novos === 0) setPiscando(false);
        qtdNovosRef.current = novos;
      } catch { /* silencioso */ }
    }

    verificarNovos();
    const interval = setInterval(verificarNovos, 12_000);
    return () => clearInterval(interval);
  }, []);

  async function handleToggleStatus(novoStatus) {
    const restauranteId = resolverRestauranteId();
    if (!restauranteId) return;
    setSalvandoStatus(true);
    try {
      await restaurantesApi.atualizar?.(restauranteId, { status: novoStatus });
      setRestaurante((r) => ({ ...r, status: novoStatus }));
    } finally {
      setSalvandoStatus(false);
    }
  }

  function handleVerLoja() {
    const id = resolverRestauranteId();
    activatePreviewSession();
    activateOwnerPreview();
    navigate(`/loja/restaurante/${id || ''}`);
  }

  function handleSair() {
    clearStoredToken();
    navigate('/', { replace: true });
  }

  const nomeExibido = restaurante?.nome || 'Restaurante';

  return (
    <div className="flex min-h-screen flex-col bg-[#0F1E34] font-sans">

      {/* Header */}
      <header className="flex items-center justify-between bg-[#1A2B4A] px-5 py-4 shadow">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            Pede<span className="text-[#00C4B4]">Fácil</span>
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-white/50">Painel do Restaurante</p>
          <button type="button" onClick={handleSair} className="text-xs text-[#00C4B4] underline hover:opacity-80">Sair</button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">

        {/* Card do restaurante + toggle de status */}
        <div className="flex items-center gap-4 rounded-2xl border border-[#00C4B4]/20 bg-[#1A2B4A]/60 px-5 py-4">
          <AvatarRestaurante nome={restaurante?.nome} imagem={restaurante?.imagem} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#00C4B4]/70 truncate">
              {restaurante?.tipo || 'Restaurante'}
            </p>
            <h2 className="text-lg font-extrabold leading-tight text-white truncate">{nomeExibido}</h2>
          </div>
          {/* Toggle ABERTO / FECHADO */}
          <StatusToggle
            status={restaurante?.status || 'ABERTO'}
            onChange={handleToggleStatus}
            salvando={salvandoStatus}
          />
        </div>

        {/* Saudação */}
        <div>
          <h1 className="text-2xl font-bold text-white">Olá, {nomeExibido.split(' ')[0]}! 👋</h1>
          <p className="mt-1 text-sm text-white/50">O que deseja gerenciar hoje?</p>
        </div>

        {/* Cards de navegação */}
        <div className="flex flex-col gap-3">
          {CARDS.map((card) => {
            const isPedidos = card.titulo === 'Pedidos';
            const temNovos = isPedidos && qtdNovos > 0;
            return (
              <button
                key={card.titulo}
                type="button"
                onClick={() => { if (isPedidos) setPiscando(false); navigate(card.rota); }}
                className={`flex items-center gap-5 rounded-2xl border-2 px-6 py-4 text-left transition active:scale-95
                  ${temNovos && piscando
                    ? 'border-amber-400 bg-amber-400/20 animate-pulse shadow-[0_0_18px_rgba(251,191,36,0.4)]'
                    : temNovos
                      ? 'border-amber-400/70 bg-amber-400/10'
                      : 'border-[#00C4B4] bg-[#00C4B4]/10 hover:opacity-90'
                  }`}
              >
                <span className="text-3xl">{card.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-white">{card.titulo}</p>
                    {temNovos && (
                      <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-extrabold text-[#0F1E34]">
                        {qtdNovos} novo{qtdNovos > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60">
                    {temNovos ? `${qtdNovos} pedido${qtdNovos > 1 ? 's' : ''} aguardando confirmação!` : card.descricao}
                  </p>
                </div>
                <span className={`ml-auto text-xl ${temNovos ? 'text-amber-400' : 'text-[#00C4B4]'}`}>›</span>
              </button>
            );
          })}

          {/* Ver minha loja */}
          <button
            type="button"
            onClick={handleVerLoja}
            className="flex items-center gap-5 rounded-2xl border-2 border-amber-400/40 bg-amber-400/10 px-6 py-4 text-left transition hover:opacity-90 active:scale-95"
          >
            <span className="text-3xl">👁️</span>
            <div>
              <p className="text-base font-bold text-white">Ver minha loja</p>
              <p className="text-xs text-white/60">Veja como o cliente enxerga seu restaurante</p>
            </div>
            <span className="ml-auto text-xl text-amber-400">›</span>
          </button>
        </div>
      </main>
    </div>
  );
}
