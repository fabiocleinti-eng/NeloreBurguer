import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  activatePreviewSession,
  getPreviewTokenFromEnv,
  isPreviewRequired,
  isPreviewSessionValid,
} from '@/utils/previewAccess';

export default function PreviewUnlock() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [erro, setErro] = useState('');

  const redirectTo = searchParams.get('redirect') || '/loja';
  const tokenFromUrl = searchParams.get('t') || searchParams.get('token');

  const required = getPreviewTokenFromEnv();

  useEffect(() => {
    if (!isPreviewRequired()) {
      navigate(redirectTo, { replace: true });
      return;
    }
    if (isPreviewSessionValid()) {
      navigate(redirectTo, { replace: true });
      return;
    }
    if (tokenFromUrl && required && tokenFromUrl === required) {
      activatePreviewSession();
      navigate(redirectTo, { replace: true });
    }
  }, [tokenFromUrl, required, navigate, redirectTo]);

  function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    if (!required) {
      navigate(redirectTo, { replace: true });
      return;
    }
    if (tokenInput.trim() !== required) {
      setErro('Código inválido ou expirado.');
      return;
    }
    activatePreviewSession();
    navigate(redirectTo, { replace: true });
  }

  if (!isPreviewRequired()) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#636363] px-6 py-12 text-[#FFA801]">
      <div className="w-full max-w-md rounded-2xl border border-[#FFA801]/40 bg-black/20 p-8 backdrop-blur-sm">
        <h1 className="text-center text-2xl font-bold text-white">
          Pré-visualização da loja
        </h1>
        <p className="mt-3 text-center text-sm text-white/80">
          Introduza o código temporário para ver a área de compras (sessão limitada
          neste navegador).
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            type="text"
            autoComplete="off"
            placeholder="Código de acesso"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="rounded-xl border-2 border-[#FFA801] bg-[#636363] px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/50"
          />
          {erro ? (
            <p className="text-center text-sm text-red-300">{erro}</p>
          ) : null}
          <button
            type="submit"
            className="rounded-xl bg-[#FFA801] py-3 font-semibold text-[#636363] hover:opacity-95"
          >
            Entrar na loja
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/60">
          Quem tem o link com <code className="text-[#FFA801]">?t=</code> entra
          direto se o código estiver correto.
        </p>

        <Link
          to="/login"
          className="mt-8 block text-center text-sm underline text-white/90"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
