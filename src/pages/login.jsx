import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import fotoCapa from '@assets/images/fotoCapa.png';
import batata from '@assets/images/batata.png';
import hamburguer from '@assets/images/hamburguer.png';
import googleImg from '@assets/images/google.jpg';
import { TOKEN_KEY, persistTokenFromResponse, usuariosApi } from '@/services/api';

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true';
const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

// Componente separado para que useGoogleLogin só seja chamado quando Google está ativo
function GoogleLoginButton({ onSuccess, onError, disabled }) {
  const login = useGoogleLogin({ onSuccess, onError });
  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={disabled}
      className="flex items-center gap-2 rounded-lg border border-[#FFA801]/40 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
    >
      <img src={googleImg} alt="" className="h-5 w-5 rounded object-cover" />
      {disabled ? 'Aguardando Google…' : 'Entrar com Google'}
    </button>
  );
}

function gerarTokenDevFake() {
  // JWT fake apenas para navegação local — sem assinatura válida
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: 'dev-user',
    id: 'dev-user',
    nome: 'Dev User',
    email: 'dev@nelore.local',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8h
    iat: Math.floor(Date.now() / 1000),
  }));
  return `${header}.${payload}.dev-signature-fake`;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [erro, setErro] = useState('');

  async function handleGoogleSuccess(tokenResponse) {
    setErro('');
    setLoadingGoogle(true);
    try {
      const { data } = await usuariosApi.loginGoogle({
        accessToken: tokenResponse.access_token,
      });
      const token = persistTokenFromResponse(data);
      if (!token) {
        setErro('Login com Google OK, mas o servidor não retornou um token. Contacte o suporte.');
        return;
      }
      navigate('/home', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.erro ||
        err.response?.data?.error ||
        err.message ||
        'Não foi possível entrar com o Google. Tente novamente.';
      setErro(typeof msg === 'string' ? msg : 'Erro ao entrar com Google.');
    } finally {
      setLoadingGoogle(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');

    if (!email.trim() || !senha) {
      setErro('Preencha email e senha.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await usuariosApi.login({
        email: email.trim(),
        senha,
      });

      const token = persistTokenFromResponse(data);
      if (!token) {
        setErro('Login OK, mas o servidor não enviou um token reconhecido. Contacte o suporte.');
        return;
      }

      navigate('/home', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.erro ||
        err.response?.data?.error ||
        err.message ||
        'Não foi possível entrar. Verifique os dados ou tente mais tarde.';
      setErro(typeof msg === 'string' ? msg : 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#636363] px-4 pb-10 pt-8 font-sans text-[13px] text-[#FFA801]">
      <div className="flex flex-row items-center justify-center pb-5">
        <img
          src={fotoCapa}
          alt="NeloreBuguer"
          className="h-[143px] w-[253px] max-w-full object-contain"
        />
      </div>

      <form
        onSubmit={handleLogin}
        className="flex w-full max-w-[300px] flex-col gap-2.5"
      >
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-[38px] rounded-[20px] border-[3px] border-solid border-[#FFA801] bg-[#636363] pl-2.5 text-[#FFA801] placeholder:text-[#FFA801]/70 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/40"
        />
        <input
          type="password"
          name="senha"
          autoComplete="current-password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="h-[38px] rounded-[20px] border-[3px] border-solid border-[#FFA801] bg-[#636363] pl-2.5 text-[#FFA801] placeholder:text-[#FFA801]/70 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/40"
        />

        {erro ? (
          <p className="text-center text-sm text-red-300" role="alert">
            {erro}
          </p>
        ) : null}

        <div className="flex w-full max-w-[300px] flex-row justify-between gap-2 pt-1">
          <Link
            to="/cadastro"
            className="text-[#FFA801] underline decoration-[#FFA801]"
          >
            Cadastrar
          </Link>
          <button
            type="submit"
            disabled={loading || loadingGoogle}
            className="rounded-lg bg-[#FFA801] px-4 py-2 font-semibold text-[#636363] transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Logar'}
          </button>
        </div>
      </form>

      {DEV_BYPASS && (
        <div className="mt-4 w-full max-w-[300px]">
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem(TOKEN_KEY, gerarTokenDevFake());
              navigate('/home', { replace: true });
            }}
            className="w-full rounded-lg border-2 border-dashed border-yellow-400/60 bg-yellow-400/10 py-2 text-xs font-semibold text-yellow-300 transition hover:bg-yellow-400/20"
          >
            ⚠️ Modo dev — entrar sem backend
          </button>
          <p className="mt-1 text-center text-[10px] text-white/30">
            Apenas para navegação local. Remova VITE_DEV_BYPASS antes de publicar.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col items-center gap-3">
        <p className="text-xs text-white/50">ou continue com</p>

        {GOOGLE_ENABLED ? (
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={() => setErro('Login com Google cancelado ou falhou. Tente novamente.')}
            disabled={loadingGoogle || loading}
          />
        ) : (
          <button
            type="button"
            disabled
            title="Configure VITE_GOOGLE_CLIENT_ID no .env para ativar"
            className="flex items-center gap-2 rounded-lg border border-[#FFA801]/20 bg-white/5 px-4 py-2 text-sm text-white/30 cursor-not-allowed"
          >
            <img src={googleImg} alt="" className="h-5 w-5 rounded object-cover opacity-40" />
            Entrar com Google
          </button>
        )}

        <Link
          to="/esqueci-senha"
          className="mt-1 text-xs text-[#FFA801]/70 underline decoration-[#FFA801]/50 hover:text-[#FFA801]"
        >
          Esqueceu a senha?
        </Link>
      </div>

      <div className="mt-14 flex flex-row items-center justify-around gap-8">
        <img src={batata} alt="" className="h-[146px] w-[97px] object-contain" />
        <img
          src={hamburguer}
          alt=""
          className="h-[104px] w-[115px] object-contain"
        />
      </div>

      <div className="mt-5 flex flex-row items-center gap-1.5 text-[18px] text-[#FFA801]">
        <span className="inline-block h-9 w-9 text-red-500" aria-hidden>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-full w-full"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </span>
        <span>Tavares Bastos, Rua Cruzeiro do Sul 131</span>
      </div>
    </div>
  );
}
