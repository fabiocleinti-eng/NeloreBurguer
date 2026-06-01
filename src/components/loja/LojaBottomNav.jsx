import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useCart } from '@/context/CartContext';

const linkClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-0.5 min-w-[60px] ${
    isActive ? 'text-[#2D7A4F]' : 'text-zinc-400'
  }`;

export function LojaBottomNav() {
  const { addTick, itemCount } = useCart();
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (addTick === 0) return;
    setBounce(false);
    const t = requestAnimationFrame(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 500);
    });
    return () => cancelAnimationFrame(t);
  }, [addTick]);

  return (
    <nav className="flex h-[72px] w-full flex-row items-center justify-around bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <NavLink to="/loja" end className={linkClass}>
        <span className="text-3xl leading-none" aria-hidden>⌂</span>
        <span className="text-xs font-bold">Home</span>
      </NavLink>

      <NavLink to="/loja/carrinho" className={linkClass}>
        <span className="relative inline-block">
          <span
            className={`text-3xl leading-none inline-block ${bounce ? 'cart-pop' : ''}`}
            aria-hidden
          >
            🛒
          </span>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#E53935] text-[10px] font-bold text-white leading-none">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </span>
        <span className="text-xs font-bold">Carrinho</span>
      </NavLink>

      <NavLink to="/loja/pedidos" className={linkClass}>
        <span className="text-3xl leading-none" aria-hidden>📋</span>
        <span className="text-xs font-bold">Pedidos</span>
      </NavLink>

      <NavLink to="/loja/perfil" className={linkClass}>
        <span className="text-3xl leading-none" aria-hidden>☺</span>
        <span className="text-xs font-bold">Perfil</span>
      </NavLink>
    </nav>
  );
}
