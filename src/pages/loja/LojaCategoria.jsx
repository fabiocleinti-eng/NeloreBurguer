import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import imgCarrossel from '@assets/images/imagemCarrossel.png';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { RocketLoader } from '@/components/common/RocketLoader';
import { cardapioApi } from '@/services/api';
import { useCart } from '@/context/CartContext';

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
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [itens, setItens] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [adicionados, setAdicionados] = useState({});

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
        }
      } catch { /* silencioso — lista permanece vazia */ } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregarItens();
    return () => { cancelado = true; };
  }, [id]);

  function handleAdicionar(p) {
    addItem({ id: p.id, nome: p.nome, preco: p.preco, categoria: id });
    setAdicionados((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => setAdicionados((prev) => ({ ...prev, [p.id]: false })), 1200);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#2D7A4F] to-[#3CB371]">

      {/* Header */}
      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaHeader />
      </div>

      {/* Título da categoria na faixa verde */}
      <div className="mx-auto w-full max-w-lg shrink-0 px-4 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-2xl text-white/80 hover:text-white"
          >
            ‹
          </button>
          {titulo && (
            <h1 className="text-lg font-bold text-white">{titulo}</h1>
          )}
        </div>
      </div>

      {/* Conteúdo branco */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-[#F0F7F1]">
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4">

          {carregando ? (
            <RocketLoader mensagem="Carregando itens…" />
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 pt-20">
              <p className="text-lg font-semibold text-zinc-600">Nenhum item nesta categoria.</p>
              <Link to="/loja" className="text-[#3CB371] underline">Voltar ao cardápio</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {itens.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col rounded-2xl bg-white shadow-sm overflow-hidden transition hover:shadow-md"
                >
                  {/* Imagem */}
                  <div className="relative h-32 w-full bg-[#E8F5E9]">
                    <img
                      src={p.imagem}
                      alt={p.nome}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <p className="text-sm font-bold text-zinc-800 leading-tight">{p.nome}</p>
                    {p.descricao && (
                      <p className="text-xs text-zinc-400 leading-snug line-clamp-2">{p.descricao}</p>
                    )}
                    <p className="text-sm font-semibold text-[#2D7A4F]">
                      R$ {p.preco.toFixed(2).replace('.', ',')}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAdicionar(p)}
                      className={`mt-auto w-full rounded-xl py-2 text-sm font-bold transition-colors ${
                        adicionados[p.id]
                          ? 'bg-[#2D7A4F] text-white btn-pop'
                          : 'bg-[#3CB371] text-white hover:opacity-90'
                      }`}
                    >
                      {adicionados[p.id] ? '✓ Adicionado' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaBottomNav />
      </div>
    </div>
  );
}
