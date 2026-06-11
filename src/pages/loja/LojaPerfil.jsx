import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LojaHeader } from '@/components/loja/LojaHeader';
import { LojaBottomNav } from '@/components/loja/LojaBottomNav';
import { clearStoredToken, getStoredToken, persistTokenFromResponse, usuariosApi } from '@/services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function decodeToken(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function getEndereco() {
  try { return sessionStorage.getItem('nelore_localizacao') || ''; } catch { return ''; }
}

function setEndereco(v) {
  try { sessionStorage.setItem('nelore_localizacao', v); } catch { /* ignore */ }
}

function getCartoes() {
  try { return JSON.parse(localStorage.getItem('nelore_cartoes') || '[]'); } catch { return []; }
}

function salvarCartoes(lista) {
  try { localStorage.setItem('nelore_cartoes', JSON.stringify(lista)); } catch { /* ignore */ }
}

function detectarBandeira(numero) {
  const n = numero.replace(/\D/g, '');
  if (/^4/.test(n)) return { nome: 'Visa', emoji: '💳' };
  if (/^5[1-5]/.test(n)) return { nome: 'Mastercard', emoji: '💳' };
  if (/^3[47]/.test(n)) return { nome: 'Amex', emoji: '💳' };
  if (/^6(?:011|5)/.test(n)) return { nome: 'Elo', emoji: '💳' };
  return { nome: 'Cartão', emoji: '💳' };
}

