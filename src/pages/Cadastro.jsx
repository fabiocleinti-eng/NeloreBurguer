import { usuariosApi } from "@/services/api";
import fotoCapa from "@assets/images/fotoCapa.png";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleCadastro(e) {
    e.preventDefault();
    setErro("");

    // Validação básica
    if (!nome.trim() || !email.trim() || !senha) {
      setErro("Preencha todos os campos (nome, email e senha).");
      return;
    }

    if (email.trim().length < 5 || !email.includes("@")) {
      setErro("Insira um email válido.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await usuariosApi.cadastro({
        nome: nome.trim(),
        email: email.trim(),
        senha,
      });

      // Cadastro bem-sucedido
      alert("Cadastro realizado com sucesso! Faça login para continuar.");
      navigate("/login", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.erro ||
        err.response?.data?.error ||
        err.message ||
        "Não foi possível realizar o cadastro. Tente novamente mais tarde.";
      setErro(typeof msg === "string" ? msg : "Erro ao registar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#636363] px-4 pb-10 pt-8 font-sans text-[13px] text-[#FFA801]">
      <div className="flex flex-row items-center justify-center pb-5">
        <img
          src={fotoCapa}
          alt="NeloreBuguer"
          className="h-[143px] w-[253px] max-w-full object-contain"
        />
      </div>

      <h1 className="mb-6 text-center text-xl font-bold text-[#FFA801]">
        Criar Conta
      </h1>

      <form
        onSubmit={handleCadastro}
        className="flex w-full max-w-[300px] flex-col gap-2.5"
      >
        <input
          type="text"
          name="nome"
          placeholder="Nome Completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={loading}
          className="h-[38px] rounded-[20px] border-[3px] border-solid border-[#FFA801] bg-[#636363] pl-2.5 text-[#FFA801] placeholder:text-[#FFA801]/70 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/40 disabled:opacity-50"
        />
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="h-[38px] rounded-[20px] border-[3px] border-solid border-[#FFA801] bg-[#636363] pl-2.5 text-[#FFA801] placeholder:text-[#FFA801]/70 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/40 disabled:opacity-50"
        />
        <input
          type="password"
          name="senha"
          autoComplete="new-password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          disabled={loading}
          className="h-[38px] rounded-[20px] border-[3px] border-solid border-[#FFA801] bg-[#636363] pl-2.5 text-[#FFA801] placeholder:text-[#FFA801]/70 focus:outline-none focus:ring-2 focus:ring-[#FFA801]/40 disabled:opacity-50"
        />

        {erro ? (
          <p className="text-center text-sm text-red-300" role="alert">
            {erro}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 h-[38px] rounded-[20px] border-[3px] border-solid border-[#FFA801] bg-[#FFA801] font-bold text-[#636363] transition-all hover:bg-[#E89500] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Registando..." : "Registar"}
        </button>
      </form>

      <div className="mt-6 text-center text-[#FFA801]">
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
