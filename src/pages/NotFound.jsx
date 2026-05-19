import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Partículas com posições pré-definidas ao redor da explosão
const PARTICULAS = [
  { emoji: '🔥', tx: '0px',   ty: '-70px' },
  { emoji: '✨', tx: '60px',  ty: '-40px' },
  { emoji: '💫', tx: '70px',  ty: '30px'  },
  { emoji: '⚡', tx: '20px',  ty: '70px'  },
  { emoji: '🔥', tx: '-55px', ty: '50px'  },
  { emoji: '✨', tx: '-70px', ty: '-20px' },
];

export default function NotFound() {
  const navigate = useNavigate();
  const [fase, setFase] = useState('voando'); // voando | explodindo | mensagem

  useEffect(() => {
    const t1 = setTimeout(() => setFase('explodindo'), 950);
    const t2 = setTimeout(() => setFase('mensagem'), 1750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(to bottom, #0F1E34, #1A2B4A)' }}
    >
      {/* Área da animação */}
      <div className="relative flex h-52 w-full max-w-xs items-center justify-center">

        {/* Fase 1 — foguete voando para o centro */}
        {fase === 'voando' && (
          <span
            style={{
              fontSize: '4rem',
              display: 'block',
              animation: 'rocketIn 0.85s cubic-bezier(.2,0,.5,1) forwards',
            }}
          >
            🚀
          </span>
        )}

        {/* Fase 2 — explosão com partículas */}
        {fase === 'explodindo' && (
          <div className="relative flex items-center justify-center">
            <span
              style={{
                fontSize: '4.5rem',
                display: 'block',
                animation: 'bigBoom 0.65s ease-out forwards',
              }}
            >
              💥
            </span>
            {PARTICULAS.map((p, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  fontSize: '1.4rem',
                  animation: `particle 0.65s ease-out ${i * 35}ms forwards`,
                  '--tx': p.tx,
                  '--ty': p.ty,
                }}
              >
                {p.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Fase 3 — restos */}
        {fase === 'mensagem' && (
          <span
            style={{
              fontSize: '3.5rem',
              display: 'block',
              animation: 'fadeInDown 0.35s ease-out forwards',
            }}
          >
            💥
          </span>
        )}
      </div>

      {/* Mensagem 404 */}
      {fase === 'mensagem' && (
        <div
          className="mt-2 flex flex-col items-center gap-3 text-center"
          style={{ animation: 'fadeInDown 0.45s ease-out 0.1s both' }}
        >
          <h1 className="text-7xl font-extrabold text-white leading-none">404</h1>
          <p className="text-lg font-semibold text-white/80">Ops! O foguete explodiu.</p>
          <p className="text-sm text-white/50 max-w-[260px]">
            Essa rota não existe ou foi removida do mapa estelar.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 rounded-2xl bg-[#3CB371] px-8 py-3 text-base font-bold text-white transition hover:opacity-90 active:scale-95"
          >
            🚀 Voltar ao início
          </button>
        </div>
      )}

      <style>{`
        @keyframes rocketIn {
          0%   { transform: translate(-220px, 160px) rotate(-45deg) scale(0.3); opacity: 0; }
          50%  { opacity: 1; }
          100% { transform: translate(0, 0) rotate(-45deg) scale(1); opacity: 1; }
        }

        @keyframes bigBoom {
          0%   { transform: scale(0.4); opacity: 0.9; }
          45%  { transform: scale(2.8); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0.85; }
        }

        @keyframes particle {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
        }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
