import { usuariosApi } from "@/services/api";
import fotoCapa from "@assets/images/fotoCapa.png";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/* ── Validação de CPF (algoritmo dos dígitos verificadores) ── */
function validarCPF(cpf) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // todos iguais (ex: 111.111.111-11)

  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(digits[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 || rest === 11 ? 0 : rest;
  };

  return calc(9) === parseInt(digits[9]) && calc(10) === parseInt(digits[10]);
}

/* ── Máscara CPF: 000.000.000-00 ── */
function mascaraCPF(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/* ── Máscara CEP: 00000-000 ── */
function mascaraCEP(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

/* ── Máscara telefone: (00) 00000-0000 ── */
function mascaraTelefone(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

const INPUT_CLASS =
  "h-[38px] w-full rounded-[20px] border-[3px] border-solid border-[#3CB371] bg-white/80 pl-3 pr-3 text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#3CB371]/40 disabled:opacity-50";

const LABEL_CLASS = "text-xs font-semibold text-white/80 pl-1";

export default function Cadastro() {
  const navigate = useNavigate();

  /* Campos principais */
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  /* Endereço */
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  /* Estados de UI */
  const [cepStatus, setCepStatus] = useState("idle"); // idle | buscando | ok | erro
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  /* ── Busca CEP na ViaCEP ── */
  async function buscarCEP(valor) {
    const digits = valor.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepStatus("buscando");
    setRua(""); setBairro(""); setCidade(""); setEstado("");

    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepStatus("erro");
        return;
      }

      setRua(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setEstado(data.uf || "");
      setCepStatus("ok");
    } catch {
      setCepStatus("erro");
    }
  }

  function handleCepChange(e) {
    const masked = mascaraCEP(e.target.value);
    setCep(masked);
    setCepStatus("idle");
    if (masked.replace(/\D/g, "").length === 8) buscarCEP(masked);
  }

  /* ── Submit ── */
  async function handleCadastro(e) {
    e.preventDefault();
    setErro("");

    if (!nome.trim() || !cpf.trim() || !email.trim() || !senha) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!validarCPF(cpf)) {
      setErro("CPF inválido. Verifique os números e tente novamente.");
      return;
    }

    if (email.trim().length < 5 || !email.includes("@")) {
      setErro("Insira um e-mail válido.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const cepDigits = cep.replace(/\D/g, "");
    if (cepDigits.length > 0 && cepStatus === "erro") {
      setErro("CEP inválido. Verifique e tente novamente.");
      return;
    }

    const payload = {
      nome: nome.trim(),
      cpf: cpf.replace(/\D/g, ""),
      email: email.trim().toLowerCase(),
      senha,
      ...(telefone && { telefone: telefone.replace(/\D/g, "") }),
      ...(cepDigits.length === 8 && {
        endereco: {
          cep: cepDigits,
          rua: rua.trim(),
          numero: numero.trim(),
          complemento: complemento.trim() || undefined,
          bairro: bairro.trim(),
          cidade: cidade.trim(),
          estado: estado.trim(),
        },
      }),
    };

    setLoading(true);
    try {
      await usuariosApi.cadastro(payload);
      setSucesso(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.erro ||
        err.response?.data?.error ||
        err.message ||
        "Não foi possível realizar o cadastro. Tente novamente.";
      setErro(typeof msg === "string" ? msg : "Erro ao registrar.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Tela de sucesso ── */
  if (sucesso) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2D7A4F] to-[#3CB371] px-4 pb-10 pt-8 font-sans">
        <img
          src={fotoCapa}
          alt="NeloreBurguer"
          className="mb-6 h-[143px] w-[253px] max-w-full object-contain"
        />
        <div className="flex w-full max-w-[300px] flex-col items-center gap-4 text-center">
          <span className="text-5xl">✅</span>
          <h2 className="text-xl font-bold text-white">Cadastro realizado!</h2>
          <p className="text-sm text-white/80">
            Sua conta foi criada com sucesso. Faça login para continuar.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-2 h-[38px] w-full rounded-[20px] border-[3px] border-white bg-white font-bold text-[#2D7A4F] transition-all hover:bg-white/90"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  /* ── Formulário ── */
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2D7A4F] to-[#3CB371] px-4 pb-10 pt-8 font-sans text-[13px] text-white">
      <div className="flex flex-row items-center justify-center pb-5">
        <img
          src={fotoCapa}
          alt="NeloreBurguer"
          className="h-[143px] w-[253px] max-w-full object-contain"
        />
      </div>

      <h1 className="mb-6 text-center text-xl font-bold text-white">
        Criar Conta
      </h1>

      <form
        onSubmit={handleCadastro}
        className="flex w-full max-w-[300px] flex-col gap-3"
      >
        {/* Nome */}
        <div className="flex flex-col gap-1">
          <label className={LABEL_CLASS}>Nome completo *</label>
          <input
            type="text"
            placeholder="Seu nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={loading}
            className={INPUT_CLASS}
          />
        </div>

        {/* CPF */}
        <div className="flex flex-col gap-1">
          <label className={LABEL_CLASS}>CPF *</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(mascaraCPF(e.target.value))}
            disabled={loading}
            className={INPUT_CLASS}
          />
        </div>

        {/* Telefone */}
        <div className="flex flex-col gap-1">
          <label className={LABEL_CLASS}>Telefone (opcional)</label>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
            disabled={loading}
            className={INPUT_CLASS}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className={LABEL_CLASS}>E-mail *</label>
          <input
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className={INPUT_CLASS}
          />
        </div>

        {/* Senha */}
        <div className="flex flex-col gap-1">
          <label className={LABEL_CLASS}>Senha * (mín. 6 caracteres)</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={loading}
            className={INPUT_CLASS}
          />
        </div>

        {/* Separador endereço */}
        <div className="mt-1 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/30" />
          <span className="text-xs text-white/60">Endereço (opcional)</span>
          <div className="h-px flex-1 bg-white/30" />
        </div>

        {/* CEP */}
        <div className="flex flex-col gap-1">
          <label className={LABEL_CLASS}>CEP</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="00000-000"
              value={cep}
              onChange={handleCepChange}
              disabled={loading}
              className={`${INPUT_CLASS} pr-8`}
            />
            {cepStatus === "buscando" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/60">
                ⏳
              </span>
            )}
            {cepStatus === "ok" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-400">
                ✓
              </span>
            )}
            {cepStatus === "erro" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-400">
                ✗
              </span>
            )}
          </div>
          {cepStatus === "erro" && (
            <p className="pl-1 text-xs text-red-400">CEP não encontrado.</p>
          )}
        </div>

        {/* Rua */}
        <div className="flex flex-col gap-1">
          <label className={LABEL_CLASS}>Rua</label>
          <input
            type="text"
            placeholder="Nome da rua"
            value={rua}
            onChange={(e) => setRua(e.target.value)}
            disabled={loading}
            className={INPUT_CLASS}
          />
        </div>

        {/* Número + Complemento */}
        <div className="flex gap-2">
          <div className="flex w-[35%] flex-col gap-1">
            <label className={LABEL_CLASS}>Número</label>
            <input
              type="text"
              placeholder="Nº"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              disabled={loading}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className={LABEL_CLASS}>Complemento</label>
            <input
              type="text"
              placeholder="Apto, bloco..."
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              disabled={loading}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* Bairro */}
        <div className="flex flex-col gap-1">
          <label className={LABEL_CLASS}>Bairro</label>
          <input
            type="text"
            placeholder="Bairro"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            disabled={loading}
            className={INPUT_CLASS}
          />
        </div>

        {/* Cidade + Estado */}
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <label className={LABEL_CLASS}>Cidade</label>
            <input
              type="text"
              placeholder="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              disabled={loading}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex w-[28%] flex-col gap-1">
            <label className={LABEL_CLASS}>UF</label>
            <input
              type="text"
              placeholder="UF"
              maxLength={2}
              value={estado}
              onChange={(e) => setEstado(e.target.value.toUpperCase())}
              disabled={loading}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <p className="text-center text-sm text-red-300" role="alert">
            {erro}
          </p>
        )}

        {/* Botão */}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 h-[38px] rounded-[20px] border-[3px] border-solid border-white bg-white font-bold text-[#2D7A4F] transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Registrando..." : "Criar conta"}
        </button>
      </form>

      <div className="mt-6 text-center text-white">
        <p>
          Já tem conta?{" "}
          <Link to="/login" className="underline hover:text-[#E89500]">
            Faça login aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
