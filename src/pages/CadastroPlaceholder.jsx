import { Link } from 'react-router-dom';

export default function CadastroPlaceholder() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#636363] px-6 text-center text-[#FFA801]">
      <p className="text-lg">Cadastro web — integrar com POST /api/usuarios/cadastro.</p>
      <Link to="/login" className="mt-6 underline">
        Voltar ao login
      </Link>
    </div>
  );
}
