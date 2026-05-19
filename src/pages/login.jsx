import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    'h-[42px] w-full rounded-[20px] border-[3px] border-[#3CB371] bg-white/80 pl-4 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#3CB371]/40';

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

        {erro && <p className="text-center text-sm text-red-500" role="alert">{erro}</p>}

        <div className="flex items-center justify-between pt-1">
          <Link to="/cadastro" className="text-white underline text-sm hover:text-white/80">Cadastrar</Link>
          <button type="submit" disabled={loading}
            className="rounded-xl bg-white px-6 py-2 font-semibold text-[#2D7A4F] hover:opacity-90 disabled:opacity-50">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>

      <div className="flex justify-center">
        <Link to="/esqueci-senha" className="text-xs text-white/70 underline hover:text-white">
          Esqueceu a senha?
        </Link>
      </div>

      {/* Dev bypass */}
      {DEV_BYPASS && (
        <button type="button"
          onClick={() => { sessionStorage.setItem(TOKEN_KEY, gerarTokenFake('USER')); navigate('/home', { replace: true }); }}
          className="mt-1 w-full rounded-lg border-2 border-dashed border-white/40 bg-white/15 py-2 text-xs font-semibold text-white hover:bg-white/25">
          ⚠️ Modo dev — entrar sem backend
        </button>
      )}
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
    'h-[42px] w-full rounded-[20px] border-[3px] border-[#00C4B4] bg-[#1A2B4A] pl-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#00C4B4]/40';

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
          <Link to="/restaurante/cadastro" className="text-[#00C4B4] underline text-sm">
            Cadastrar restaurante
          </Link>
          <button type="submit" disabled={loading}
            className="rounded-xl bg-[#00C4B4] px-6 py-2 font-semibold text-[#0F1E34] hover:opacity-90 disabled:opacity-50">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>

      <div className="flex justify-center">
        <Link to="/esqueci-senha" className="text-xs text-[#00C4B4]/70 underline hover:text-[#00C4B4]">
          Esqueceu a senha?
        </Link>
      </div>

      {/* Dev bypass */}
      {DEV_BYPASS && (
        <button type="button"
          onClick={() => { sessionStorage.setItem(TOKEN_KEY, gerarTokenFake('RESTAURANTE')); navigate('/restaurante/dashboard', { replace: true }); }}
          className="mt-1 w-full rounded-lg border-2 border-dashed border-[#00C4B4]/40 bg-[#00C4B4]/10 py-2 text-xs font-semibold text-[#00C4B4] hover:bg-[#00C4B4]/20">
          ⚠️ Modo dev — entrar sem backend
        </button>
      )}
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
function LocalizacaoAtual({ modo }) {
  const [endereco, setEndereco] = useState('');
  const [status, setStatus] = useState('idle');
  const [editando, setEditando] = useState(false);

  const cor = modo === 'usuario' ? '#3CB371' : '#00C4B4';

  function salvarEndereco(display, dados) {
    try {
      sessionStorage.setItem('nelore_localizacao', display);
      sessionStorage.setItem('nelore_localizacao_dados', JSON.stringify(dados));
    } catch { /* ignore */ }
    setEndereco(display);
    setStatus('ok');
  }

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
        const resultado = await api();
        if (resultado.cidade) {
          const display = [resultado.cidade, resultado.uf].filter(Boolean).join(', ');
          return { display, dados: { rua: '', numero: '', bairro: '', ...resultado } };
        }
      } catch { /* tenta próxima */ }
    }
    return null;
  }

  async function buscarLocalizacao() {
    setStatus('loading');
    if (navigator.geolocation) {
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            const resultado = await reverseGeocode(coords.latitude, coords.longitude);
            if (resultado) salvarEndereco(resultado.display, resultado.dados);
            else setStatus('manual');
            resolve();
          },
          async () => {
            const resultado = await localizacaoPorIP();
            if (resultado) salvarEndereco(resultado.display, resultado.dados);
            else setStatus('manual');
            resolve();
          },
          { timeout: 8000, maximumAge: 30000, enableHighAccuracy: false }
        );
      });
    } else {
      const resultado = await localizacaoPorIP();
      if (resultado) salvarEndereco(resultado.display, resultado.dados);
      else setStatus('manual');
    }
  }

  if (status === 'idle') {
    return (
      <button type="button" onClick={buscarLocalizacao}
        className="mt-4 flex items-center gap-1.5 text-sm text-white/80 underline transition hover:text-white">
        <PinIcon className="h-4 w-4 text-white" />
        Usar minha localização
      </button>
    );
  }

  if (status === 'loading') {
    return (
      <p className="mt-4 flex items-center gap-1.5 text-sm text-white/70">
        <PinIcon className="h-4 w-4 text-white animate-pulse" />
        Obtendo localização…
      </p>
    );
  }

  if (status === 'manual') {
    return (
      <div className="mt-4 flex w-full max-w-[300px] flex-col gap-1">
        <p className="text-center text-xs text-white/70">GPS indisponível — digite seu bairro ou cidade:</p>
        <div className="flex items-center gap-2">
          <PinIcon className="h-4 w-4 shrink-0 text-white" />
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
            className="h-[32px] flex-1 rounded-full border border-white/40 bg-white/15 px-3 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-white/70"
          />
        </div>
      </div>
    );
  }

  if (editando) {
    return (
      <div className="mt-4 flex w-full max-w-[300px] items-center gap-2">
        <PinIcon className="h-4 w-4 shrink-0 text-white" />
        <input
          type="text"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          onBlur={() => {
            try { sessionStorage.setItem('nelore_localizacao', endereco); } catch { /* ignore */ }
            setEditando(false);
          }}
          autoFocus
          className="h-[32px] flex-1 rounded-full border border-white/50 bg-white/15 px-3 text-xs text-white focus:outline-none focus:border-white/80"
        />
      </div>
    );
  }

  return (
    <div className="mt-4 flex max-w-[280px] items-start gap-1.5 text-[13px] text-white">
      <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-white" />
      <span className="line-clamp-2 flex-1">{endereco || 'Localização obtida ✓'}</span>
      <button type="button" onClick={() => setEditando(true)} title="Editar endereço"
        className="ml-1 shrink-0 transition hover:opacity-80">✏️</button>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const [modo, setModo] = useState('usuario');

  const isUsuario = modo === 'usuario';

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 pb-10 pt-8 font-sans text-[13px] transition-colors duration-300"
      style={{ background: isUsuario ? 'linear-gradient(to bottom, #2D7A4F, #3CB371)' : 'linear-gradient(to bottom, #0F1E34, #1A2B4A)' }}
    >
      {/* Logo PedeFácil */}
      <div className="mb-6 flex flex-col items-center gap-1">
        <span className="text-5xl" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>🚀</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
          Pede<span className="text-white/75">Fácil</span>
        </h1>
        <p className="text-xs text-white/55 tracking-wide">Peça rápido, receba fácil</p>
      </div>

      {/* Toggle */}
      <div
        className="mb-6 flex w-full max-w-[300px] rounded-full border-2 p-1 transition-colors duration-300"
        style={{ borderColor: isUsuario ? '#3CB371' : '#00C4B4' }}
      >
        <button
          type="button"
          onClick={() => setModo('usuario')}
          className="flex-1 rounded-full py-1.5 text-sm font-semibold transition-all duration-200"
          style={isUsuario
            ? { background: '#3CB371', color: '#fff' }
            : { color: '#ffffff60' }
          }
        >
          🛍️ Usuário
        </button>
        <button
          type="button"
          onClick={() => setModo('restaurante')}
          className="flex-1 rounded-full py-1.5 text-sm font-semibold transition-all duration-200"
          style={!isUsuario
            ? { background: '#00C4B4', color: '#0F1E34' }
            : { color: '#ffffff60' }
          }
        >
          🏪 Restaurante
        </button>
      </div>

      {/* Formulário conforme modo */}
      {isUsuario ? <FormUsuario /> : <FormRestaurante />}

      {/* Imagens decorativas */}
      <div className="mt-12 flex flex-row items-center justify-around gap-8">
        <img src={batata} alt="" className="h-[130px] w-[87px] object-contain" />
        <img src={hamburguer} alt="" className="h-[95px] w-[105px] object-contain" />
      </div>

      {/* Localização atual */}
      <LocalizacaoAtual modo={modo} />
    </div>
  );
}
