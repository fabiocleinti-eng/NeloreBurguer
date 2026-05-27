import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RocketLoader } from '@/components/RocketLoader';
import { cardapioApi } from '@/services/api';

function lerArquivoComoDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function BotaoUpload({ onArquivo, children }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) onArquivo(file, await lerArquivoComoDataURL(file));
          e.target.value = '';
        }}
      />
      <button type="button" onClick={() => ref.current?.click()}>{children}</button>
    </>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = ['Categorias', 'Itens'];

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function RestauranteCardapio() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Categorias');

  return (
    <div className="flex min-h-screen flex-col bg-[#0F1E34] font-sans">

      {/* Header */}
      <header className="flex items-center gap-3 bg-[#1A2B4A] px-5 py-4 shadow">
        <button type="button" onClick={() => navigate('/restaurante/dashboard')} className="text-white text-xl">‹</button>
        <h1 className="text-lg font-bold text-white">Cardápio</h1>
      </header>

      {/* Tabs */}
      <div className="mx-auto flex w-full max-w-lg gap-2 px-4 pt-4">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${tab === t ? 'bg-[#00C4B4] text-[#0F1E34]' : 'border border-[#00C4B4]/40 text-[#00C4B4]/70 hover:border-[#00C4B4]'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        {tab === 'Categorias' ? <TabCategorias /> : <TabItens />}
      </div>
    </div>
  );
}

// ─── Tab: Categorias ──────────────────────────────────────────────────────────
function TabCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirForm, setAbrirForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', descricao: '', destaque: '' });
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      // Usa o restauranteId salvo na sessão
      const restauranteId = sessionStorage.getItem('nelore_restaurante_id') || '';
      const { data } = await cardapioApi.categoriasPorRestaurante(restauranteId);
      const lista = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setCategorias(lista);
    } catch {
      setCategorias([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: '' }));
  }

  async function handleSalvar(e) {
    e.preventDefault();
    if (!form.titulo.trim()) { setErros({ titulo: 'Título obrigatório.' }); return; }
    setSalvando(true);
    try {
      await cardapioApi.criarCategoria({
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        destaque: form.destaque.trim() || undefined,
      });
      setMsgSucesso('Categoria criada!');
      setForm({ titulo: '', descricao: '', destaque: '' });
      setAbrirForm(false);
      carregar();
      setTimeout(() => setMsgSucesso(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erro ao salvar.';
      setErros({ geral: msg });
    } finally {
      setSalvando(false);
    }
  }

  const inputClass =
    'h-[38px] w-full rounded-[20px] border-[3px] border-[#00C4B4] bg-[#1A2B4A] pl-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#00C4B4]/40';

  return (
    <div className="flex flex-col gap-3">
      {msgSucesso && (
        <div className="rounded-xl bg-green-800/40 px-4 py-2 text-center text-sm text-green-300">✅ {msgSucesso}</div>
      )}

      {!abrirForm && (
        <button type="button" onClick={() => { setAbrirForm(true); setErros({}); }}
          className="w-full rounded-xl bg-[#00C4B4] py-3 font-semibold text-[#0F1E34] hover:opacity-90">
          + Nova Categoria
        </button>
      )}

      {abrirForm && (
        <form onSubmit={handleSalvar} className="flex flex-col gap-3 rounded-2xl border-2 border-[#00C4B4]/40 bg-[#1A2B4A]/60 p-5">
          <p className="font-bold text-white">Nova Categoria</p>
          <div>
            <input placeholder="Título *" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} className={inputClass} />
            {erros.titulo && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.titulo}</p>}
          </div>
          <input placeholder="Destaque (ex: Mais pedido)" value={form.destaque} onChange={(e) => set('destaque', e.target.value)} className={inputClass} />
          <input placeholder="Descrição (opcional)" value={form.descricao} onChange={(e) => set('descricao', e.target.value)} className={inputClass} />
          {erros.geral && <p className="text-center text-sm text-red-300">{erros.geral}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setAbrirForm(false); setErros({}); }}
              className="flex-1 rounded-xl border-2 border-white/30 py-2 text-sm text-white/70">Cancelar</button>
            <button type="submit" disabled={salvando}
              className="flex-1 rounded-xl bg-[#00C4B4] py-2 font-semibold text-[#0F1E34] disabled:opacity-50">
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <RocketLoader mensagem="Carregando categorias…" />
      ) : categorias.length === 0 ? (
        <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-8 text-center">
          <p className="text-3xl">📋</p>
          <p className="mt-2 text-sm text-white/60">Nenhuma categoria cadastrada.</p>
          <p className="mt-1 text-xs text-white/30">Clique em "+ Nova Categoria" para começar.</p>
        </div>
      ) : (
        categorias.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-2xl border border-[#00C4B4]/30 bg-[#1A2B4A]/60 px-4 py-4">
            <div className="flex-1">
              <p className="font-semibold text-white">{cat.titulo || cat.nome}</p>
              {cat.destaque  && <p className="text-xs text-[#00C4B4]/80">{cat.destaque}</p>}
              {cat.descricao && <p className="text-xs text-white/40">{cat.descricao}</p>}
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(`Excluir categoria "${cat.titulo || cat.nome}"?`)) return;
                await cardapioApi.deletarCategoria(cat.id).catch(() => {});
                carregar();
              }}
              className="ml-3 shrink-0 rounded-xl border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition"
            >
              Excluir
            </button>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Tab: Itens ───────────────────────────────────────────────────────────────
