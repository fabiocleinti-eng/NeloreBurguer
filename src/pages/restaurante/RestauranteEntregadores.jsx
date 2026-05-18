import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { entregadoresApi } from '@/services/api';

function mascaraTelefone(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

const formInicial = {
  nome: '',
  email: '',
  telefone: '',
  veiculo: '',
  placa: '',
};

export default function RestauranteEntregadores() {
  const navigate = useNavigate();
  const [entregadores, setEntregadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirForm, setAbrirForm] = useState(false);
  const [form, setForm] = useState(formInicial);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('');

  // ─── Carregar lista ─────────────────────────────────────────────────────────
  async function carregarEntregadores() {
    setCarregando(true);
    try {
      const { data } = await entregadoresApi.listar();
      const lista = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setEntregadores(lista);
    } catch {
      setEntregadores([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregarEntregadores(); }, []);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: '' }));
  }

  function validar() {
    const e = {};
    if (form.nome.trim().length < 3) e.nome = 'Nome obrigatório.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido.';
    if (!form.veiculo.trim()) e.veiculo = 'Informe o veículo.';
    return e;
  }

  async function handleCadastrar(e) {
    e.preventDefault();
    const errosV = validar();
    if (Object.keys(errosV).length > 0) { setErros(errosV); return; }

    setSalvando(true);
    try {
      await entregadoresApi.cadastrar({
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone || undefined,
        veiculo: form.veiculo.trim(),
        placa: form.placa.trim().toUpperCase() || undefined,
      });
      setMsgSucesso('Entregador cadastrado com sucesso!');
      setForm(formInicial);
      setAbrirForm(false);
      carregarEntregadores();
      setTimeout(() => setMsgSucesso(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erro ao cadastrar.';
      setErros({ geral: msg });
    } finally {
      setSalvando(false);
    }
  }

  async function handleToggleAtivo(id, ativo) {
    try {
      await entregadoresApi.atualizarStatus(id, !ativo);
      carregarEntregadores();
    } catch { /* silencioso */ }
  }

  const inputClass =
    'h-[38px] w-full rounded-[20px] border-[3px] border-[#FFA801] bg-[#636363] pl-3 text-[#FFA801] placeholder:text-[#FFA801]/60 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/40';

  return (
    <div className="flex min-h-screen flex-col bg-[#636363] font-sans text-[#FFA801]">

      {/* Header */}
      <header className="flex items-center gap-3 bg-[#701515] px-5 py-4 shadow">
        <button type="button" onClick={() => navigate('/restaurante/dashboard')} className="text-white text-xl">‹</button>
        <h1 className="text-lg font-bold text-white">Entregadores</h1>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">

        {/* Mensagem de sucesso */}
        {msgSucesso && (
          <div className="mb-4 rounded-xl bg-green-800/40 px-4 py-2 text-center text-sm text-green-300">
            ✅ {msgSucesso}
          </div>
        )}

        {/* Botão adicionar */}
        {!abrirForm && (
          <button
            type="button"
            onClick={() => { setAbrirForm(true); setErros({}); }}
            className="mb-6 w-full rounded-xl bg-[#FFA801] py-3 font-semibold text-[#636363] hover:opacity-90"
          >
            + Cadastrar Entregador
          </button>
        )}

        {/* Formulário de cadastro */}
        {abrirForm && (
          <form onSubmit={handleCadastrar} className="mb-6 flex flex-col gap-3 rounded-2xl border-2 border-[#FFA801]/40 bg-black/20 p-5">
            <p className="font-bold text-white">Novo Entregador</p>

            <div>
              <input placeholder="Nome completo" value={form.nome} onChange={(e) => set('nome', e.target.value)} className={inputClass} />
              {erros.nome && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.nome}</p>}
            </div>

            <div>
              <input type="email" placeholder="E-mail" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
              {erros.email && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.email}</p>}
            </div>

            <input
              placeholder="Telefone (opcional)"
              value={form.telefone}
              onChange={(e) => set('telefone', mascaraTelefone(e.target.value))}
              className={inputClass}
            />

            <div>
              <input placeholder="Veículo (ex: Moto, Bicicleta)" value={form.veiculo} onChange={(e) => set('veiculo', e.target.value)} className={inputClass} />
              {erros.veiculo && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.veiculo}</p>}
            </div>

            <input
              placeholder="Placa (opcional)"
              value={form.placa}
              onChange={(e) => set('placa', e.target.value.toUpperCase())}
              maxLength={8}
              className={inputClass}
            />

            {erros.geral && <p className="text-center text-sm text-red-300">{erros.geral}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setAbrirForm(false); setForm(formInicial); setErros({}); }}
                className="flex-1 rounded-xl border-2 border-white/30 py-2 text-sm text-white/70 hover:border-white/50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="flex-1 rounded-xl bg-[#FFA801] py-2 font-semibold text-[#636363] hover:opacity-90 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        {/* Lista de entregadores */}
        {carregando ? (
          <p className="text-center text-sm text-white/50">Carregando entregadores…</p>
        ) : entregadores.length === 0 ? (
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-8 text-center">
            <p className="text-4xl">🛵</p>
            <p className="mt-2 text-sm text-white/60">Nenhum entregador cadastrado.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entregadores.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border border-[#FFA801]/30 bg-black/20 px-4 py-4">
                <div>
                  <p className="font-semibold text-white">{e.nome}</p>
                  <p className="text-xs text-white/50">{e.email}</p>
                  {e.veiculo && <p className="text-xs text-[#FFA801]/70">🛵 {e.veiculo}{e.placa ? ` · ${e.placa}` : ''}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleAtivo(e.id, e.ativo)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${e.ativo ? 'bg-green-700/50 text-green-300' : 'bg-red-800/50 text-red-300'}`}
                >
                  {e.ativo ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
