import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import fotoCapa from '@assets/images/fotoCapa.png';
import batata from '@assets/images/batata.png';
import hamburguer from '@assets/images/hamburguer.png';
import googleImg from '@assets/images/google.jpg';
import userImg from '@assets/images/user.jpg';
import { persistTokenFromResponse, usuariosApi } from '@/services/api';

export default function LoginPage() {
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
      const { data } = await usuariosApi.login({
        email: email.trim(),
        senha,
      });

      const token = persistTokenFromResponse(data);
      if (!token) {
        setErro(
          'Login OK, mas o servidor não enviou um token reconhecido. Contacte o suporte.'
        );
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

      <div className="mb-1.5 w-full max-w-[320px] self-end text-right underline decoration-[#FFA801]">
        <button type="button" className="text-[#FFA801]">
          Esqueceu a senha ?
        </button>
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
            disabled={loading}
            className="rounded-lg bg-[#FFA801] px-4 py-2 font-semibold text-[#636363] transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Logar'}
          </button>
        </div>
      </form>

      <div className="mt-4 flex w-full max-w-[300px] flex-row justify-center">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="rounded-lg border border-[#FFA801]/50 bg-transparent px-3 py-1.5 text-sm text-[#FFA801]"
        >
          Ir para página home
        </button>
      </div>

      <div className="mt-6 flex flex-row items-center justify-around gap-4">
        <a href="#" className="inline-flex" aria-label="Continuar com Google">
          <img
            src={googleImg}
            alt=""
            className="h-10 w-10 rounded object-cover"
          />
        </a>
        <a href="#" className="inline-flex" aria-label="Outro login">
          <img
            src={userImg}
            alt=""
            className="h-10 w-10 rounded object-cover"
          />
        </a>
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
