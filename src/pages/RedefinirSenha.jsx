import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import batata from '@assets/images/batata.png';
import hamburguer from '@assets/images/hamburguer.png';
import { usuariosApi } from '@/services/api';

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || searchParams.get('t') || '';

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    if (!token) {
      setErro('Link inválido ou expirado. Solicite um novo link de redefinição.');
    }
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!novaSenha || !confirmarSenha) {
      setErro('Preencha os dois campos.');
      return;
    }
    if (novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await usuariosApi.redefinirSenha({ token, novaSenha });
      setConcluido(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.erro ||
        err.response?.data?.error ||
        err.message ||
        'Não foi possível redefinir a senha. O link pode ter expirado.';
      setErro(typeof msg === 'string' ? msg : 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  }

  if (concluido) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#636363] px-4 pb-10 pt-8 font-sans text-[13px] text-[#FFA801]">
        <div className="mb-6 flex flex-col items-center gap-1">
          <span className="text-5xl" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>🚀</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">Pede<span className="text-white/75">Fácil</span></h1>
          <p className="text-xs text-white/55 tracking-wide">Peça rápido, receba fácil</p>
        </div>
        <div className="flex w-full max-w-[300px] flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFA801]/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-[#FFA801]">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">Senha redefinida!</h2>
          <p className="text-sm text-white/80">
            Sua senha foi atualizada com sucesso.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 rounded-lg bg-[#FFA801] px-6 py-2 font-semibold text-[#636363] transition hover:opacity-90"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#636363] px-4 pb-10 pt-8 font-sans text-[13px] text-[#FFA801]">
      <div className="flex flex-col items-center gap-1 pb-5">
        <span className="text-5xl" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>🚀</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">Pede<span className="text-white/75">Fácil</span></h1>
        <p className="text-xs text-white/55 tracking-wide">Peça rápido, receba fácil</p>
      </div>

      <div className="mb-4 w-full max-w-[300px] text-center">
        <h1 className="text-lg font-bold text-white">Redefinir senha</h1>
        <p className="mt-1 text-xs text-white/70">
          Digite sua nova senha abaixo.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[300px] flex-col gap-2.5"
      >
        <input
          type="password"
          name="novaSenha"
          autoComplete="new-password"
          placeholder="Nova senha (mín. 6 caracteres)"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          disabled={!token}
          className="h-[38px] rounded-[20px] border-[3px] border-solid border-[#FFA801] bg-[#636363] pl-2.5 text-[#FFA801] placeholder:text-[#FFA801]/70 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/40 disabled:opacity-40"
        />
        <input
          type="password"
          name="confirmarSenha"
          autoComplete="new-password"
          placeholder="Confirmar nova senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          disabled={!token}
          className="h-[38px] rounded-[20px] border-[3px] border-solid border-[#FFA801] bg-[#636363] pl-2.5 text-[#FFA801] placeholder:text-[#FFA801]/70 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/40 disabled:opacity-40"
        />

        {erro ? (
          <p className="text-center text-sm text-red-300" role="alert">
            {erro}
          </p>
        ) : null}

        <div className="flex w-full flex-row justify-between gap-2 pt-1">
          <Link to="/login" className="text-[#FFA801] underline decoration-[#FFA801]">
            Voltar
          </Link>
          <button
            type="submit"
            disabled={loading || !token}
            className="rounded-lg bg-[#FFA801] px-4 py-2 font-semibold text-[#636363] transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Salvando…' : 'Salvar senha'}
          </button>
        </div>
      </form>

      <div className="mt-14 flex flex-row items-center justify-around gap-8">
        <img src={batata} alt="" className="h-[146px] w-[97px] object-contain" />
        <img src={hamburguer} alt="" className="h-[104px] w-[115px] object-contain" />
      </div>

      <div className="mt-5 flex flex-row items-center gap-1.5 text-[18px] text-[#FFA801]">
        <span className="inline-block h-9 w-9 text-red-500" aria-hidden>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </span>
        <span>Tavares Bastos, Rua Cruzeiro do Sul 131</span>
      </div>
    </div>
  );
}
