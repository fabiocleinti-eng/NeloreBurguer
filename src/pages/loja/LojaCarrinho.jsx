import { Link } from 'react-router-dom';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { useCart } from '@/context/CartContext';

export default function LojaCarrinho() {
  const { items, total, updateQuantity, removeItem } = useCart();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#701515] to-[#D02727]">
      <LojaHeader />

      <div className="mx-auto w-full max-w-md px-8 py-4">
        <h2 className="text-3xl font-bold text-[#FFA801]">Endereço</h2>
        <p className="mt-2 text-2xl font-bold leading-snug text-white">
          Laranjeiras, R. Soares Cabral n°8 / 104
        </p>
      </div>

      <div className="mx-auto flex min-h-[400px] w-full max-w-lg flex-1 flex-col rounded-t-[22px] bg-white px-4 py-6">
        <h3 className="text-xl font-bold text-zinc-800">Carrinho</h3>

        {items.length === 0 ? (
          <p className="mt-8 text-center text-zinc-500">
            Carrinho vazio.{' '}
            <Link to="/loja" className="font-semibold text-[#D02727] underline">
              Ver cardápio
            </Link>
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-zinc-900">{it.nome}</p>
                  <p className="text-sm text-zinc-600">
                    R${' '}
                    {(Number(it.preco) * (it.quantidade || 1))
                      .toFixed(2)
                      .replace('.', ',')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-9 w-9 rounded-lg border border-zinc-300 font-bold"
                    onClick={() =>
                      updateQuantity(it.id, (it.quantidade || 1) - 1)
                    }
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold">
                    {it.quantidade || 1}
                  </span>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-lg border border-zinc-300 font-bold"
                    onClick={() =>
                      updateQuantity(it.id, (it.quantidade || 1) + 1)
                    }
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-sm text-red-600 underline"
                    onClick={() => removeItem(it.id)}
                  >
                    remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 ? (
          <div className="mt-6 border-t border-zinc-200 pt-4">
            <p className="flex justify-between text-lg font-bold text-zinc-900">
              <span>Total</span>
              <span>R$ {total.toFixed(2).replace('.', ',')}</span>
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Checkout real requer login e Gateway (pedidos / pagamentos). Isto é
              apenas visualização do fluxo.
            </p>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 z-10 mt-auto w-full max-w-lg mx-auto">
        <LojaBottomNav />
      </div>
    </div>
  );
}
