import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import fotoCapa from '@assets/images/fotoCapa.png';
import batata from '@assets/images/batata.png';
import hamburguer from '@assets/images/hamburguer.png';
import { TOKEN_KEY, persistTokenFromResponse, usuariosApi, restauranteApi } from '@/services/api';

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true';

// ─── Token fake dev ───────────────────────────────────────────────────────────
function gerarTokenFake(role = 'USER') {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: `dev-${role.toLowerCase()}`,
    id: `dev-${role.toLowerCase()}`,
    nome: role === 'RESTAURANTE' ? 'Restaurante Demo' : 'Dev User',
    email: `dev@nelore.local`,
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
    iat: Math.floor(Date.now() / 1000),
  }));
  return `${header}.${payload}.dev-signature-fake`;
}

// ─── Formulário Usuário ───────────────────────────────────────────────────────
function FormUsuario() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const inputClass =
    'h-[38px] rounded-[20px] border-[3px] border-[#FFA801] bg-[#636363] pl-3 text-[#FFA801] placeholder:text-[#FFA801]/70 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/40';

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    if (!email.trim() || !senha) { setErro('Preencha email e senha.'); return; }
    setLoading(true);
    try {
      const { data } = await usuariosApi.login({ email: email.trim(), senha });
      const token = persistTokenFromResponse(data);
      if (!token) { setErro('Login OK, mas o servidor não enviou um token.'); return; }
      navigate('/home', { replace: true });
    } catch (err) {
      setErro(err.response?.data?.message || err.message || 'Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-[300px] flex-col gap-2.5">
      <form onSubmit={handleLogin} className="flex flex-col gap-2.5">
        <input type="email" autoComplete="email" placeholder="E-mail"
          value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        <input type="password" autoComplete="current-password" placeholder="Senha"
          value={senha} onChange={(e) => setSenha(e.target.value)} className={inputClass} />

        {erro && <p className="text-center text-sm text-red-300" role="alert">{erro}</p>}

        <div className="flex items-center justify-between pt-1">
          <Link to="/cadastro" className="text-[#FFA801] underline">Cadastrar</Link>
          <button type="submit" disabled={loading}
            className="rounded-lg bg-[#FFA801] px-5 py-2 font-semibold text-[#636363] hover:opacity-90 disabled:opacity-50">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>

      {/* Dev bypass */}
      {DEV_BYPASS && (
        <button type="button"
          onClick={() => { sessionStorage.setItem(TOKEN_KEY, gerarTokenFake('USER')); navigate('/home', { replace: true }); }}
          className="mt-1 w-full rounded-lg border-2 border-dashed border-yellow-400/60 bg-yellow-400/10 py-2 text-xs font-semibold text-yellow-300 hover:bg-yellow-400/20">
          ⚠️ Modo dev — entrar sem backend
        </button>
      )}

      <div className="mt-2 flex flex-col items-center">
        <Link to="/esqueci-senha" className="text-xs text-[#FFA801]/70 underline hover:text-[#FFA801]">
          Esqueceu a senha?
        </Link>
      </div>
    </div>
  );
}

// ─── Formulário Restaurante ───────────────────────────────────────────────────
function FormRestaurante() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const inputClass =
    'h-[38px] rounded-[20px] border-[3px] border-[#FFA801] bg-[#636363] pl-3 text-[#FFA801] placeholder:text-[#FFA801]/70 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/40';

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    if (!email.trim() || !senha) { setErro('Preencha email e senha.'); return; }
    setLoading(true);
    try {
      const { data } = await restauranteApi.login({ email: email.trim(), senha });
      const token = persistTokenFromResponse(data);
      if (!token) { setErro('Login OK, mas o servidor não enviou um token.'); return; }
      navigate('/restaurante/dashboard', { replace: true });
    } catch (err) {
      setErro(err.response?.data?.message || err.message || 'Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-[300px] flex-col gap-2.5">
      <form onSubmit={handleLogin} className="flex flex-col gap-2.5">
        <input type="email" autoComplete="email" placeholder="E-mail do restaurante"
          value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        <input type="password" autoComplete="current-password" placeholder="Senha"
          value={senha} onChange={(e) => setSenha(e.target.value)} className={inputClass} />

        {erro && <p className="text-center text-sm text-red-300" role="alert">{erro}</p>}

        <div className="flex items-center justify-between pt-1">
          <Link to="/restaurante/cadastro" className="text-[#FFA801] underline">
            Cadastrar restaurante
          </Link>
          <button type="submit" disabled={loading}
            className="rounded-lg bg-[#FFA801] px-5 py-2 font-semibold text-[#636363] hover:opacity-90 disabled:opacity-50">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>

      {/* Dev bypass */}
      {DEV_BYPASS && (
        <button type="button"
          onClick={() => { sessionStorage.setItem(TOKEN_KEY, gerarTokenFake('RESTAURANTE')); navigate('/restaurante/dashboard', { replace: true }); }}
          className="mt-1 w-full rounded-lg border-2 border-dashed border-yellow-400/60 bg-yellow-400/10 py-2 text-xs font-semibold text-yellow-300 hover:bg-yellow-400/20">
          ⚠️ Modo dev — entrar sem backend
        </button>
      )}

      <div className="mt-2 flex flex-col items-center">
        <Link to="/esqueci-senha" className="text-xs text-[#FFA801]/70 underline hover:text-[#FFA801]">
          Esqueceu a senha?
        </Link>
      </div>
    </div>
  );
}

