import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RocketLoader } from '@/components/common/RocketLoader';
import { restaurantePedidosApi } from '@/services/api';

function Estrelas({ nota, tamanho = 'text-xl' }) {
  return (
    <span className={tamanho}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= nota ? '⭐' : '☆'}</span>
      ))}
    </span>
  );
}

function formatarData(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const LABEL_NOTA = ['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];
const COR_NOTA   = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-blue-400', 'text-green-400'];

export default function RestauranteAvaliacoes() {
  const navigate = useNavigate();
  const restauranteId = sessionStorage.getItem('nelore_restaurante_id') || '';

  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const { data } = await restaurantePedidosApi.listar(restauranteId);
        const pedidos = Array.isArray(data) ? data : data?.data ?? [];
        const comAvaliacao = pedidos
          .filter((p) => p.avaliacao && typeof p.avaliacao.nota === 'number')
          .map((p) => ({
            pedidoId:   p.id,
            nota:       p.avaliacao.nota,
            comentario: p.avaliacao.comentario || '',
            criadoEm:   p.criado_em || p.criadoEm || null,
            cliente:    p.cliente?.nome || 'Cliente',
          }))
          .sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0));
        setAvaliacoes(comAvaliacao);
      } catch {
        setAvaliacoes([]);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [restauranteId]);

  // Métricas
  const total = avaliacoes.length;
  const media = total > 0
    ? (avaliacoes.reduce((s, a) => s + a.nota, 0) / total).toFixed(1)
    : null;
  const distribuicao = [5, 4, 3, 2, 1].map((n) => ({
    nota: n,
    count: avaliacoes.filter((a) => a.nota === n).length,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-[#0F1E34] font-sans">

      {/* Header */}
      <header className="flex items-center gap-3 bg-[#1A2B4A] px-5 py-4 shadow">
        <button type="button" onClick={() => navigate('/restaurante/dashboard')} className="text-xl text-white">‹</button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <span className="font-extrabold text-white">Pede<span className="text-[#00C4B4]">Fácil</span></span>
        </div>
        <span className="ml-auto text-sm font-semibold text-white/50">Avaliações</span>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-6 flex flex-col gap-5">

        {carregando ? (
          <RocketLoader mensagem="Carregando avaliações…" />
        ) : total === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
            <span className="text-5xl">⭐</span>
            <p className="text-base font-semibold text-white/60">Nenhuma avaliação ainda</p>
            <p className="text-xs text-white/30">As avaliações dos clientes aparecerão aqui após a entrega dos pedidos.</p>
          </div>
        ) : (
          <>
            {/* Card de resumo */}
            <div className="rounded-2xl border border-[#00C4B4]/20 bg-[#1A2B4A]/60 px-5 py-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#00C4B4]">Resumo geral</p>

              <div className="flex items-center gap-5">
                {/* Nota média */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-5xl font-extrabold text-white leading-none">{media}</span>
                  <Estrelas nota={Math.round(Number(media))} tamanho="text-base" />
                  <span className="text-xs text-white/40">{total} avaliação{total !== 1 ? 'ões' : ''}</span>
                </div>

                {/* Barra por nota */}
                <div className="flex flex-1 flex-col gap-1.5">
                  {distribuicao.map(({ nota, count }) => (
                    <div key={nota} className="flex items-center gap-2 text-xs text-white/50">
                      <span className="w-4 text-right">{nota}</span>
                      <span className="text-amber-400 text-[10px]">★</span>
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#00C4B4]"
                          style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="w-4">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lista de avaliações */}
            <p className="text-xs font-bold uppercase tracking-widest text-[#00C4B4]">
              Comentários dos clientes
            </p>

            <div className="flex flex-col gap-3">
              {avaliacoes.map((av) => (
                <div
                  key={av.pedidoId}
                  className="rounded-2xl border border-[#00C4B4]/20 bg-[#1A2B4A]/60 px-4 py-4"
                >
                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Estrelas nota={av.nota} tamanho="text-sm" />
                        <span className={`text-xs font-semibold ${COR_NOTA[av.nota]}`}>
                          {LABEL_NOTA[av.nota]}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/30">
                        Pedido #{av.pedidoId?.slice(-6)}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/30 shrink-0">
                      {formatarData(av.criadoEm)}
                    </span>
                  </div>

                  {/* Comentário */}
                  {av.comentario ? (
                    <p className="text-sm text-white/80 leading-relaxed border-t border-white/10 pt-2 mt-2">
                      "{av.comentario}"
                    </p>
                  ) : (
                    <p className="text-xs text-white/20 italic border-t border-white/10 pt-2 mt-2">
                      Sem comentário
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
