/**
 * RocketLoader — exibe um foguete SVG realista voando horizontalmente
 * enquanto a página aguarda dados da API.
 *
 * Uso:
 *   if (carregando) return <RocketLoader />;
 *   if (carregando) return <RocketLoader mensagem="Buscando restaurantes…" fullScreen />;
 */

function RocketSVG() {
  return (
    <svg
      viewBox="0 0 110 48"
      width="110"
      height="48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ── Chama externa (laranja) ── */}
      <ellipse cx="13" cy="24" rx="13" ry="7" fill="#FF6B2B">
        <animate attributeName="rx" values="13;10;14;11;13" dur="0.25s" repeatCount="indefinite" />
        <animate attributeName="ry" values="7;9;6;8;7"     dur="0.25s" repeatCount="indefinite" />
      </ellipse>

      {/* ── Chama interna (amarela) ── */}
      <ellipse cx="11" cy="24" rx="8" ry="4" fill="#FFD234">
        <animate attributeName="rx" values="8;6;9;7;8" dur="0.2s" repeatCount="indefinite" />
        <animate attributeName="ry" values="4;5;3;5;4" dur="0.2s" repeatCount="indefinite" />
      </ellipse>

      {/* ── Bocal do motor ── */}
      <ellipse cx="27" cy="24" rx="5" ry="10" fill="#B0BEC5" />
      <ellipse cx="27" cy="24" rx="3" ry="7"  fill="#78909C" />

      {/* ── Corpo principal ── */}
      <rect x="26" y="13" width="54" height="22" rx="3" fill="#ECEFF1" />
      {/* Highlight topo */}
      <rect x="26" y="13" width="54" height="8"  rx="3" fill="white" opacity="0.45" />
      {/* Faixa decorativa verde */}
      <rect x="72" y="13" width="6"  height="22" rx="1" fill="#3CB371" opacity="0.7" />

      {/* ── Aletas superiores ── */}
      <path d="M38 13 L26 2  L50 13 Z" fill="#2D7A4F" />
      {/* ── Aletas inferiores ── */}
      <path d="M38 35 L26 46 L50 35 Z" fill="#2D7A4F" />

      {/* ── Cone do nariz (verde) ── */}
      <path d="M80 13 L108 24 L80 35 Z" fill="#3CB371" />
      {/* Borda do cone */}
      <line x1="80" y1="13" x2="108" y2="24" stroke="#2D7A4F" strokeWidth="1" />
      <line x1="80" y1="35" x2="108" y2="24" stroke="#2D7A4F" strokeWidth="1" />

      {/* ── Janela / vigia ── */}
      <circle cx="56" cy="24" r="7.5" fill="#1A2B4A" />
      <circle cx="56" cy="24" r="7.5" fill="none" stroke="#00C4B4" strokeWidth="2" />
      {/* Brilho da janela */}
      <circle cx="53" cy="21" r="2.2" fill="white" opacity="0.3" />

      {/* ── Detalhe lateral ── */}
      <rect x="35" y="16" width="30" height="3" rx="1" fill="#B0BEC5" opacity="0.5" />
    </svg>
  );
}

function Contrail() {
  return (
    <div
      style={{
        position: 'absolute',
        right: 'calc(100% - 26px)',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        gap: '3px',
        pointerEvents: 'none',
      }}
    >
      {[1, 0.7, 0.45, 0.25, 0.1].map((op, i) => (
        <div
          key={i}
          style={{
            width: `${14 - i * 2}px`,
            height: `${6 - i}px`,
            borderRadius: '50%',
            background: `rgba(255, 180, 60, ${op})`,
            filter: 'blur(2px)',
          }}
        />
      ))}
    </div>
  );
}

export function RocketLoader({ mensagem = 'Carregando…', fullScreen = false }) {
  const wrapper = fullScreen
    ? {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '24px',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '60px',
        paddingBottom: '60px',
        gap: '20px',
      };

  return (
    <div style={wrapper}>
      {/* Trilha de voo */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '320px',
          height: '60px',
          overflow: 'hidden',
        }}
      >
        {/* Estrelas de fundo */}
        {[15, 60, 120, 200, 270].map((x, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: `${8 + (i % 3) * 14}px`,
              width: `${2 + (i % 2)}px`,
              height: `${2 + (i % 2)}px`,
              borderRadius: '50%',
              background: '#B0BEC5',
              opacity: 0.5,
              animation: `starBlink 1.2s ease-in-out ${i * 0.2}s infinite alternate`,
            }}
          />
        ))}

        {/* Foguete + contrail */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            animation: 'rocketLoop 2.2s linear infinite',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Contrail />
          <RocketSVG />
        </div>
      </div>

      {/* Texto */}
      <p
        style={{
          fontSize: '0.8rem',
          color: '#78909C',
          letterSpacing: '0.05em',
          animation: 'textPulse 1.4s ease-in-out infinite',
        }}
      >
        {mensagem}
      </p>

      <style>{`
        @keyframes rocketLoop {
          0%   { left: -140px; }
          100% { left: calc(100% + 20px); }
        }
        @keyframes starBlink {
          from { opacity: 0.2; transform: scale(0.8); }
          to   { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes textPulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
