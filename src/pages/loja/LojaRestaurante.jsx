import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import fotoCards from '@assets/images/fotoCards.png';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { RocketLoader } from '@/components/common/RocketLoader';
import { cardapioApi, restaurantesApi } from '@/services/api';

export default function LojaRestaurante() {
  const { restauranteId } = useParams();
  const navigate = useNavigate();

  const [restaurante, setRestaurante] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    // Segurança: após 2s exibe o que tiver (mock já carregado)
    const timeoutSeguranca = setTimeout(() => {
      if (!cancelado) setCarregando(false);
    }, 2000);

    async function carregar() {
      try {
        // Busca info do restaurante
        const { data: dataRest } = await restaurantesApi.buscarPorId(restauranteId);
        const rest = dataRest?.data ?? dataRest;
        if (!cancelado) {
          setRestaurante(rest);
          try { sessionStorage.setItem('nelore_restaurante_status', rest?.status || 'ABERTO'); } catch { /* ignore */ }
        }

        // Busca categorias
        const { data: dataCat } = await cardapioApi.categoriasPorRestaurante(restauranteId);
        if (cancelado) return;
        const cats = Array.isArray(dataCat) ? dataCat : Array.isArray(dataCat?.data) ? dataCat.data : [];
        if (cats.length > 0) {
          setCategorias(cats.map((cat) => ({
            id: cat.id,
            titulo: cat.titulo || cat.nome || '',
            destaque: cat.destaque || '',
            descricao: cat.descricao || '',
          })));
        }
      } catch { /* silencioso */ } finally {
        clearTimeout(timeoutSeguranca);
        if (!cancelado) setCarregando(false);
      }
    }
    carregar();
    return () => { cancelado = true; clearTimeout(timeoutSeguranca); };
  }, [restauranteId]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#2D7A4F] to-[#3CB371]">

      {/* Header + capa */}
      <div className="mx-auto w-full max-w-lg shrink-0">
        {restaurante?.capa ? (
          /* ── COM capa: layout de sobreposição moderno ── */
          <div className="relative">
            {/* Foto de capa */}
            <div className="h-36 w-full overflow-hidden">
              <img src={restaurante.capa} alt="Capa" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
            </div>

            {/* Botão voltar flutuando sobre a capa */}
            <button
              type="button"
              onClick={() => navigate('/loja')}
              className="absolute top-3 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-xl text-white backdrop-blur-sm hover:bg-black/60 transition"
            >
              ‹
            </button>

            {/* Status badge */}
            {restaurante?.status && (
              <div className={`absolute top-3 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
                restaurante.status === 'ABERTO'
                  ? 'bg-green-500/80 text-white'
                  : 'bg-red-500/80 text-white'
              }`}>
                {restaurante.status === 'ABERTO' ? '● Aberto' : '● Fechado'}
              </div>
            )}

            {/* Logo sobreposta na borda inferior da capa */}
            <div className="absolute -bottom-5 left-4">
              <div className="h-14 w-14 overflow-hidden rounded-xl border-[3px] border-white shadow-lg bg-white">
                {restaurante?.imagem
                  ? <img src={restaurante.imagem} alt={restaurante.nome} className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-2xl bg-[#E8E8E8]">🍔</div>
                }
              </div>
            </div>
          </div>
        ) : (
          /* ── SEM capa: header simples ── */
          <header className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => navigate('/loja')} className="text-2xl text-white/80 hover:text-white">‹</button>
              {restaurante?.imagem && (
                <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/30">
                  <img src={restaurante.imagem} alt={restaurante.nome} className="h-full w-full object-cover" />
                </div>
              )}
              <div>
                <h1 className="text-base font-bold text-white">{restaurante?.nome || '…'}</h1>
                {restaurante?.tipo && <p className="text-xs text-white/60">{restaurante.tipo}</p>}
              </div>
            </div>
          </header>
        )}

        {/* Info do restaurante (abaixo da capa) */}
        {restaurante?.capa && (
          <div className="pt-6 pb-1 px-4">
            <h1 className="text-sm font-bold text-white leading-tight">{restaurante?.nome || '…'}</h1>
            {restaurante?.tipo && <p className="text-xs text-white/60">{restaurante.tipo}</p>}
            {restaurante?.descricao && (
              <p className="text-xs text-white/70 leading-snug line-clamp-1">{restaurante.descricao}</p>
            )}
          </div>
        )}
      </div>

      {/* Categorias */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-[#F0F7F1]">
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
          {restaurante?.status === 'FECHADO' && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <span className="text-xl">🔴</span>
              <div>
                <p className="text-sm font-bold text-red-700">Restaurante fechado</p>
                <p className="text-xs text-red-500">Não é possível fazer pedidos no momento.</p>
              </div>
            </div>
          )}

          {carregando ? (
            <RocketLoader mensagem="Carregando cardápio…" />
          ) : (
            categorias.map((cat) => (
              restaurante?.status === 'FECHADO' ? (
                <div
                  key={cat.id ?? cat.slug}
                  className="mx-auto mb-6 block w-full max-w-[336px] rounded-[22px] bg-white pl-5 pr-4 pt-3 pb-5 shadow-sm opacity-50 cursor-not-allowed"
                >
                  <h2 className="text-[30px] font-bold leading-tight">{cat.titulo}</h2>
                  <img src={fotoCards} alt="" className="mx-auto mt-12 mb-4 block h-[101px] w-[270px] rounded-[15px] object-cover" />
                  <p className="ml-3 text-[17px] font-bold">{cat.destaque}</p>
                  <p className="ml-3 mt-1 max-w-[210px] text-xs text-[#3CB371]">{cat.descricao}</p>
                </div>
              ) : (
              <Link
                key={cat.id ?? cat.slug}
                to={`/loja/categoria/${cat.id ?? cat.slug}`}
                className="mx-auto mb-6 block w-full max-w-[336px] rounded-[22px] bg-white pl-5 pr-4 pt-3 pb-5 shadow-sm transition hover:shadow-md"
              >
                <h2 className="text-[30px] font-bold leading-tight">{cat.titulo}</h2>
                <img
                  src={fotoCards}
                  alt=""
                  className="mx-auto mt-12 mb-4 block h-[101px] w-[270px] rounded-[15px] object-cover"
                />
                <p className="ml-3 text-[17px] font-bold">{cat.destaque}</p>
                <p className="ml-3 mt-1 max-w-[210px] text-xs text-[#3CB371]">
                  {cat.descricao}
                </p>
              </Link>
              )
            ))
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaBottomNav />
      </div>
    </div>
  );
}
