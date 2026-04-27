import { Link } from 'react-router-dom';
import fotoCards from '@assets/images/fotoCards.png';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { CATEGORIAS } from '@/data/mockCardapio';
export default function LojaHome() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#701515] to-[#D02727]">
      <LojaHeader />

      <div className="mx-auto mb-2 max-w-lg px-4 text-center text-xs text-white/90">
        Área de compras (demo): cardápio local até o Gateway responder em{' '}
        <code className="rounded bg-black/20 px-1">/api/restaurantes</code>.
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col rounded-t-[22px] bg-[#E8E8E8] pb-2">
        <div className="-mt-12 max-h-[min(528px,70vh)] flex-1 overflow-y-auto px-4 pb-24 pt-2">
          {CATEGORIAS.map((cat) => (
            <Link
              key={cat.slug}
              to={`/loja/categoria/${cat.slug}`}
              className="mb-6 block w-full max-w-[336px] rounded-[22px] bg-white pl-5 pr-4 pt-3 pb-5 shadow-sm transition hover:shadow-md"
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

      <div className="sticky bottom-0 z-10 mt-auto w-full max-w-lg mx-auto">
        <LojaBottomNav />
      </div>
    </div>
  );
}