function TabItens() {
  const [itens, setItens] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirForm, setAbrirForm] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '', preco: '', categoriaId: '', disponivel: true, foto: null, fotoPreview: null });
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      const restauranteId = sessionStorage.getItem('nelore_restaurante_id') || '';
      const [resCats] = await Promise.all([
        cardapioApi.categoriasPorRestaurante(restauranteId),
      ]);
      const cats = Array.isArray(resCats.data) ? resCats.data : resCats.data?.data ?? [];
      setCategorias(cats);

      // Busca itens de todas as categorias
      const todosItens = await Promise.all(
        cats.map((cat) =>
          cardapioApi.itensPorCategoria(cat.id)
            .then(({ data }) => {
              const lista = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
              return lista.map((item) => ({ ...item, _categoriaTitulo: cat.titulo || cat.nome, _categoriaId: cat.id }));
            })
            .catch(() => [])
        )
      );
      setItens(todosItens.flat());
    } catch {
      setItens([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: '' }));
  }

  function validar() {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Nome obrigatório.';
    const precoNum = parseFloat(form.preco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) e.preco = 'Preço inválido.';
    if (!form.categoriaId) e.categoriaId = 'Selecione uma categoria.';
    return e;
  }

  async function handleSalvar(e) {
    e.preventDefault();
    const errosV = validar();
    if (Object.keys(errosV).length > 0) { setErros(errosV); return; }
    setSalvando(true);
    try {
      const precoEmCentavos = Math.round(parseFloat(form.preco.replace(',', '.')) * 100);
      const { data: novoItem } = await cardapioApi.criarItem({
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || undefined,
        preco_centavos: precoEmCentavos,
        categoria_id: form.categoriaId,
        disponivel: form.disponivel,
      });
      // Se havia foto selecionada, vincula ao item recém-criado
      if (form.foto && novoItem?.id) {
        await cardapioApi.atualizarItemImagem(novoItem.id, form.categoriaId, form.foto).catch(() => {});
      }
      setMsgSucesso('Item criado!');
      setForm({ nome: '', descricao: '', preco: '', categoriaId: '', disponivel: true, foto: null, fotoPreview: null });
      setAbrirForm(false);
      carregar();
      setTimeout(() => setMsgSucesso(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erro ao salvar.';
      setErros({ geral: msg });
    } finally {
      setSalvando(false);
    }
  }

  const inputClass =
    'h-[38px] w-full rounded-[20px] border-[3px] border-[#00C4B4] bg-[#1A2B4A] pl-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#00C4B4]/40';

  return (
    <div className="flex flex-col gap-3">
      {msgSucesso && (
        <div className="rounded-xl bg-green-800/40 px-4 py-2 text-center text-sm text-green-300">✅ {msgSucesso}</div>
      )}

      {!abrirForm && (
        <button type="button" onClick={() => { setAbrirForm(true); setErros({}); }}
          className="w-full rounded-xl bg-[#00C4B4] py-3 font-semibold text-[#0F1E34] hover:opacity-90">
          + Novo Item
        </button>
      )}

      {abrirForm && (
        <form onSubmit={handleSalvar} className="flex flex-col gap-3 rounded-2xl border-2 border-[#00C4B4]/40 bg-[#1A2B4A]/60 p-5">
          <p className="font-bold text-white">Novo Item</p>

          <div>
            <input placeholder="Nome do item *" value={form.nome} onChange={(e) => set('nome', e.target.value)} className={inputClass} />
            {erros.nome && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.nome}</p>}
          </div>

          <input placeholder="Descrição (opcional)" value={form.descricao} onChange={(e) => set('descricao', e.target.value)} className={inputClass} />

          <div>
            <input
              placeholder="Preço (R$) ex: 29,90"
              value={form.preco}
              onChange={(e) => set('preco', e.target.value.replace(/[^0-9,\.]/g, ''))}
              className={inputClass}
            />
            {erros.preco && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.preco}</p>}
          </div>

          <div>
            <select
              value={form.categoriaId}
              onChange={(e) => set('categoriaId', e.target.value)}
              className="h-[38px] w-full rounded-[20px] border-[3px] border-[#00C4B4] bg-[#1A2B4A] pl-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00C4B4]/40"
            >
              <option value="">Selecione a categoria *</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.titulo || cat.nome}</option>
              ))}
            </select>
            {erros.categoriaId && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.categoriaId}</p>}
          </div>

          {/* Foto do item */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-[#00C4B4]/40 bg-[#0F1E34]">
              {form.fotoPreview ? (
                <img src={form.fotoPreview} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl opacity-30">🍽️</div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-white/50">Foto do item (opcional)</p>
              <BotaoUpload onArquivo={(_file, preview) => { set('fotoPreview', preview); set('foto', preview); }}>
                <div className="rounded-xl border border-[#00C4B4]/50 px-4 py-1.5 text-xs font-semibold text-[#00C4B4] hover:bg-[#00C4B4]/10 transition">
                  📷 {form.fotoPreview ? 'Trocar foto' : 'Adicionar foto'}
                </div>
              </BotaoUpload>
            </div>
          </div>

          <label className="flex items-center gap-2 pl-1 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.disponivel}
              onChange={(e) => set('disponivel', e.target.checked)}
              className="accent-[#00C4B4]"
            />
            Disponível no cardápio
          </label>

          {erros.geral && <p className="text-center text-sm text-red-300">{erros.geral}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => { setAbrirForm(false); setErros({}); }}
              className="flex-1 rounded-xl border-2 border-white/30 py-2 text-sm text-white/70">Cancelar</button>
            <button type="submit" disabled={salvando}
              className="flex-1 rounded-xl bg-[#00C4B4] py-2 font-semibold text-[#0F1E34] disabled:opacity-50">
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <RocketLoader mensagem="Carregando itens…" />
      ) : itens.length === 0 ? (
        <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-8 text-center">
          <p className="text-3xl">🍔</p>
          <p className="mt-2 text-sm text-white/60">Nenhum item cadastrado.</p>
          <p className="mt-1 text-xs text-white/30">Crie uma categoria primeiro, depois clique em "+ Novo Item".</p>
        </div>
      ) : (
        itens.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-[#00C4B4]/30 bg-[#1A2B4A]/60 px-4 py-4">
            {/* Foto do item */}
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#00C4B4]/20 bg-[#0F1E34]">
              {item.imagem ? (
                <img src={item.imagem} alt={item.nome} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl opacity-20">🍽️</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{item.nome || item.name}</p>
              <p className="text-xs text-[#00C4B4]/80">{item._categoriaTitulo}</p>
              {item.descricao && <p className="text-xs text-white/40 truncate">{item.descricao}</p>}
              <p className="mt-1 font-bold text-[#00C4B4]">
                R$ {((item.preco_centavos ?? item.precoCentavos ?? 0) / 100).toFixed(2).replace('.', ',')}
              </p>
              <p className={`text-xs ${item.disponivel ? 'text-green-400' : 'text-red-400'}`}>
                {item.disponivel ? 'Disponível' : 'Indisponível'}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(`Excluir item "${item.nome || item.name}"?`)) return;
                await cardapioApi.deletarItem(item._categoriaId ?? item.categoria_id, item.id).catch(() => {});
                carregar();
              }}
              className="ml-3 shrink-0 rounded-xl border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition"
            >
              Excluir
            </button>
          </div>
        ))
      )}
    </div>
  );
}
