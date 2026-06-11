import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { restauranteApi } from '@/services/api';

// ─── Máscaras ────────────────────────────────────────────────────────────────
function mascaraCNPJ(v) {
  return v.replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function mascaraTelefone(v) {
  return v.replace(/\D/g, '')
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function mascaraCEP(v) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

// ─── Validação CNPJ ──────────────────────────────────────────────────────────
function validarCNPJ(cnpj) {
  const n = cnpj.replace(/\D/g, '');
  if (n.length !== 14) return false;
  if (/^(\d)\1+$/.test(n)) return false;

  function calcDigito(base, pesos) {
    const soma = base.split('').reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcDigito(n.slice(0, 12), pesos1);
  const d2 = calcDigito(n.slice(0, 13), pesos2);
  return d1 === Number(n[12]) && d2 === Number(n[13]);
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function RestauranteCadastro() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  });

  const [erros, setErros] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: '' }));
  }

  // ─── Busca CEP ─────────────────────────────────────────────────────────────
  async function buscarCEP(cepMascarado) {
    const digits = cepMascarado.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErros((e) => ({ ...e, cep: 'CEP não encontrado.' }));
        return;
      }
      setForm((f) => ({
        ...f,
        rua: data.logradouro || f.rua,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
        uf: data.uf || f.uf,
      }));
    } catch {
      setErros((e) => ({ ...e, cep: 'Erro ao buscar CEP.' }));
    } finally {
      setLoadingCep(false);
    }
  }

  // ─── Validação ─────────────────────────────────────────────────────────────
  function validar() {
    const e = {};
    if (!validarCNPJ(form.cnpj)) e.cnpj = 'CNPJ inválido.';
    if (form.razao_social.trim().length < 3) e.razao_social = 'Informe a razão social.';
    if (form.nome_fantasia.trim().length < 2) e.nome_fantasia = 'Informe o nome fantasia.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido.';
    if (form.senha.length < 6) e.senha = 'Senha deve ter ao menos 6 caracteres.';
    if (form.senha !== form.confirmarSenha) e.confirmarSenha = 'As senhas não coincidem.';
    if (form.cep.replace(/\D/g, '').length !== 8) e.cep = 'CEP inválido.';
    if (!form.rua.trim()) e.rua = 'Informe a rua.';
    if (!form.cidade.trim()) e.cidade = 'Informe a cidade.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errosValidacao = validar();
    if (Object.keys(errosValidacao).length > 0) {
      setErros(errosValidacao);
      return;
    }

    setLoading(true);
    try {
      await restauranteApi.cadastro({
        nome: form.nome_fantasia.trim(),
        cnpj: form.cnpj.replace(/\D/g, ''),
        email: form.email.trim(),
        senha: form.senha,
        endereco_logradouro: form.rua.trim(),
        endereco_numero: form.numero.trim() || 'S/N',
        endereco_bairro: form.bairro.trim(),
        endereco_cidade: form.cidade.trim(),
        endereco_cep: form.cep.replace(/\D/g, ''),
      });
      setSucesso(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.erro ||
        err.message ||
        'Erro ao cadastrar. Tente novamente.';
      setErros({ geral: typeof msg === 'string' ? msg : 'Erro ao cadastrar.' });
    } finally {
      setLoading(false);
    }
  }

  // ─── Tela de sucesso ───────────────────────────────────────────────────────
  if (sucesso) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F1E34] px-4 text-center text-[#00C4B4]">
        <span className="text-6xl">✅</span>
        <h2 className="mt-4 text-2xl font-bold">Restaurante cadastrado!</h2>
        <p className="mt-2 text-sm text-white/70">
          Agora faça login para acessar o painel.
        </p>
        <button
          type="button"
          onClick={() => navigate('/restaurante/login')}
          className="mt-6 rounded-xl bg-[#00C4B4] px-8 py-3 font-semibold text-[#0F1E34]"
        >
          Ir para o login
        </button>
      </div>
    );
  }

  // ─── Classe padrão dos inputs ──────────────────────────────────────────────
  const inputClass =
    'h-[38px] w-full rounded-[20px] border-[3px] border-[#00C4B4] bg-[#1A2B4A] pl-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#00C4B4]/40';

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0F1E34] px-4 pb-12 pt-8 font-sans text-[#00C4B4]">

      <div className="mb-1 flex items-center gap-3">
        <span className="text-5xl">🚀</span>
        <span className="text-4xl font-extrabold tracking-tight text-white">
          Pede<span className="text-[#00C4B4]">Fácil</span>
        </span>
      </div>
      <p className="mb-6 text-sm font-semibold text-[#00C4B4]/80">Cadastro de Restaurante</p>

      <form onSubmit={handleSubmit} className="flex w-full max-w-[320px] flex-col gap-3">

        {/* ── Dados do restaurante ── */}
        <p className="text-xs font-bold uppercase tracking-wider text-[#00C4B4]/70">Dados do restaurante</p>

        <div>
          <input
            placeholder="CNPJ"
            inputMode="numeric"
            value={form.cnpj}
            onChange={(e) => {
              const masked = mascaraCNPJ(e.target.value);
              set('cnpj', masked);
              const digits = masked.replace(/\D/g, '');
              if (digits.length === 14) {
                setErros((err) => ({
                  ...err,
                  cnpj: validarCNPJ(masked) ? '' : 'CNPJ inválido. Verifique os números.',
                }));
              }
            }}
            className={`${inputClass} ${erros.cnpj ? 'border-red-400' : ''}`}
          />
          {erros.cnpj && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.cnpj}</p>}
        </div>

        <div>
          <input
            placeholder="Razão Social"
            value={form.razao_social}
            onChange={(e) => set('razao_social', e.target.value)}
            className={inputClass}
          />
          {erros.razao_social && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.razao_social}</p>}
        </div>

        <div>
          <input
            placeholder="Nome Fantasia"
            value={form.nome_fantasia}
            onChange={(e) => set('nome_fantasia', e.target.value)}
            className={inputClass}
          />
          {erros.nome_fantasia && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.nome_fantasia}</p>}
        </div>

        <input
          placeholder="Telefone (opcional)"
          value={form.telefone}
          onChange={(e) => set('telefone', mascaraTelefone(e.target.value))}
          className={inputClass}
        />

        {/* ── Acesso ── */}
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#00C4B4]/70">Acesso</p>

        <div>
          <input
            type="email"
            autoComplete="email"
            placeholder="E-mail"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className={inputClass}
          />
          {erros.email && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.email}</p>}
        </div>

        <div>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Senha (mín. 6 caracteres)"
            value={form.senha}
            onChange={(e) => set('senha', e.target.value)}
            className={inputClass}
          />
          {erros.senha && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.senha}</p>}
        </div>

        <div>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirmar senha"
            value={form.confirmarSenha}
            onChange={(e) => set('confirmarSenha', e.target.value)}
            className={inputClass}
          />
          {erros.confirmarSenha && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.confirmarSenha}</p>}
        </div>

        {/* ── Endereço ── */}
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#00C4B4]/70">Endereço</p>

        <div>
          <input
            placeholder="CEP"
            value={form.cep}
            onChange={(e) => {
              const v = mascaraCEP(e.target.value);
              set('cep', v);
              if (v.replace(/\D/g, '').length === 8) buscarCEP(v);
            }}
            className={inputClass}
          />
          {loadingCep && <p className="mt-0.5 pl-3 text-xs text-white/50">Buscando CEP…</p>}
          {erros.cep && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.cep}</p>}
        </div>

        <div>
          <input
            placeholder="Rua"
            value={form.rua}
            onChange={(e) => set('rua', e.target.value)}
            className={inputClass}
          />
          {erros.rua && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.rua}</p>}
        </div>

        <div className="flex gap-2">
          <input
            placeholder="Número"
            value={form.numero}
            onChange={(e) => set('numero', e.target.value)}
            className={`${inputClass} w-1/3`}
          />
          <input
            placeholder="Complemento"
            value={form.complemento}
            onChange={(e) => set('complemento', e.target.value)}
            className={`${inputClass} w-2/3`}
          />
        </div>

        <input
          placeholder="Bairro"
          value={form.bairro}
          onChange={(e) => set('bairro', e.target.value)}
          className={inputClass}
        />

        <div className="flex gap-2">
          <div className="flex-1">
            <input
              placeholder="Cidade"
              value={form.cidade}
              onChange={(e) => set('cidade', e.target.value)}
              className={inputClass}
            />
            {erros.cidade && <p className="mt-0.5 pl-3 text-xs text-red-300">{erros.cidade}</p>}
          </div>
          <input
            placeholder="UF"
            maxLength={2}
            value={form.uf}
            onChange={(e) => set('uf', e.target.value.toUpperCase())}
            className={`${inputClass} w-16`}
          />
        </div>

        {/* ── Erro geral ── */}
        {erros.geral && (
          <p className="text-center text-sm text-red-300" role="alert">{erros.geral}</p>
        )}

        {/* ── Botão ── */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-xl bg-[#00C4B4] py-3 font-semibold text-[#0F1E34] transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Cadastrando…' : 'Cadastrar Restaurante'}
        </button>

        <p className="text-center text-xs text-white/50">
          Já tem conta?{' '}
          <Link to="/restaurante/login" className="text-[#00C4B4] underline">
            Fazer login
          </Link>
        </p>
      </form>
    </div>
  );
}
