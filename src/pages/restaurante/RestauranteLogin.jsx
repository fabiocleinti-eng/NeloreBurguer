import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { persistTokenFromResponse, restauranteApi } from '@/services/api';

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true';

/** Extrai o ID do restaurante do payload JWT */
function extrairRestauranteIdDoToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.restauranteId || payload.restaurante_id || payload.id || payload.sub || null;
  } catch {
    return null;
  }
}

function gerarTokenRestauranteFake() {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: 'dev-restaurante-001',
    id: 'dev-restaurante-001',
    restauranteId: 'dev-restaurante-001',
    nome: 'Nelore Burger',
    email: 'demo@restaurante.local',
    role: 'RESTAURANTE',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
    iat: Math.floor(Date.now() / 1000),
  }));
  return `${header}.${payload}.dev-signature-fake`;
}

export default function RestauranteLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');

    if (!email.trim() || !senha) {
      setErro('Preencha email e senha.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await restauranteApi.login({ email: email.trim(), senha });
      const token = persistTokenFromResponse(data);
      if (!token) {
        setErro('Login OK, mas o servidor não enviou um token. Contacte o suporte.');
        return;
      }
      // Salva o ID do restaurante para uso em todo o painel
      const restId = extrairRestauranteIdDoToken(token)
        || data?.restauranteId || data?.restaurante?.id || data?.id;
      if (restId) sessionStorage.setItem('nelore_restaurante_id', restId);
      navigate('/restaurante/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.erro ||
        err.message ||
        'Não foi possível entrar. Verifique os dados.';
      setErro(typeof msg === 'string' ? msg : 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F1E34] px-4 pb-10 pt-8 font-sans">

      {/* Logo PedeFácil */}
      <div className="mb-1 flex items-center gap-3">
        <span className="text-5xl">🚀</span>
        <span className="text-4xl font-extrabold tracking-tight text-white">
          Pede<span className="text-[#00C4B4]">Fácil</span>
        </span>
      </div>
      <p className="mb-6 text-sm font-semibold text-[#00C4B4]/80">Área do Restaurante</p>

      {/* Formulário */}
      <form onSubmit={handleLogin} className="flex w-full max-w-[300px] flex-col gap-2.5">
        <input
          type="email"
          autoComplete="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-[42px] rounded-[20px] border-[3px] border-[#00C4B4] bg-[#1A2B4A] pl-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#00C4B4]/40"
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="h-[42px] rounded-[20px] border-[3px] border-[#00C4B4] bg-[#1A2B4A] pl-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#00C4B4]/40"
        />

        {erro && (
          <p className="text-center text-sm text-red-300" role="alert">{erro}</p>
        )}

        {/* Esqueceu a senha */}
        <div className="flex justify-end pt-0.5">
          <button type="button" className="text-xs text-[#00C4B4]/70 underline hover:text-[#00C4B4]">
            Esqueceu a senha?
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Link to="/restaurante/cadastro" className="text-sm text-[#00C4B4] underline">
            Cadastrar restaurante
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#00C4B4] px-5 py-2 font-semibold text-[#0F1E34] transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>

      {/* Modo dev */}
      {DEV_BYPASS && (
        <div className="mt-4 w-full max-w-[300px]">
          <button
            type="button"
            onClick={() => {
              const fakeToken = gerarTokenRestauranteFake();
              sessionStorage.setItem('nelore_jwt', fakeToken);
              // Salva o ID do restaurante fake para o painel usar
              const restId = extrairRestauranteIdDoToken(fakeToken);
              if (restId) sessionStorage.setItem('nelore_restaurante_id', restId);
              navigate('/restaurante/dashboard', { replace: true });
            }}
            className="w-full rounded-lg border-2 border-dashed border-[#00C4B4]/40 bg-[#00C4B4]/10 py-2 text-xs font-semibold text-[#00C4B4] hover:bg-[#00C4B4]/20"
          >
            ⚠️ Modo dev — entrar sem backend
          </button>
        </div>
      )}

      {/* Voltar */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-8 text-xs text-white/50 underline hover:text-white/80"
      >
        ← Voltar à tela inicial
      </button>
    </div>
  );
}
