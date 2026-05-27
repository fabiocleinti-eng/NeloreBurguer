import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantesApi } from '@/services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function lerArquivoComoDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Upload de imagem (botão estilizado) ──────────────────────────────────────
function BotaoUpload({ onArquivo, children }) {
  const ref = useRef(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) onArquivo(file, await lerArquivoComoDataURL(file));
          e.target.value = '';
        }}
      />
      <button type="button" onClick={() => ref.current?.click()}>
        {children}
      </button>
    </>
  );
}

// ─── Seção com título ─────────────────────────────────────────────────────────
function Secao({ titulo, children }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-[#00C4B4]">{titulo}</h2>
      {children}
    </section>
  );
}

// ─── Input estilizado ─────────────────────────────────────────────────────────
const inputCls =
  'h-[42px] w-full rounded-[20px] border-2 border-[#00C4B4]/40 bg-[#1A2B4A] px-4 text-white placeholder:text-white/30 focus:border-[#00C4B4] focus:outline-none transition';

const textareaCls =
  'w-full rounded-2xl border-2 border-[#00C4B4]/40 bg-[#1A2B4A] px-4 py-3 text-white placeholder:text-white/30 focus:border-[#00C4B4] focus:outline-none transition resize-none';

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function RestaurantePerfil() {
  const navigate = useNavigate();
  const restauranteId = sessionStorage.getItem('nelore_restaurante_id') || '';

  // ── Estado do perfil ────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    nome: '',
    tipo: '',
    descricao: '',
    telefone: '',
    endereco: '',
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [capaPrev, setCapaPrev] = useState(null);
  const [capaFile, setCapaFile] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [msgPerfil, setMsgPerfil] = useState('');
  const [erroPerfil, setErroPerfil] = useState('');

  // ── Estado de salvamento da identidade visual ────────────────────────────────
  const [salvandoVisual, setSalvandoVisual] = useState(false);
  const [msgVisual, setMsgVisual] = useState('');

  // ── Carregar perfil ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!restauranteId) return;
    restaurantesApi
      .buscarPorId(restauranteId)
      .then(({ data }) => {
        const r = data?.data ?? data;
        setForm({
          nome: r?.nome || r?.name || '',
          tipo: r?.tipo || r?.categoria || '',
          descricao: r?.descricao || r?.description || '',
          telefone: r?.telefone || r?.phone || '',
          endereco: r?.endereco || r?.address || '',
        });
        if (r?.imagem || r?.logo) setLogoPreview(r.imagem ?? r.logo);
        if (r?.capa || r?.banner) setCapaPrev(r.capa ?? r.banner);
      })
      .catch(() => {});
  }, [restauranteId]);


  // ── Salvar perfil ────────────────────────────────────────────────────────────
  async function handleSalvarPerfil(e) {
    e.preventDefault();
    setSalvando(true);
    setErroPerfil('');
    setMsgPerfil('');
    try {
      // Envia dados do perfil (sem imagem por ora — upload separado)
      await restaurantesApi.atualizar?.(restauranteId, {
        nome: form.nome.trim(),
        tipo: form.tipo.trim() || undefined,
        descricao: form.descricao.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
        endereco: form.endereco.trim() || undefined,
      });
      setMsgPerfil('Perfil atualizado com sucesso!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erro ao salvar perfil.';
      setErroPerfil(typeof msg === 'string' ? msg : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
      setTimeout(() => { setMsgPerfil(''); setErroPerfil(''); }, 3500);
    }
  }

  // ── Salvar identidade visual (logo + capa) ───────────────────────────────────
  async function handleSalvarVisual() {
    if (!logoFile && !capaFile) return;
    setSalvandoVisual(true);
    setMsgVisual('');
    try {
      await restaurantesApi.atualizar?.(restauranteId, {
        ...(logoPreview && logoFile ? { imagem: logoPreview } : {}),
        ...(capaPrev   && capaFile  ? { capa:   capaPrev   } : {}),
      });
      setLogoFile(null);
      setCapaFile(null);
      setMsgVisual('✅ Identidade visual salva!');
    } catch {
      setMsgVisual('❌ Erro ao salvar imagens.');
    } finally {
      setSalvandoVisual(false);
      setTimeout(() => setMsgVisual(''), 3500);
    }
  }

  function setField(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0F1E34] font-sans">

      {/* Header */}
      <header className="flex items-center gap-3 bg-[#1A2B4A] px-5 py-4 shadow">
        <button type="button" onClick={() => navigate('/restaurante/dashboard')} className="text-xl text-white">‹</button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <span className="font-extrabold text-white">
            Pede<span className="text-[#00C4B4]">Fácil</span>
          </span>
        </div>
        <span className="ml-auto text-sm font-semibold text-white/50">Perfil do Restaurante</span>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-6 flex flex-col gap-8">

        {/* ── SEÇÃO 1: Logo e Capa ──────────────────────────────────────────── */}
        <Secao titulo="Identidade Visual">

          {/* Capa / Banner */}
          <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-[#1A2B4A]">
            {capaPrev ? (
              <img src={capaPrev} alt="Capa" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/20 text-sm">
                Sem foto de capa
              </div>
            )}
            <BotaoUpload onArquivo={(file, preview) => { setCapaFile(file); setCapaPrev(preview); }}>
              <div className="absolute bottom-2 right-2 rounded-xl bg-[#00C4B4] px-3 py-1.5 text-xs font-bold text-[#0F1E34] shadow hover:opacity-90">
                📷 Alterar capa
              </div>
            </BotaoUpload>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[#00C4B4]/50 bg-[#1A2B4A]">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-[#00C4B4]">
                  {form.nome ? form.nome[0].toUpperCase() : '?'}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-white">{form.nome || 'Nome do restaurante'}</p>
              <BotaoUpload onArquivo={(file, preview) => { setLogoFile(file); setLogoPreview(preview); }}>
                <div className="rounded-xl border border-[#00C4B4]/60 px-4 py-2 text-xs font-semibold text-[#00C4B4] hover:bg-[#00C4B4]/10 transition">
                  📷 Trocar logo
                </div>
              </BotaoUpload>
              {logoFile && (
                <p className="text-xs text-white/40">✓ Nova logo selecionada</p>
              )}
            </div>
          </div>

          {/* Feedback + botão salvar visual */}
          {msgVisual && (
            <p className={`text-center text-sm ${msgVisual.startsWith('✅') ? 'text-green-300' : 'text-red-300'}`}>
              {msgVisual}
            </p>
          )}
          {(logoFile || capaFile) && (
            <button
              type="button"
              disabled={salvandoVisual}
              onClick={handleSalvarVisual}
              className="w-full rounded-2xl bg-[#00C4B4] py-3 font-bold text-[#0F1E34] transition hover:opacity-90 disabled:opacity-50"
            >
              {salvandoVisual ? 'Salvando…' : '💾 Salvar Identidade Visual'}
            </button>
          )}
        </Secao>

        {/* ── SEÇÃO 2: Informações do Restaurante ──────────────────────────── */}
        <Secao titulo="Informações do Restaurante">
          <form onSubmit={handleSalvarPerfil} className="flex flex-col gap-3">

            <div>
              <label className="mb-1 block text-xs text-white/50">Nome do restaurante *</label>
              <input
                value={form.nome}
                onChange={(e) => setField('nome', e.target.value)}
                placeholder="Ex: Nelore Burger"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Tipo / Categoria</label>
              <input
                value={form.tipo}
                onChange={(e) => setField('tipo', e.target.value)}
                placeholder="Ex: Hamburgueria, Pizzaria..."
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Descrição</label>
              <textarea
                value={form.descricao}
                onChange={(e) => setField('descricao', e.target.value.slice(0, 500))}
                placeholder="Conte um pouco sobre o seu restaurante..."
                rows={3}
                className={textareaCls}
              />
              <p className="mt-0.5 text-right text-xs text-white/30">{form.descricao.length}/500</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-white/50">Telefone</label>
                <input
                  value={form.telefone}
                  onChange={(e) => setField('telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">Endereço</label>
                <input
                  value={form.endereco}
                  onChange={(e) => setField('endereco', e.target.value)}
                  placeholder="Rua, nº..."
                  className={inputCls}
                />
              </div>
            </div>

            {msgPerfil && (
              <div className="rounded-xl bg-green-800/40 px-4 py-2 text-center text-sm text-green-300">{msgPerfil}</div>
            )}
            {erroPerfil && (
              <div className="rounded-xl bg-red-800/40 px-4 py-2 text-center text-sm text-red-300">{erroPerfil}</div>
            )}

            <button
              type="submit"
              disabled={salvando}
              className="mt-2 w-full rounded-2xl bg-[#00C4B4] py-3 font-bold text-[#0F1E34] transition hover:opacity-90 disabled:opacity-50"
            >
              {salvando ? 'Salvando…' : 'Salvar Perfil'}
            </button>
          </form>
        </Secao>

        <div className="h-8" /> {/* espaço inferior */}
      </div>
    </div>
  );
}
