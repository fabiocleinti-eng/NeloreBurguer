import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import fotoCards from '@assets/images/fotoCards.png';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { CATEGORIAS } from '@/data/mockCardapio';
import { restaurantesApi } from '@/services/api';

function normalizarCategorias(data) {
  if (!data) return null;
  const lista = Array.isArray(data)
    ? data
    : Array.isArray(data.categorias)
      ? data.categorias
      : Array.isArray(data.data)
        ? data.data
        : null;
  if (!lista || lista.length === 0) return null;
  return lista.map((cat) => ({
    slug: cat.slug || cat.id || String(cat.nome).toLowerCase().replace(/\s+/g, '-'),
    titulo: cat.nome || cat.titulo || cat.title || '',
    destaque: cat.destaque || cat.highlight || '',
    descricao: cat.descricao || cat.description || '',
  }));
}

export default function LojaHome() {
  const [categorias, setCategorias] = useState(CATEGORIAS);
  const [usandoMock, setUsandoMock] = useState(true);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    restaurantesApi.listar()
      .then(({ data }) => {
        if (cancelado) return;
        const normalizadas = normalizarCategorias(data);
        if (normalizadas) {
          setCategorias(normalizadas);
          setUsandoMock(false);
        }
      })
      .catch(() => { /* fallback silencioso para mock */ })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => { cancelado = true; };
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#701515] to-[#D02727]">

      {/* Header */}
      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaHeader />
      </div>

      {/* Banner demo/loading */}
      {(usandoMock && !carregando) && (
        <div className="mx-auto w-full max-w-lg shrink-0 px-4 pb-1 text-center text-xs text-white/60">
          Cardápio demo — aguardando microserviço em{' '}
          <code className="rounded bg-black/20 px-1">/api/restaurantes</code>.
        </div>
      )}
      {carregando && (
        <div className="mx-auto w-full max-w-lg shrink-0 px-4 pb-1 text-center text-xs text-white/60">
          Carregando cardápio…
        </div>
      )}

      {/* Painel branco — ocupa todo o espaço restante entre header e bottom nav */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-[#E8E8E8]">
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
          {categorias.map((cat) => (
            <Link
              key={cat.slug}
              to={`/loja/categoria/${cat.slug}`}
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

      {/* Bottom nav — sempre fixo no fundo */}
      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaBottomNav />
      </div>

    </div>
  );
}
