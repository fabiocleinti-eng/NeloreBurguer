import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import imgCarrossel from '@assets/images/imagemCarrossel.png';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { cardapioApi } from '@/services/api';
import { useCart } from '@/context/CartContext';

const MOCK_ITENS = [1, 2, 3, 4].map((n) => ({
  id: `mock-${n}`,
  nome: `Produto ${n}`,
  preco: 32.9,
  imagem: imgCarrossel,
}));

function normalizeItens(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => {
    const precoCentavos =
      p.preco_centavos ?? p.precoCentavos ?? p.price_cents ?? p.preco ?? 0;
    return {
      id: p.id ?? p._id ?? String(Math.random()),
      nome: p.nome ?? p.name ?? p.title ?? '',
      preco: Number(precoCentavos) / 100,
      imagem: p.imagem ?? p.image_url ?? p.foto ?? imgCarrossel,
      descricao: p.descricao ?? p.description ?? '',
    };
  });
}

export default function LojaCategoria() {
  const { id } = useParams();
  const { addItem } = useCart();

  const [itens, setItens] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [usandoMock, setUsandoMock] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function carregarItens() {
      try {
        const { data } = await cardapioApi.itensPorCategoria(id);
        if (cancelado) return;

        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

        if (lista.length > 0) {
          const primeiroTitulo =
            lista[0]?.categoria?.titulo ??
            lista[0]?.categoria?.nome ??
            lista[0]?.categoriaTitulo ??
            '';
          setTitulo(primeiroTitulo);
          setItens(normalizeItens(lista));
        } else {
          setItens(MOCK_ITENS);
          setUsandoMock(true);
        }
      } catch {
        if (!cancelado) {
          setItens(MOCK_ITENS);
          setUsandoMock(true);
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregarItens();
    return () => { cancelado = true; };
  }, [id]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#E8E8E8]">

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaHeader />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4">

        {carregando ? (
          <p className="mt-8 text-center text-sm text-zinc-500">Carregando itens…</p>
        ) : (
          <>
            {titulo && (
              <h1 className="mb-6 text-center text-3xl font-bold">
                {titulo.toUpperCase()}
              </h1>
            )}

            {usandoMock && (
              <p className="mb-4 text-center text-xs text-zinc-400">
                Cardápio demo — aguardando microserviço.
              </p>
            )}

            {itens.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 pt-20">
                <p className="text-lg font-semibold text-zinc-600">
                  Nenhum item nesta categoria.
                </p>
                <Link to="/loja" className="text-[#D02727] underline">
                  Voltar ao cardápio
                </Link>
              </div>
            ) : (
              <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
                {itens.map((p) => (
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
                            categoria: id,
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
            )}
          </>
        )}
      </div>

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaBottomNav />
      </div>

    </div>
  );
}
