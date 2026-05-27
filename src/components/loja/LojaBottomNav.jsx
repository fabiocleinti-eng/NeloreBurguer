import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { mensagensApi } from '@/services/api';

const linkClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-0.5 min-w-[60px] relative ${
    isActive ? 'text-[#2D7A4F]' : 'text-zinc-400'
  }`;

export function LojaBottomNav() {
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    function checar() {
      mensagensApi.naoLidasCount()
        .then(({ data }) => setNaoLidas(data?.count ?? 0))
        .catch(() => {});
    }
    checar();
    const interval = setInterval(checar, 20_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="flex h-[72px] w-full flex-row items-center justify-around bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <NavLink to="/loja" end className={linkClass}>
        <span className="text-3xl leading-none" aria-hidden>⌂</span>
        <span className="text-xs font-bold">Home</span>
      </NavLink>

      <NavLink to="/loja/carrinho" className={linkClass}>
        <span className="text-3xl leading-none" aria-hidden>🛒</span>
        <span className="text-xs font-bold">Carrinho</span>
      </NavLink>

      <NavLink to="/loja/pedidos" className={linkClass}>
        <span className="text-3xl leading-none" aria-hidden>📋</span>
        {naoLidas > 0 && (
          <span className="absolute -top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3CB371] text-[9px] font-bold text-white">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
        <span className="text-xs font-bold">Pedidos</span>
      </NavLink>

      <NavLink to="/loja/perfil" className={linkClass}>
        <span className="text-3xl leading-none" aria-hidden>☺</span>
        <span className="text-xs font-bold">Perfil</span>
      </NavLink>
    </nav>
  );
}
