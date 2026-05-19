import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-0.5 min-w-[60px] ${
    isActive ? 'text-[#2D7A4F]' : 'text-zinc-400'
  }`;

export function LojaBottomNav() {
  return (
    <nav className="flex h-[72px] w-full flex-row items-center justify-around bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <NavLink to="/loja" end className={linkClass}>
        <span className="text-3xl leading-none" aria-hidden>
          ⌂
        </span>
        <span className="text-xs font-bold">Home</span>
      </NavLink>

      <NavLink to="/loja/carrinho" className={linkClass}>
        <span className="text-3xl leading-none" aria-hidden>
          🛒
        </span>
        <span className="text-xs font-bold">Carrinho</span>
      </NavLink>

      <NavLink to="/loja/pedidos" className={linkClass}>
        <span className="text-3xl leading-none" aria-hidden>
          📋
        </span>
        <span className="text-xs font-bold">Pedidos</span>
      </NavLink>

      <NavLink to="/loja/perfil" className={linkClass}>
        <span className="text-3xl leading-none" aria-hidden>
          ☺
        </span>
        <span className="text-xs font-bold">Perfil</span>
      </NavLink>
    </nav>
  );
}
