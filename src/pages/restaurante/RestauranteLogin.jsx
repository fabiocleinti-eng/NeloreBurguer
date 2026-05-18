import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import fotoCapa from '@assets/images/fotoCapa.png';
import { persistTokenFromResponse, restauranteApi } from '@/services/api';

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true';

function gerarTokenRestauranteFake() {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: 'dev-restaurante',
    id: 'dev-restaurante',
    nome: 'Restaurante Demo',
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#636363] px-4 pb-10 pt-8 font-sans text-[#FFA801]">

      {/* Logo */}
      <img
        src={fotoCapa}
        alt="NeloreBurguer"
        className="mb-2 h-[120px] w-[210px] object-contain"
      />
      <p className="mb-6 text-sm font-semibold text-white/80">Área do Restaurante</p>

      {/* Formulário */}
      <form onSubmit={handleLogin} className="flex w-full max-w-[300px] flex-col gap-2.5">
        <input
          type="email"
          autoComplete="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-[38px] rounded-[20px] border-[3px] border-[#FFA801] bg-[#636363] pl-3 text-[#FFA801] placeholder:text-[#FFA801]/60 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/40"
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="h-[38px] rounded-[20px] border-[3px] border-[#FFA801] bg-[#636363] pl-3 text-[#FFA801] placeholder:text-[#FFA801]/60 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/40"
        />

        {erro && (
          <p className="text-center text-sm text-red-300" role="alert">{erro}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <Link to="/restaurante/cadastro" className="text-sm text-[#FFA801] underline">
            Cadastrar restaurante
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#FFA801] px-5 py-2 font-semibold text-[#636363] transition hover:opacity-90 disabled:opacity-50"
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
              sessionStorage.setItem('nelore_jwt', gerarTokenRestauranteFake());
              navigate('/restaurante/dashboard', { replace: true });
            }}
            className="w-full rounded-lg border-2 border-dashed border-yellow-400/60 bg-yellow-400/10 py-2 text-xs font-semibold text-yellow-300 hover:bg-yellow-400/20"
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
