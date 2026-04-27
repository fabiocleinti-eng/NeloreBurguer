import { Link } from 'react-router-dom';

/** Página mínima para validar rota pós-login; pode ser substituída pela home real. */
export default function HomePlaceholder() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#701515] to-[#D02727] p-8 text-white">
      <h1 className="text-2xl font-bold text-[#FFA801]">NeloreBuguer</h1>
      <p className="mt-4">Área logada (placeholder).</p>
      <Link to="/login" className="mt-6 inline-block text-[#FFA801] underline">
        Voltar ao login
      </Link>
    </div>
  );
}
