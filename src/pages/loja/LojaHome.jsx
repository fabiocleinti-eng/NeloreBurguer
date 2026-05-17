import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import fotoCards from '@assets/images/fotoCards.png';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { CATEGORIAS } from '@/data/mockCardapio';
import { restaurantesApi, cardapioApi } from '@/services/api';

const RESTAURANTE_ID_KEY = 'nelore_restaurante_id';

function salvarRestauranteId(id) {
  try { sessionStorage.setItem(RESTAURANTE_ID_KEY, id); } catch { /* ignore */ }
}

function StatusRestaurante({ status }) {
  if (!status || status === 'ABERTO') return null;
  const cor = status === 'FECHADO'
    ? 'bg-yellow-400/20 text-yellow-200'
    : 'bg-red-900/40 text-red-200';
  const texto = status === 'FECHADO' ? '⏰ Restaurante fechado no momento' : '🚫 Restaurante inativo';
  return (
    <div className={`mx-auto w-full max-w-lg shrink-0 px-4 pb-1 text-center text-xs font-semibold ${cor}`}>
      {texto}
    </div>
  );
}

export default function LojaHome() {
  const [categorias, setCategorias] = useState(CATEGORIAS);
  const [statusRestaurante, setStatusRestaurante] = useState(null);
  const [usandoMock, setUsandoMock] = useState(true);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function carregarCardapio() {
      try {
        // 1. Buscar restaurantes
        const { data: dataRest } = await restaurantesApi.listar();
        if (cancelado) return;

        const lista = Array.isArray(dataRest)
          ? dataRest
          : Array.isArray(dataRest?.data)
            ? dataRest.data
            : [];

        if (lista.length === 0) return;

        const restaurante = lista[0];
        const restauranteId = restaurante.id;

        salvarRestauranteId(restauranteId);
        setStatusRestaurante(restaurante.status ?? null);

        // 2. Buscar categorias do restaurante
        const { data: dataCat } = await cardapioApi.categoriasPorRestaurante(restauranteId);
        if (cancelado) return;

        const cats = Array.isArray(dataCat)
          ? dataCat
          : Array.isArray(dataCat?.data)
            ? dataCat.data
            : [];

        if (cats.length === 0) return;

        setCategorias(cats.map((cat) => ({
          id: cat.id,
          titulo: cat.titulo || cat.nome || cat.title || '',
          destaque: cat.destaque || '',
          descricao: cat.descricao || '',
        })));
        setUsandoMock(false);

      } catch {
        // fallback silencioso para mock
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregarCardapio();
    return () => { cancelado = true; };
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#701515] to-[#D02727]">

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaHeader />
      </div>

      <StatusRestaurante status={statusRestaurante} />

      {(usandoMock && !carregando) && (
        <div className="mx-auto w-full max-w-lg shrink-0 px-4 pb-1 text-center text-xs text-white/60">
          Cardápio demo — aguardando microserviço.
        </div>
      )}
      {carregando && (
        <div className="mx-auto w-full max-w-lg shrink-0 px-4 pb-1 text-center text-xs text-white/60">
          Carregando cardápio…
        </div>
      )}

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-[#E8E8E8]">
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
          {categorias.map((cat) => (
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
              <p className="ml-3 mt-1 max-w-[210px] text-xs text-[#FFA801]">
                {cat.descricao}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaBottomNav />
      </div>

    </div>
  );
}