// ─── Ícone de pin ─────────────────────────────────────────────────────────────
function PinIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

// ─── Componente de localização ────────────────────────────────────────────────
function LocalizacaoAtual() {
  const [endereco, setEndereco] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | ok | manual
  const [editando, setEditando] = useState(false);

  function salvarEndereco(display, dados) {
    try {
      sessionStorage.setItem('nelore_localizacao', display);
      sessionStorage.setItem('nelore_localizacao_dados', JSON.stringify(dados));
    } catch { /* ignore */ }
    setEndereco(display);
    setStatus('ok');
  }

  // ── 1. Tenta GPS do navegador ────────────────────────────────────────────
  async function reverseGeocode(lat, lon) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=pt-BR`,
        { signal: controller.signal }
      );
      clearTimeout(timer);
      const data = await res.json();
      const a = data.address || {};
      return {
        display: [a.road || a.street, a.house_number, a.suburb || a.neighbourhood, a.city || a.town].filter(Boolean).join(', ') || data.display_name || '',
        dados: {
          rua: a.road || a.street || '',
          numero: a.house_number || '',
          bairro: a.suburb || a.neighbourhood || a.quarter || '',
          cidade: a.city || a.town || a.municipality || '',
          uf: a.state_code || '',
          cep: (a.postcode || '').replace(/\D/g, ''),
        },
      };
    } catch {
      clearTimeout(timer);
      return null;
    }
  }

  // ── 2. Fallback: localização por IP (sem permissão) ──────────────────────
  async function localizacaoPorIP() {
    const apis = [
      async () => {
        const r = await fetch('https://ip-api.com/json/?lang=pt-BR&fields=city,regionName,regionCode,zip,status');
        const d = await r.json();
        if (d.status !== 'success') throw new Error('fail');
        return { cidade: d.city || '', uf: d.regionCode || '', cep: (d.zip || '').replace(/\D/g, '') };
      },
      async () => {
        const r = await fetch('https://ipapi.co/json/');
        const d = await r.json();
        if (d.error) throw new Error('fail');
        return { cidade: d.city || '', uf: d.region_code || '', cep: (d.postal || '').replace(/\D/g, '') };
      },
      async () => {
        const r = await fetch('https://ipinfo.io/json');
        const d = await r.json();
        return { cidade: d.city || '', uf: d.region || '', cep: (d.postal || '').replace(/\D/g, '') };
      },
    ];

    for (const api of apis) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        const resultado = await api();
        clearTimeout(timer);
        if (resultado.cidade) {
          const display = [resultado.cidade, resultado.uf].filter(Boolean).join(', ');
          return {
            display,
            dados: { rua: '', numero: '', bairro: '', ...resultado },
          };
        }
      } catch { /* tenta próxima */ }
    }
    return null;
  }

  async function buscarLocalizacao() {
    setStatus('loading');

    // Tenta GPS primeiro
    if (navigator.geolocation) {
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            const resultado = await reverseGeocode(coords.latitude, coords.longitude);
            if (resultado) {
              salvarEndereco(resultado.display, resultado.dados);
            } else {
              setStatus('manual');
            }
            resolve();
          },
          async (gpsErr) => {
            // GPS falhou — tenta IP
            if (DEV_BYPASS) console.warn('[Localização] GPS falhou, código:', gpsErr?.code, gpsErr?.message);
            const resultado = await localizacaoPorIP();
            if (DEV_BYPASS) console.info('[Localização] IP resultado:', resultado);
            if (resultado) {
              salvarEndereco(resultado.display, resultado.dados);
            } else {
              setStatus('manual');
            }
            resolve();
          },
          { timeout: 8000, maximumAge: 30000, enableHighAccuracy: false }
        );
      });
    } else {
      // Sem suporte a GPS — tenta IP direto
      const resultado = await localizacaoPorIP();
      if (resultado) {
        salvarEndereco(resultado.display, resultado.dados);
      } else {
        setStatus('manual');
      }
    }
  }

  // ── idle: botão para ativar ──
  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={buscarLocalizacao}
        className="mt-4 flex items-center gap-1.5 text-sm text-[#FFA801]/70 underline hover:text-[#FFA801] transition"
      >
        <PinIcon className="h-4 w-4 text-red-400" />
        Usar minha localização
      </button>
    );
  }

  // ── loading ──
  if (status === 'loading') {
    return (
      <p className="mt-4 flex items-center gap-1.5 text-sm text-white/50">
        <PinIcon className="h-4 w-4 text-red-400 animate-pulse" />
        Obtendo localização…
      </p>
    );
  }

  // ── manual: GPS falhou, campo para digitar ──
  if (status === 'manual') {
    return (
      <div className="mt-4 flex w-full max-w-[300px] flex-col gap-1">
        <p className="text-center text-xs text-white/40">
          GPS indisponível — digite seu bairro ou cidade:
        </p>
        <div className="flex items-center gap-2">
          <PinIcon className="h-4 w-4 shrink-0 text-red-400" />
          <input
            type="text"
            placeholder="Ex: Bairro, Cidade"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            onBlur={() => {
              if (endereco.trim()) {
                try { sessionStorage.setItem('nelore_localizacao', endereco.trim()); } catch { /* ignore */ }
                setStatus('ok');
              }
            }}
            autoFocus
            className="h-[32px] flex-1 rounded-full border border-[#FFA801]/40 bg-transparent px-3 text-xs text-[#FFA801] placeholder:text-[#FFA801]/40 focus:outline-none focus:border-[#FFA801]"
          />
        </div>
      </div>
    );
  }

  // ── ok: exibe endereço com opção de editar ──
  if (editando) {
    return (
      <div className="mt-4 flex w-full max-w-[300px] items-center gap-2">
        <PinIcon className="h-4 w-4 shrink-0 text-red-500" />
        <input
          type="text"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          onBlur={() => {
            try { sessionStorage.setItem('nelore_localizacao', endereco); } catch { /* ignore */ }
            setEditando(false);
          }}
          autoFocus
          className="h-[32px] flex-1 rounded-full border border-[#FFA801]/60 bg-transparent px-3 text-xs text-[#FFA801] focus:outline-none focus:border-[#FFA801]"
        />
      </div>
    );
  }

  return (
    <div className="mt-4 flex max-w-[280px] items-start gap-1.5 text-[13px] text-[#FFA801]">
      <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <span className="line-clamp-2 flex-1">{endereco || 'Localização obtida ✓'}</span>
      <button
        type="button"
        onClick={() => setEditando(true)}
        title="Editar endereço"
        className="ml-1 shrink-0 text-[#FFA801]/60 hover:text-[#FFA801] transition"
      >
        ✏️
      </button>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const [modo, setModo] = useState('usuario'); // 'usuario' | 'restaurante'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#636363] px-4 pb-10 pt-8 font-sans text-[13px] text-[#FFA801]">

      {/* Logo */}
      <img src={fotoCapa} alt="NeloreBurguer"
        className="mb-5 h-[130px] w-[230px] max-w-full object-contain" />

      {/* Toggle */}
      <div className="mb-6 flex w-full max-w-[300px] rounded-full border-2 border-[#FFA801] p-1">
        <button
          type="button"
          onClick={() => setModo('usuario')}
          className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition-all duration-200 ${
            modo === 'usuario'
              ? 'bg-[#FFA801] text-[#636363]'
              : 'text-[#FFA801]/60 hover:text-[#FFA801]'
          }`}
        >
          🛍️ Usuário
        </button>
        <button
          type="button"
          onClick={() => setModo('restaurante')}
          className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition-all duration-200 ${
            modo === 'restaurante'
              ? 'bg-[#FFA801] text-[#636363]'
              : 'text-[#FFA801]/60 hover:text-[#FFA801]'
          }`}
        >
          🏪 Restaurante
        </button>
      </div>

      {/* Formulário conforme modo */}
      {modo === 'usuario' ? <FormUsuario /> : <FormRestaurante />}

      {/* Imagens decorativas */}
      <div className="mt-12 flex flex-row items-center justify-around gap-8">
        <img src={batata} alt="" className="h-[130px] w-[87px] object-contain" />
        <img src={hamburguer} alt="" className="h-[95px] w-[105px] object-contain" />
      </div>

      {/* Localização atual */}
      <LocalizacaoAtual />

    </div>
  );
}
