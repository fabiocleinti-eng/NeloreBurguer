import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-0.5 min-w-[60px] ${
    isActive ? 'text-red-600' : 'text-[#FFA801]'
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
      <span className="flex flex-col items-center text-[#FFA801]">
        <span className="text-3xl leading-none" aria-hidden>
          📋
        </span>
        <span className="text-xs font-bold">Pedidos</span>
      </span>
      <span className="flex flex-col items-center text-[#FFA801]">
        <span className="text-3xl leading-none" aria-hidden>
          ☺
        </span>
        <span className="text-xs font-bold">Perfil</span>
      </span>
    </nav>
  );
}
