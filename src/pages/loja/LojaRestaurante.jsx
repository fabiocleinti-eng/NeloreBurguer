import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import fotoCards from '@assets/images/fotoCards.png';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { CATEGORIAS, RESTAURANTES_MOCK } from '@/data/mockCardapio';
import { cardapioApi, restaurantesApi } from '@/services/api';

export default function LojaRestaurante() {
  const { restauranteId } = useParams();
  const navigate = useNavigate();

  const [restaurante, setRestaurante] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      try {
        // Busca info do restaurante
        const { data: dataRest } = await restaurantesApi.buscarPorId(restauranteId);
        if (!cancelado) setRestaurante(dataRest?.data ?? dataRest);

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
        } else {
          setCategorias(CATEGORIAS);
        }
      } catch {
        // Fallback mock
        const mock = RESTAURANTES_MOCK.find((r) => r.id === restauranteId);
        if (!cancelado) {
          setRestaurante(mock || { nome: 'Restaurante', tipo: '' });
          setCategorias(CATEGORIAS);
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregar();
    return () => { cancelado = true; };
  }, [restauranteId]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#701515] to-[#D02727]">

      {/* Header do restaurante */}
      <header className="mx-auto w-full max-w-lg shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/loja')}
            className="text-2xl text-white/80 hover:text-white"
          >
            ‹
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">
              {restaurante?.nome || '…'}
            </h1>
            {restaurante?.tipo && (
              <p className="text-xs text-white/60">{restaurante.tipo}</p>
            )}
          </div>
        </div>
      </header>

      {carregando && (
        <p className="mx-auto w-full max-w-lg shrink-0 px-4 pb-1 text-center text-xs text-white/60">
          Carregando cardápio…
        </p>
      )}

      {/* Categorias */}
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
