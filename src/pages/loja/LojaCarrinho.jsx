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

function getRestauranteStatus() {
  try { return sessionStorage.getItem('nelore_restaurante_status') || 'ABERTO'; } catch { return 'ABERTO'; }
}

const TAXA_ENTREGA = 500; // centavos (R$ 5,00)

function getLocalizacao() {
  try {
    const display  = sessionStorage.getItem('nelore_localizacao') || '';
    const dadosRaw = sessionStorage.getItem('nelore_localizacao_dados');
    const dados    = dadosRaw ? JSON.parse(dadosRaw) : null;
    return { display, dados };
  } catch {
    return { display: '', dados: null };
  }
}

function montarEnderecoPayload(dados) {
  if (!dados) return { rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' };
  return { rua: dados.rua || '', numero: dados.numero || '', bairro: dados.bairro || '', cidade: dados.cidade || '', estado: dados.uf || '', cep: dados.cep || '' };
}

function reaisParaCentavos(valor) {
  return Math.round(Number(valor) * 100);
}

function formatarReais(centavos) {
  return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;
}

// ─── Componente de formulário de cartão ───────────────────────────────────────
function FormCartao({ dados, onChange }) {
  function mask(val, tipo) {
    const d = val.replace(/\D/g, '');
    if (tipo === 'numero')   return d.slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    if (tipo === 'validade') return d.slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');
    if (tipo === 'cvv')      return d.slice(0, 4);
    return val;
  }
  const inp = 'h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm focus:border-[#3CB371] focus:outline-none';
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Dados do cartão</p>
      <input
        placeholder="Número do cartão"
        value={dados.numero}
        maxLength={19}
        onChange={(e) => onChange({ ...dados, numero: mask(e.target.value, 'numero') })}
        className={inp}
      />
      <input
        placeholder="Nome no cartão"
        value={dados.nome}
        onChange={(e) => onChange({ ...dados, nome: e.target.value.toUpperCase() })}
        className={inp}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Validade MM/AA"
          value={dados.validade}
          maxLength={5}
          onChange={(e) => onChange({ ...dados, validade: mask(e.target.value, 'validade') })}
          className={inp}
        />
        <input
          placeholder="CVV"
          value={dados.cvv}
          maxLength={4}
          onChange={(e) => onChange({ ...dados, cvv: mask(e.target.value, 'cvv') })}
          className={inp}
        />
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function LojaCarrinho() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  // onde pagar: 'online' | 'local'
  const [localPagamento, setLocalPagamento] = useState('local');

  // método dentro de cada grupo
  // online: 'PIX' | 'CARTAO_CREDITO'
  // local:  'DINHEIRO' | 'MAQUININHA_CREDITO' | 'MAQUININHA_DEBITO' | 'VALE_REFEICAO'
  const [metodo, setMetodo] = useState('DINHEIRO');

  // valor informado pelo cliente para troco (em reais, string p/ input)
  const [notaInput, setNotaInput] = useState('');

  // dados do cartão (online)
  const [cartao, setCartao] = useState({ numero: '', nome: '', validade: '', cvv: '' });

  const [status,      setStatus]      = useState('idle'); // idle | loading | sucesso | erro
  const [erroMsg,     setErroMsg]     = useState('');
  const [numeroPedido,setNumeroPedido]= useState(null);
  const [trocoFinal,  setTrocoFinal]  = useState(null);
  const [notaFinal,   setNotaFinal]   = useState(0);

  const { display: enderecoDisplay, dados: enderecoDados } = getLocalizacao();
  const restauranteFechado = getRestauranteStatus() === 'FECHADO';
  const totalCentavos   = reaisParaCentavos(total);
  const totalComTaxa    = totalCentavos + TAXA_ENTREGA;           // centavos
  const totalComTaxaR   = totalComTaxa / 100;                     // reais (display)

  const notaSelecionada  = notaInput !== '' ? parseFloat(notaInput.replace(',', '.')) : null;
  const notaCentavos     = notaSelecionada != null && !isNaN(notaSelecionada) ? Math.round(notaSelecionada * 100) : 0;
  const trocoCentavos    = metodo === 'DINHEIRO' && notaCentavos > 0
    ? notaCentavos - totalComTaxa
    : null;

  // Qual método está efetivamente ativo
  const formaPagamentoFinal = metodo;

  // Validação antes de finalizar
  function validarPagamento() {
    if (metodo === 'DINHEIRO') {
      if (!notaInput.trim() || isNaN(notaSelecionada) || notaSelecionada <= 0) return 'Informe o valor que irá pagar.';
      if (notaCentavos < totalComTaxa) return `Valor insuficiente. Total: ${formatarReais(totalComTaxa)}.`;
    }
    if (metodo === 'CARTAO_CREDITO' && localPagamento === 'online') {
      if (cartao.numero.replace(/\s/g, '').length < 16) return 'Número do cartão inválido.';
      if (!cartao.nome.trim()) return 'Informe o nome no cartão.';
      if (cartao.validade.length < 5) return 'Validade inválida.';
      if (cartao.cvv.length < 3) return 'CVV inválido.';
    }
    return null;
  }

  async function handleFinalizarPedido() {
    if (items.length === 0) return;
    if (restauranteFechado) {
      setErroMsg('Este restaurante está fechado no momento. Tente novamente mais tarde.');
      setStatus('erro');
      return;
    }
    const erroValidacao = validarPagamento();
    if (erroValidacao) { setErroMsg(erroValidacao); setStatus('erro'); return; }

    setStatus('loading');
    setErroMsg('');

    // Mapeia métodos de maquininha para os enums aceitos pela API
    const mapaFormaPagamento = {
      MAQUININHA_CREDITO: 'CARTAO_CREDITO',
      MAQUININHA_DEBITO:  'CARTAO_DEBITO',
    };
    const formaPagamentoApi = mapaFormaPagamento[formaPagamentoFinal] || formaPagamentoFinal;

    const payload = {
      restauranteId: getRestauranteId(),
      itens: items.map((it) => ({
        produtoId:     String(it.id),
        nomeProduto:   it.nome,
        quantidade:    it.quantidade || 1,
        precoUnitario: reaisParaCentavos(it.preco),
      })),
      endereco:       montarEnderecoPayload(enderecoDados),
      formaPagamento: formaPagamentoApi,
      taxaEntrega:    TAXA_ENTREGA,
      // dinheiro
      ...(metodo === 'DINHEIRO' && notaCentavos > 0
        ? { nota_dinheiro: notaCentavos, troco_centavos: trocoCentavos }
        : {}),
      // cartão online — apenas últimos 4 dígitos (nunca mandamos dados sensíveis)
      ...(metodo === 'CARTAO_CREDITO' && localPagamento === 'online'
        ? { ultimos4: cartao.numero.replace(/\s/g, '').slice(-4) }
        : {}),
    };

    try {
      const { data } = await pedidosApi.criar(payload);
      const id = data?.pedidoId ?? data?.id ?? data?.numero ?? data?.data?.pedidoId ?? null;
      setTrocoFinal(trocoCentavos);
      setNotaFinal(notaCentavos);
      clearCart();
      setNumeroPedido(id);
      setStatus('sucesso');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.erro || err.message || 'Não foi possível enviar o pedido.';
      setErroMsg(typeof msg === 'string' ? msg : 'Erro ao finalizar pedido.');
      setStatus('erro');
    }
  }

  // ── Tela de sucesso ───────────────────────────────────────────────────────
  if (status === 'sucesso') {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#2D7A4F] to-[#3CB371]">
        <div className="mx-auto w-full max-w-lg shrink-0"><LojaHeader /></div>
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-white">
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center">
            <span className="text-6xl">✅</span>
            <h2 className="text-2xl font-bold text-zinc-800">Pedido realizado!</h2>
            {numeroPedido && (
              <p className="text-sm text-zinc-500">Número do pedido: <span className="font-semibold text-zinc-700">#{numeroPedido}</span></p>
            )}
            {metodo === 'DINHEIRO' && trocoFinal != null && (
              <div className="rounded-2xl bg-green-50 border border-green-200 px-6 py-4 text-center">
                <p className="text-sm text-green-700">Você receberá o troco de</p>
                <p className="text-2xl font-extrabold text-green-600">{formatarReais(trocoFinal)}</p>
                <p className="text-xs text-green-500 mt-1">Valor informado: {formatarReais(notaFinal)}</p>
              </div>
            )}
            {(metodo === 'MAQUININHA_CREDITO' || metodo === 'MAQUININHA_DEBITO') && (
              <div className="rounded-2xl bg-blue-50 border border-blue-200 px-6 py-4 text-center">
                <p className="text-2xl">💳</p>
                <p className="text-sm text-blue-700 mt-1">O entregador levará a maquininha.</p>
              </div>
            )}
            <p className="max-w-[260px] text-sm text-zinc-500">
              Seu pedido foi recebido. Acompanhe pelo menu <strong>Pedidos</strong>.
            </p>
            <button
              type="button"
              onClick={() => { setStatus('idle'); navigate('/loja'); }}
              className="mt-2 w-full max-w-[240px] rounded-2xl bg-[#3CB371] py-3 text-base font-bold text-white hover:opacity-90"
            >
              Voltar ao cardápio
            </button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-lg shrink-0"><LojaBottomNav /></div>
      </div>
    );
  }

  // ── Tela principal ────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#2D7A4F] to-[#3CB371]">
      <div className="mx-auto w-full max-w-lg shrink-0"><LojaHeader /></div>

      {/* Endereço */}
      <div className="mx-auto w-full max-w-lg shrink-0 px-8 py-3">
        <h2 className="text-2xl font-bold text-white">Endereço</h2>
        {enderecoDisplay
          ? <p className="mt-1 text-xl font-bold leading-snug text-white">{enderecoDisplay}</p>
          : <p className="mt-1 text-sm text-white/50">Localização não definida — <Link to="/login" className="underline text-white/80">definir no login</Link></p>
        }
      </div>

      {/* Painel branco */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-white">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <h3 className="text-xl font-bold text-zinc-800">Carrinho</h3>

          {items.length === 0 ? (
            <p className="mt-8 text-center text-zinc-500">
              Carrinho vazio. <Link to="/loja" className="font-semibold text-[#3CB371] underline">Ver cardápio</Link>
            </p>
          ) : (
            <>
              {/* Lista de itens */}
              <ul className="mt-4 flex flex-col gap-3">
                {items.map((it) => (
                  <li key={it.id} className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">{it.nome}</p>
                      <p className="text-sm text-zinc-600">R$ {(Number(it.preco) * (it.quantidade || 1)).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="h-9 w-9 rounded-lg border border-zinc-300 font-bold"
                        onClick={() => updateQuantity(it.id, (it.quantidade || 1) - 1)}>−</button>
                      <span className="w-8 text-center font-semibold">{it.quantidade || 1}</span>
                      <button type="button" className="h-9 w-9 rounded-lg border border-zinc-300 font-bold"
                        onClick={() => updateQuantity(it.id, (it.quantidade || 1) + 1)}>+</button>
                      <button type="button" className="ml-2 text-sm text-red-600 underline"
                        onClick={() => removeItem(it.id)}>remover</button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Resumo de valores */}
              <div className="mt-4 flex flex-col gap-1 text-sm text-zinc-500 border-t border-zinc-100 pt-3">
                <div className="flex justify-between"><span>Subtotal</span><span>R$ {total.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between"><span>Taxa de entrega</span><span>R$ {(TAXA_ENTREGA / 100).toFixed(2).replace('.', ',')}</span></div>
              </div>
              <p className="mt-2 flex justify-between text-lg font-bold text-zinc-900">
                <span>Total</span>
                <span>R$ {totalComTaxaR.toFixed(2).replace('.', ',')}</span>
              </p>

              {/* ── PAGAMENTO ─────────────────────────────────────────── */}
              <div className="mt-5">
                <p className="mb-2 text-sm font-bold text-zinc-800">Pagamento</p>

                {/* Onde pagar */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { val: 'local',  icon: '🚪', label: 'Na entrega' },
                    { val: 'online', icon: '🌐', label: 'Online agora' },
                  ].map((op) => (
                    <button key={op.val} type="button"
                      onClick={() => {
                        setLocalPagamento(op.val);
                        setMetodo(op.val === 'online' ? 'PIX' : 'DINHEIRO');
                        setNotaInput('');
                      }}
                      className={`rounded-xl border-2 py-3 text-sm font-semibold transition flex flex-col items-center gap-1
                        ${localPagamento === op.val ? 'border-[#3CB371] bg-[#3CB371]/10 text-[#2D7A4F]' : 'border-zinc-200 text-zinc-600 hover:border-[#3CB371]/50'}`}
                    >
                      <span className="text-xl">{op.icon}</span>
                      {op.label}
                    </button>
                  ))}
                </div>

                {/* ── ONLINE ─────────────────────────────────────────── */}
                {localPagamento === 'online' && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { val: 'PIX',           icon: '⚡', label: 'PIX' },
                        { val: 'CARTAO_CREDITO', icon: '💳', label: 'Cartão de crédito' },
                      ].map((m) => (
                        <button key={m.val} type="button"
                          onClick={() => setMetodo(m.val)}
                          className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition flex items-center gap-2
                            ${metodo === m.val ? 'border-[#3CB371] bg-[#3CB371] text-white' : 'border-zinc-200 text-zinc-700 hover:border-[#3CB371]'}`}
                        >
                          <span>{m.icon}</span>{m.label}
                        </button>
                      ))}
                    </div>

                    {metodo === 'PIX' && (
                      <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center">
                        <p className="text-2xl">⚡</p>
                        <p className="mt-1 text-sm font-semibold text-green-700">Pagamento via PIX</p>
                        <p className="text-xs text-green-500 mt-1">QR Code será exibido após confirmar o pedido.</p>
                      </div>
                    )}

                    {metodo === 'CARTAO_CREDITO' && (
                      <FormCartao dados={cartao} onChange={setCartao} />
                    )}
                  </div>
                )}

                {/* ── NA ENTREGA ─────────────────────────────────────── */}
                {localPagamento === 'local' && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { val: 'DINHEIRO',           icon: '💵', label: 'Dinheiro' },
                        { val: 'MAQUININHA_CREDITO',  icon: '💳', label: 'Crédito (maquininha)' },
                        { val: 'MAQUININHA_DEBITO',   icon: '💳', label: 'Débito (maquininha)' },
                        { val: 'VALE_REFEICAO',       icon: '🎫', label: 'Vale-refeição' },
                      ].map((m) => (
                        <button key={m.val} type="button"
                          onClick={() => { setMetodo(m.val); setNotaInput(''); }}
                          className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition flex items-center gap-2
                            ${metodo === m.val ? 'border-[#3CB371] bg-[#3CB371] text-white' : 'border-zinc-200 text-zinc-700 hover:border-[#3CB371]'}`}
                        >
                          <span>{m.icon}</span>{m.label}
                        </button>
                      ))}
                    </div>

                    {/* Dinheiro → campo de valor + troco */}
                    {metodo === 'DINHEIRO' && (
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
                        <p className="text-xs font-semibold text-zinc-500">Com quanto você vai pagar?</p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">R$</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            placeholder="0,00"
                            value={notaInput}
                            onChange={(e) => setNotaInput(e.target.value)}
                            className="h-11 w-full rounded-xl border border-zinc-300 pl-10 pr-3 text-sm font-semibold focus:border-[#3CB371] focus:outline-none"
                          />
                        </div>
                        {trocoCentavos != null && trocoCentavos >= 0 && (
                          <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex justify-between items-center">
                            <span className="text-sm text-green-700 font-medium">Troco a receber</span>
                            <span className="text-lg font-extrabold text-green-600">{formatarReais(trocoCentavos)}</span>
                          </div>
                        )}
                        {trocoCentavos != null && trocoCentavos < 0 && (
                          <p className="text-xs text-red-500 font-medium">Valor insuficiente. Faltam {formatarReais(Math.abs(trocoCentavos))}.</p>
                        )}
                        {trocoCentavos === null && (
                          <p className="text-xs text-zinc-400">Digite o valor para calcular o troco.</p>
                        )}
                      </div>
                    )}

                    {/* Maquininha */}
                    {(metodo === 'MAQUININHA_CREDITO' || metodo === 'MAQUININHA_DEBITO') && (
                      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-center">
                        <p className="text-2xl">💳</p>
                        <p className="mt-1 text-sm font-semibold text-blue-700">Maquininha na entrega</p>
                        <p className="text-xs text-blue-500 mt-1">O entregador levará a maquininha para você pagar na porta.</p>
                      </div>
                    )}

                    {/* Vale refeição */}
                    {metodo === 'VALE_REFEICAO' && (
                      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center">
                        <p className="text-2xl">🎫</p>
                        <p className="mt-1 text-sm font-semibold text-amber-700">Vale-refeição na entrega</p>
                        <p className="text-xs text-amber-500 mt-1">O entregador levará a maquininha compatível com vale.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Erro */}
              {status === 'erro' && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erroMsg}</div>
              )}

              <button
                type="button"
                disabled={status === 'loading'}
                onClick={handleFinalizarPedido}
                className="mt-5 w-full rounded-2xl bg-[#3CB371] py-3 text-base font-bold text-white hover:opacity-90 disabled:opacity-60"
              >
                {status === 'loading' ? 'Enviando pedido…' : 'Finalizar pedido'}
              </button>

              {status === 'erro' && (
                <button type="button" onClick={() => setStatus('idle')}
                  className="mt-2 w-full rounded-2xl border border-zinc-300 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50">
                  Tentar novamente
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg shrink-0"><LojaBottomNav /></div>
    </div>
  );
}
