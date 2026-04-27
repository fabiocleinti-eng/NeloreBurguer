import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const GATEWAY =
  import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3080';

function AdminLojaSection({ origin }) {
  const previewToken = (
    import.meta.env.VITE_PREVIEW_TOKEN || ''
  ).trim();
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (!origin) return '';
    if (previewToken) {
      return `${origin}/preview?t=${encodeURIComponent(previewToken)}`;
    }
    return `${origin}/loja`;
  }, [origin, previewToken]);

  async function copyShareUrl() {
    if (!shareUrl || !navigator.clipboard) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="mt-6 rounded-xl border border-emerald-900/60 bg-emerald-950/25 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400/90">
        Acesso temporário — área de compras
      </h2>
      <p className="mt-2 text-xs text-zinc-400">
        Correr{' '}
        <code className="rounded bg-black/40 px-1 text-emerald-300">
          npm run preview:token
        </code>{' '}
        para gerar{' '}
        <code className="text-emerald-200">VITE_PREVIEW_TOKEN</code>, colar no{' '}
        <code className="text-emerald-200">.env</code> e reiniciar o Vite. Depois
        partilha o link abaixo (válido por várias horas neste browser, por
        sessão).
      </p>
      {!previewToken ? (
        <p className="mt-3 text-xs text-amber-200/90">
          Sem token: <Link to="/loja" className="underline">/loja</Link> está aberta
          a todos (ideal só em desenvolvimento).
        </p>
      ) : (
        <>
          <p className="mt-3 break-all font-mono text-[13px] leading-relaxed text-emerald-200">
            {shareUrl}
          </p>
          <button
            type="button"
            onClick={() => copyShareUrl()}
            className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            {copied ? 'Copiado!' : 'Copiar link temporário'}
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Painel para aceder ao projeto a partir de outro dispositivo/rede:
 * — com `npm run dev`, abre também em http://<IP-da-PC>:5173
 * — password opcional: crie `.env` com VITE_ADMIN_PASSWORD=sua_senha
 */
export default function AdminAccess() {
  const requiredPassword = import.meta.env.VITE_ADMIN_PASSWORD || '';
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(() => !requiredPassword);

  const origin = useMemo(
    () =>
      typeof window !== 'undefined'
        ? window.location.origin
        : '',
    []
  );

  function tryUnlock(e) {
    e.preventDefault();
    if (password === requiredPassword) {
      setUnlocked(true);
      setPassword('');
    }
  }

  if (!unlocked && requiredPassword) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 px-4 text-zinc-100">
        <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-800/80 p-6 shadow-xl">
          <h1 className="text-xl font-semibold text-amber-400">
            Acesso administrativo
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Introduza a palavra-passe definida em{' '}
            <code className="rounded bg-zinc-900 px-1 text-amber-200">
              VITE_ADMIN_PASSWORD
            </code>{' '}
            no ficheiro <code className="text-amber-200">.env</code>.
          </p>
          <form onSubmit={tryUnlock} className="mt-4 flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Palavra-passe"
              className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-amber-500 py-2 font-medium text-zinc-900 hover:bg-amber-400"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-amber-400">
          NeloreBuguer — painel de visualização
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Use este URL noutro telemóvel ou PC na mesma rede Wi‑Fi para ver o
          site em execução (servidor Vite com{' '}
          <code className="rounded bg-zinc-800 px-1">host: true</code>).
        </p>

        <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-800/40 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Origem atual
          </h2>
          <p className="mt-1 break-all font-mono text-lg text-amber-300">
            {origin || '—'}
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            Noutro aparelho: substitua <code>localhost</code> pelo IP do
            computador onde corre <code className="text-zinc-300">npm run dev</code>{' '}
            (ex.: <code className="text-zinc-300">http://192.168.1.10:5173/admin</code>
            ).
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-800/40 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            API Gateway
          </h2>
          <p className="mt-1 break-all font-mono text-emerald-300">{GATEWAY}</p>
          <p className="mt-2 text-xs text-zinc-500">
            O front só fala com o gateway (porta 3080). Ajuste com{' '}
            <code className="text-zinc-400">VITE_GATEWAY_URL</code> no{' '}
            <code className="text-zinc-400">.env</code> se necessário.
          </p>
        </div>

        <AdminLojaSection origin={origin} />

        <nav className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-amber-400 hover:bg-amber-500/20"
          >
            Início / Login
          </Link>
          <Link
            to="/loja"
            className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-emerald-300 hover:bg-emerald-500/20"
          >
            Loja (compras)
          </Link>
          <Link
            to="/home"
            className="rounded-lg border border-zinc-600 px-4 py-2 hover:bg-zinc-800"
          >
            Home (placeholder)
          </Link>
          <Link
            to="/cadastro"
            className="rounded-lg border border-zinc-600 px-4 py-2 hover:bg-zinc-800"
          >
            Cadastro
          </Link>
        </nav>

        {!requiredPassword ? (
          <p className="mt-8 rounded-lg border border-amber-900/50 bg-amber-950/30 p-3 text-xs text-amber-200/90">
            <strong>Dica:</strong> para exigir palavra-passe nesta página, adicione{' '}
            <code className="rounded bg-black/30 px-1">VITE_ADMIN_PASSWORD</code>{' '}
            ao ficheiro <code className="rounded bg-black/30 px-1">.env</code> na raiz do projeto
            e reinicie o <code className="rounded bg-black/30 px-1">npm run dev</code>.
          </p>
        ) : null}
      </div>
    </div>
  );
}