function mascaraCartao(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function mascaraValidade(v) {
  return v.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');
}

function mascaraTelefone(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

// ─── Seção colapsável ─────────────────────────────────────────────────────────
function Secao({ titulo, icone, children, defaultAberta = false }) {
  const [aberta, setAberta] = useState(defaultAberta);
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setAberta((a) => !a)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
          <span>{icone}</span> {titulo}
        </span>
        <span className="text-zinc-400 text-sm">{aberta ? '▲' : '▼'}</span>
      </button>
      {aberta && <div className="border-t border-zinc-100 px-4 py-4">{children}</div>}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-[#3CB371] focus:outline-none';

// ─── Seção: Editar Perfil ─────────────────────────────────────────────────────
function EditarPerfil({ usuario, onNomeAtualizado }) {
  const [form, setForm] = useState({
    nome: usuario?.nome || usuario?.name || '',
    telefone: usuario?.telefone || '',
    senhaAtual: '',
    senhaNova: '',
    senhaConfirm: '',
  });
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: '' }));
  }

  async function handleSalvar(e) {
    e.preventDefault();
    const errosV = {};
    if (form.nome.trim().length < 2) errosV.nome = 'Nome obrigatório.';
    if (form.senhaNova && form.senhaNova.length < 6) errosV.senhaNova = 'Mínimo 6 caracteres.';
    if (form.senhaNova && form.senhaNova !== form.senhaConfirm) errosV.senhaConfirm = 'Senhas não coincidem.';
    if (form.senhaNova && !form.senhaAtual) errosV.senhaAtual = 'Informe a senha atual.';
    if (Object.keys(errosV).length > 0) { setErros(errosV); return; }

    setSalvando(true);
    try {
      const payload = { nome: form.nome.trim() };
      if (form.telefone) payload.telefone = form.telefone;
      if (form.senhaNova) { payload.senhaAtual = form.senhaAtual; payload.senhaNova = form.senhaNova; }
      const { data } = await usuariosApi.atualizarPerfil(payload);
      persistTokenFromResponse(data);
      onNomeAtualizado?.(form.nome.trim());
      setSucesso('Perfil atualizado com sucesso!');
      setForm((f) => ({ ...f, senhaAtual: '', senhaNova: '', senhaConfirm: '' }));
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? '';
      setErros({ geral: msg || 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSalvar} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs text-zinc-500">Nome</label>
        <input value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Seu nome" className={inputClass} />
        {erros.nome && <p className="mt-0.5 text-xs text-red-500">{erros.nome}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-500">Telefone</label>
        <input value={form.telefone} onChange={(e) => set('telefone', mascaraTelefone(e.target.value))} placeholder="(00) 00000-0000" className={inputClass} />
      </div>

      <hr className="border-zinc-100" />
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Alterar senha (opcional)</p>

      <div>
        <label className="mb-1 block text-xs text-zinc-500">Senha atual</label>
        <input type="password" value={form.senhaAtual} onChange={(e) => set('senhaAtual', e.target.value)} placeholder="••••••" className={inputClass} />
        {erros.senhaAtual && <p className="mt-0.5 text-xs text-red-500">{erros.senhaAtual}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs text-zinc-500">Nova senha</label>
        <input type="password" value={form.senhaNova} onChange={(e) => set('senhaNova', e.target.value)} placeholder="••••••" className={inputClass} />
        {erros.senhaNova && <p className="mt-0.5 text-xs text-red-500">{erros.senhaNova}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs text-zinc-500">Confirmar nova senha</label>
        <input type="password" value={form.senhaConfirm} onChange={(e) => set('senhaConfirm', e.target.value)} placeholder="••••••" className={inputClass} />
        {erros.senhaConfirm && <p className="mt-0.5 text-xs text-red-500">{erros.senhaConfirm}</p>}
      </div>

      {erros.geral && <p className="text-center text-sm text-red-500">{erros.geral}</p>}
      {sucesso && <p className="text-center text-sm text-green-600">✅ {sucesso}</p>}

      <button type="submit" disabled={salvando}
        className="mt-1 w-full rounded-xl bg-[#3CB371] py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
        {salvando ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  );
}

// ─── Seção: Endereço ──────────────────────────────────────────────────────────
function EnderecoEntrega() {
  const [endereco, setEnderecoState] = useState(getEndereco);
  const [editando, setEditando] = useState(false);
  const [temp, setTemp] = useState('');

  function iniciarEdicao() { setTemp(endereco); setEditando(true); }
  function salvar() {
    setEndereco(temp);
    setEnderecoState(temp);
    setEditando(false);
  }

  if (editando) {
    return (
      <div className="flex flex-col gap-2">
        <input value={temp} onChange={(e) => setTemp(e.target.value)}
          placeholder="Rua, número, bairro, cidade" className={inputClass} autoFocus />
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditando(false)}
            className="flex-1 rounded-xl border border-zinc-200 py-2 text-sm text-zinc-500 hover:bg-zinc-100">
            Cancelar
          </button>
          <button type="button" onClick={salvar}
            className="flex-1 rounded-xl bg-[#3CB371] py-2 text-sm font-semibold text-white hover:opacity-90">
            Salvar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-zinc-700">{endereco || <span className="text-zinc-400">Não definido</span>}</p>
      <button type="button" onClick={iniciarEdicao}
        className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100">
        ✏️ Editar
      </button>
    </div>
  );
}

// ─── Seção: Cartões ───────────────────────────────────────────────────────────
function MeusCartoes() {
  const [cartoes, setCartoes] = useState(getCartoes);
  const [adicionando, setAdicionando] = useState(false);
  const [form, setForm] = useState({ numero: '', nome: '', validade: '', });
  const [erros, setErros] = useState({});

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: '' }));
  }

  function validar() {
    const e = {};
    const digits = form.numero.replace(/\D/g, '');
    if (digits.length < 16) e.numero = 'Número inválido.';
    if (form.nome.trim().length < 3) e.nome = 'Nome obrigatório.';
    const val = form.validade.replace(/\D/g, '');
    if (val.length !== 4) e.validade = 'Validade inválida.';
    return e;
  }

  function handleAdicionar(e) {
    e.preventDefault();
    const errosV = validar();
    if (Object.keys(errosV).length > 0) { setErros(errosV); return; }

    const digits = form.numero.replace(/\D/g, '');
    const bandeira = detectarBandeira(digits);
    const novoCartao = {
      id: Date.now().toString(),
      ultimos4: digits.slice(-4),
      nome: form.nome.trim().toUpperCase(),
      validade: form.validade,
      bandeira: bandeira.nome,
      emoji: bandeira.emoji,
    };
    const novos = [...cartoes, novoCartao];
    salvarCartoes(novos);
    setCartoes(novos);
    setAdicionando(false);
    setForm({ numero: '', nome: '', validade: '' });
  }

  function remover(id) {
    const novos = cartoes.filter((c) => c.id !== id);
    salvarCartoes(novos);
    setCartoes(novos);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Lista de cartões */}
      {cartoes.length === 0 && !adicionando && (
        <p className="text-center text-sm text-zinc-400 py-2">Nenhum cartão cadastrado.</p>
      )}
      {cartoes.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{c.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-zinc-800">{c.bandeira} •••• {c.ultimos4}</p>
              <p className="text-xs text-zinc-500">{c.nome} · {c.validade}</p>
            </div>
          </div>
          <button type="button" onClick={() => remover(c.id)}
            className="text-xs text-red-400 underline hover:text-red-600">
            Remover
          </button>
        </div>
      ))}

      {/* Formulário de novo cartão */}
      {adicionando && (
        <form onSubmit={handleAdicionar} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-700">Novo cartão</p>

          <div>
            <input
              placeholder="Número do cartão"
              value={form.numero}
              onChange={(e) => set('numero', mascaraCartao(e.target.value))}
              inputMode="numeric"
              className={inputClass}
            />
            {erros.numero && <p className="mt-0.5 text-xs text-red-500">{erros.numero}</p>}
          </div>

          <div>
            <input
              placeholder="Nome impresso no cartão"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value.toUpperCase())}
              className={inputClass}
            />
            {erros.nome && <p className="mt-0.5 text-xs text-red-500">{erros.nome}</p>}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <input
                placeholder="Validade (MM/AA)"
                value={form.validade}
                onChange={(e) => set('validade', mascaraValidade(e.target.value))}
                inputMode="numeric"
                className={inputClass}
              />
              {erros.validade && <p className="mt-0.5 text-xs text-red-500">{erros.validade}</p>}
            </div>
            <div className="flex-1">
              <input
                placeholder="CVV"
                maxLength={4}
                inputMode="numeric"
                onChange={() => {}}
                className={inputClass}
              />
              <p className="mt-0.5 text-xs text-zinc-400">Não armazenado</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => { setAdicionando(false); setErros({}); }}
              className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-500 hover:bg-zinc-100">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 rounded-xl bg-[#3CB371] py-2.5 text-sm font-bold text-white hover:opacity-90">
              Salvar cartão
            </button>
          </div>
        </form>
      )}

      {!adicionando && (
        <button type="button" onClick={() => setAdicionando(true)}
          className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm font-semibold text-zinc-500 hover:border-[#3CB371] hover:text-[#3CB371] transition">
          + Adicionar cartão
        </button>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function LojaPerfil() {
  const navigate = useNavigate();

  const usuario = useMemo(() => {
    const token = getStoredToken();
    return token ? decodeToken(token) : null;
  }, []);

  const nomeInicial = usuario?.nome ?? usuario?.name ?? usuario?.sub ?? 'Usuário';
  const [nomeExibido, setNomeExibido] = useState(nomeInicial);

  function handleLogout() {
    clearStoredToken();
    navigate('/login', { replace: true });
  }

  const nome = nomeExibido;
  const email = usuario?.email ?? '';
  const initials = nome.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-[#2D7A4F] to-[#3CB371]">

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaHeader />
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden rounded-t-[22px] bg-white">
        <div className="flex-1 overflow-y-auto px-4 py-6">

          {/* Avatar + nome */}
          <div className="flex flex-col items-center gap-3 pb-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2D7A4F] text-2xl font-bold text-white">
              {initials || '👤'}
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-zinc-800">{nome}</p>
              {email && <p className="mt-0.5 text-sm text-zinc-500">{email}</p>}
            </div>
          </div>

          <hr className="mb-4 border-zinc-100" />

          {/* Seções */}
          <div className="flex flex-col gap-3">

            <Secao titulo="Endereço de entrega" icone="📍" defaultAberta>
              <EnderecoEntrega />
            </Secao>

            <Secao titulo="Meus cartões" icone="💳">
              <MeusCartoes />
            </Secao>

            <Secao titulo="Editar perfil" icone="✏️">
              <EditarPerfil usuario={usuario} onNomeAtualizado={setNomeExibido} />
            </Secao>

          </div>

          {/* Sair */}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full rounded-2xl bg-[#E5E7EB] py-3 text-base font-bold text-zinc-600 transition hover:bg-zinc-300"
          >
            Sair da conta
          </button>

        </div>
      </div>

      <div className="mx-auto w-full max-w-lg shrink-0">
        <LojaBottomNav />
      </div>
    </div>
  );
}
