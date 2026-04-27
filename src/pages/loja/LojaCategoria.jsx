import { Link, useParams } from 'react-router-dom';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { getCategoria, getProdutos } from '@/data/mockCardapio';
import { useCart } from '@/context/CartContext';

export default function LojaCategoria() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const cat = getCategoria(slug);
  const produtos = getProdutos(slug);

  if (!cat) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#E8E8E8] p-8">
        <p className="text-lg font-semibold">Categoria não encontrada.</p>
        <Link to="/loja" className="mt-4 text-[#D02727] underline">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#E8E8E8]">
      <LojaHeader />

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <h1 className="mb-10 text-center text-3xl font-bold">
          {cat.titulo.toUpperCase()}
        </h1>

        <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
          {produtos.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-[26px] bg-[#D02727] px-2 pb-4 pt-3 shadow-md"
            >
              <div className="flex flex-1 flex-col gap-2">
                <span className="ml-2 text-[22px] font-bold leading-tight text-[#FFA801] sm:text-[26px]">
                  {p.nome}
                </span>
                <img
                  src={p.imagem}
                  alt=""
                  className="h-36 w-full rounded-lg object-cover"
                />
                <p className="text-center text-sm font-semibold text-white">
                  R$ {p.preco.toFixed(2).replace('.', ',')}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    addItem({
                      id: p.id,
                      nome: p.nome,
                      preco: p.preco,
                      categoria: slug,
                    })
                  }
                  className="mt-1 rounded-full bg-[#FFA801] py-2 text-sm font-bold text-[#701515]"
                >
                  Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 bg-[#E8E8E8]">
        <LojaBottomNav />
      </div>
    </div>
  );
}
