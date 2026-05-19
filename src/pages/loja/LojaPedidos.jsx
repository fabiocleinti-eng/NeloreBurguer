import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { RocketLoader } from '@/components/RocketLoader';
import { pedidosApi } from '@/services/api';

const STATUS_LABEL = {
  pendente: { label: 'Pendente', cor: 'bg-yellow-100 text-yellow-700' },
  confirmado: { label: 'Confirmado', cor: 'bg-blue-100 text-blue-700' },
  preparando: { label: 'Preparando', cor: 'bg-orange-100 text-orange-700' },
  saiu: { label: 'Saiu para entrega', cor: 'bg-purple-100 text-purple-700' },
  entregue: { label: 'Entregue', cor: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', cor: 'bg-red-100 text-red-600' },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status?.toLowerCase()] ?? {
    label: status ?? 'Desconhecido',
    cor: 'bg-zinc-100 text-zinc-600',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.cor}`}>
      {s.label}
    </span>
  );
}

export default function LojaPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let cancelado = false;
    pedidosApi
      .meusPedidos()
      .then(({ data }) => {
        if (cancelado) return;
        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.pedidos)
            ? data.pedidos
            : Array.isArray(data?.data)
              ? data.data
              : [];
        setPedidos(lista);
      })
      .catch((err) => {
        if (cancelado) return;
        const msg =
          err.response?.data?.message ||
          err.response?.data?.erro ||
          err.message ||
          'Não foi possível carregar os pedidos.';
        setErro(typeof msg === 'string' ? msg : 'Erro ao carregar pedidos.');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => { cancelado = true; };
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#2D7A4F] to-[#3CB371]">

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaHeader />
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-white">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <h3 className="text-xl font-bold text-zinc-800">Meus Pedidos</h3>

          {carregando && (
            <RocketLoader mensagem="Buscando seus pedidos…" />
          )}

          {!carregando && erro && (
            <div className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {erro}
            </div>
          )}

          {!carregando && !erro && pedidos.length === 0 && (
            <div className="mt-12 flex flex-col items-center gap-3 text-center">
              <span className="text-5xl" aria-hidden>📋</span>
              <p className="text-base font-semibold text-zinc-700">Nenhum pedido ainda</p>
              <p className="text-sm text-zinc-400">
                Seus pedidos aparecerão aqui após a finalização.
              </p>
            </div>
          )}

          {!carregando && !erro && pedidos.length > 0 && (
            <ul className="mt-4 flex flex-col gap-3">
              {pedidos.map((p, i) => {
                const id = p.id ?? p.pedidoId ?? p.numero ?? i;
                const data = p.criadoEm ?? p.createdAt ?? p.data ?? null;
                const itens = Array.isArray(p.itens) ? p.itens : [];

                // ms-pedidos retorna valores em centavos → divide por 100
                const totalReais =
                  p.total != null
                    ? (Number(p.total) / 100).toFixed(2).replace('.', ',')
                    : null;

                const podeCancelar = p.status === 'AGUARDANDO_CONFIRMACAO';

                return (
                  <li key={id}>
                  <Link
                    to={`/loja/pedidos/${id}`}
                    className="block rounded-xl border border-zinc-200 p-4 transition hover:border-[#3CB371]/40 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-zinc-800">
                        Pedido #{id}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>

                    {data && (
                      <p className="mt-1 text-xs text-zinc-400">
                        {new Date(data).toLocaleString('pt-BR')}
                      </p>
                    )}

                    {itens.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-0.5">
                        {itens.map((it, j) => (
                          <li key={j} className="flex justify-between text-sm text-zinc-600">
                            <span>
                              {it.quantidade ?? 1}× {it.nomeProduto ?? it.nome ?? it.produto ?? '–'}
                            </span>
                            {it.precoUnitario != null && (
                              <span>
                                R${' '}
                                {(
                                  (Number(it.precoUnitario) / 100) * (it.quantidade ?? 1)
                                )
                                  .toFixed(2)
                                  .replace('.', ',')}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      {totalReais && (
                        <p className="text-sm font-bold text-zinc-800">
                          Total: R$ {totalReais}
                        </p>
                      )}
                      <span className="text-xs text-[#3CB371]">Ver detalhes ›</span>
                    </div>
                  </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaBottomNav />
      </div>

    </div>
  );
}
