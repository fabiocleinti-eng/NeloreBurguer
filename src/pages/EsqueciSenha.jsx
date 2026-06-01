import { useState } from 'react';
import { Link } from 'react-router-dom';
import batata from '@assets/images/batata.png';
import hamburguer from '@assets/images/hamburguer.png';
import { usuariosApi } from '@/services/api';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!email.trim()) {
      setErro('Preencha o seu email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErro('Digite um email válido.');
      return;
    }

    setLoading(true);
    try {
      await usuariosApi.esqueciSenha({ email: email.trim() });
      setEnviado(true);
    } catch (err) {
      // Por segurança: mesmo com erro de servidor, mostramos a mensagem de sucesso
      // para não revelar se o email está ou não cadastrado
      if (err.message?.includes('indisponível') || err.message?.includes('conexão')) {
        setErro(err.message);
        return;
      }
      setEnviado(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#636363] px-4 pb-10 pt-8 font-sans text-[13px] text-[#FFA801]">
      <div className="flex flex-col items-center gap-1 pb-5">
        <span className="text-5xl" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>🚀</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">Pede<span className="text-white/75">Fácil</span></h1>
        <p className="text-xs text-white/55 tracking-wide">Peça rápido, receba fácil</p>
      </div>

      {enviado ? (
        <div className="flex w-full max-w-[300px] flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFA801]/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-[#FFA801]">
              <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
              <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">Verifique seu email</h2>
          <p className="text-sm leading-relaxed text-white/80">
            Se este email estiver cadastrado, você receberá um link para redefinir sua senha em breve.
          </p>
          <p className="text-xs text-[#FFA801]/70">
            Verifique também a pasta de spam.
          </p>
          <Link
            to="/login"
            className="mt-4 rounded-lg bg-[#FFA801] px-6 py-2 font-semibold text-[#636363] transition hover:opacity-90"
          >
            Voltar ao login
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 w-full max-w-[300px] text-center">
            <h1 className="text-lg font-bold text-white">Esqueceu a senha?</h1>
            <p className="mt-1 text-xs text-white/70">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
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

            {erro ? (
              <p className="text-center text-sm text-red-300" role="alert">
                {erro}
              </p>
            ) : null}

            <div className="flex w-full flex-row justify-between gap-2 pt-1">
              <Link
                to="/login"
                className="text-[#FFA801] underline decoration-[#FFA801]"
              >
                Voltar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[#FFA801] px-4 py-2 font-semibold text-[#636363] transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Enviando…' : 'Enviar link'}
              </button>
            </div>
          </form>
        </>
      )}

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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </span>
        <span>Tavares Bastos, Rua Cruzeiro do Sul 131</span>
      </div>
    </div>
  );
}
