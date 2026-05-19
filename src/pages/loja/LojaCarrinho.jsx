import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { useCart } from '@/context/CartContext';
import { pedidosApi } from '@/services/api';

const RESTAURANTE_ID_KEY = 'nelore_restaurante_id';

function getRestauranteId() {
  try {
    return sessionStorage.getItem(RESTAURANTE_ID_KEY) || '00000000-0000-0000-0000-000000000001';
  } catch {
    return '00000000-0000-0000-0000-000000000001';
  }
}

const TAXA_ENTREGA = 500; // centavos (R$ 5,00)

function getLocalizacao() {
  try {
    const display = sessionStorage.getItem('nelore_localizacao') || '';
    const dadosRaw = sessionStorage.getItem('nelore_localizacao_dados');
    const dados = dadosRaw ? JSON.parse(dadosRaw) : null;
    return { display, dados };
  } catch {
    return { display: '', dados: null };
  }
}

function montarEnderecoPayload(dados) {
  if (!dados) return null;
  return {
    rua: dados.rua || '',
    numero: dados.numero || '',
    bairro: dados.bairro || '',
    cidade: dados.cidade || '',
    estado: dados.uf || '',
    cep: dados.cep || '',
  };
}

const FORMAS_PAGAMENTO = [
  { value: 'PIX',             label: 'Pix' },
  { value: 'CARTAO_CREDITO',  label: 'Cartão de crédito' },
  { value: 'CARTAO_DEBITO',   label: 'Cartão de débito' },
  { value: 'DINHEIRO',        label: 'Dinheiro' },
  { value: 'VALE_REFEICAO',   label: 'Vale-refeição' },
];

function reaisParaCentavos(valor) {
  return Math.round(Number(valor) * 100);
}

export default function LojaCarrinho() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [status, setStatus] = useState('idle'); // idle | loading | sucesso | erro
  const [erroMsg, setErroMsg] = useState('');
  const [numeroPedido, setNumeroPedido] = useState(null);

  const { display: enderecoDisplay, dados: enderecoDados } = getLocalizacao();
  const totalComTaxa = total + TAXA_ENTREGA / 100;

  async function handleFinalizarPedido() {
    if (items.length === 0) return;

    setStatus('loading');
    setErroMsg('');

    const payload = {
      restauranteId: getRestauranteId(),
      itens: items.map((it) => ({
        produtoId: String(it.id),
        nomeProduto: it.nome,
        quantidade: it.quantidade || 1,
        precoUnitario: reaisParaCentavos(it.preco),
      })),
      endereco: montarEnderecoPayload(enderecoDados),
      formaPagamento,
      taxaEntrega: TAXA_ENTREGA,
    };

    try {
      const { data } = await pedidosApi.criar(payload);

      const id =
        data?.pedidoId ??
        data?.id ??
        data?.numero ??
        data?.data?.pedidoId ??
        null;

      clearCart();
      setNumeroPedido(id);
      setStatus('sucesso');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.erro ||
        err.response?.data?.error ||
        err.message ||
        'Não foi possível enviar o pedido. Tente novamente.';
      setErroMsg(typeof msg === 'string' ? msg : 'Erro ao finalizar pedido.');
      setStatus('erro');
    }
  }

  /* ── Tela de sucesso ─────────────────────────────────────────── */
  if (status === 'sucesso') {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#2D7A4F] to-[#3CB371]">
        <div className="mx-auto w-full max-w-lg shrink-0">
          <LojaHeader />
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-white">
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center">
            <span className="text-6xl" aria-hidden>✅</span>
            <h2 className="text-2xl font-bold text-zinc-800">Pedido realizado!</h2>
            {numeroPedido && (
              <p className="text-sm text-zinc-500">
                Número do pedido:{' '}
                <span className="font-semibold text-zinc-700">#{numeroPedido}</span>
              </p>
            )}
            <p className="max-w-[260px] text-sm text-zinc-500">
              Seu pedido foi recebido e está sendo preparado. Acompanhe pelo menu{' '}
              <strong>Pedidos</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus('idle');
                navigate('/loja');
              }}
              className="mt-2 w-full max-w-[240px] rounded-2xl bg-[#3CB371] py-3 text-base font-bold text-white transition hover:opacity-90"
            >
              Voltar ao cardápio
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-lg shrink-0">
          <LojaBottomNav />
        </div>
      </div>
    );
  }

  /* ── Tela principal ──────────────────────────────────────────── */
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#2D7A4F] to-[#3CB371]">

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaHeader />
      </div>

      {/* Endereço */}
      <div className="mx-auto w-full max-w-lg shrink-0 px-8 py-3">
        <h2 className="text-2xl font-bold text-white">Endereço</h2>
        {enderecoDisplay ? (
          <p className="mt-1 text-xl font-bold leading-snug text-white">
            {enderecoDisplay}
          </p>
        ) : (
          <p className="mt-1 text-sm text-white/50">
            Localização não definida —{' '}
            <Link to="/login" className="underline text-white/80">
              definir no login
            </Link>
          </p>
        )}
      </div>

      {/* Painel branco com scroll */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-white">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <h3 className="text-xl font-bold text-zinc-800">Carrinho</h3>

          {items.length === 0 ? (
            <p className="mt-8 text-center text-zinc-500">
              Carrinho vazio.{' '}
              <Link to="/loja" className="font-semibold text-[#3CB371] underline">
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
                      onClick={() => updateQuantity(it.id, (it.quantidade || 1) - 1)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold">
                      {it.quantidade || 1}
                    </span>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-lg border border-zinc-300 font-bold"
                      onClick={() => updateQuantity(it.id, (it.quantidade || 1) + 1)}
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

          {items.length > 0 && (
            <div className="mt-6 border-t border-zinc-200 pt-4">

              {/* Resumo de valores */}
              <div className="flex flex-col gap-1 text-sm text-zinc-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de entrega</span>
                  <span>R$ {(TAXA_ENTREGA / 100).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              <p className="mt-2 flex justify-between text-lg font-bold text-zinc-900">
                <span>Total</span>
                <span>R$ {totalComTaxa.toFixed(2).replace('.', ',')}</span>
              </p>

              {/* Forma de pagamento */}
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-zinc-700">
                  Forma de pagamento
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {FORMAS_PAGAMENTO.map((fp) => (
                    <button
                      key={fp.value}
                      type="button"
                      onClick={() => setFormaPagamento(fp.value)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        formaPagamento === fp.value
                          ? 'border-[#3CB371] bg-[#3CB371] text-white'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-[#3CB371]'
                      }`}
                    >
                      {fp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Erro */}
              {status === 'erro' && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {erroMsg}
                </div>
              )}

              <button
                type="button"
                disabled={status === 'loading'}
                onClick={handleFinalizarPedido}
                className="mt-4 w-full rounded-2xl bg-[#3CB371] py-3 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {status === 'loading' ? 'Enviando pedido…' : 'Finalizar pedido'}
              </button>

              {status === 'erro' && (
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-2 w-full rounded-2xl border border-zinc-300 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
                >
                  Tentar novamente
                </button>
              )}
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
