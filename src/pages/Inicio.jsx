import { useNavigate } from 'react-router-dom';
import fotoCapa from '@assets/images/fotoCapa.png';
import batata from '@assets/images/batata.png';
import hamburguer from '@assets/images/hamburguer.png';

export default function Inicio() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-[#636363] px-4 pb-10 pt-8 font-sans text-[#FFA801]">

      {/* Logo */}
      <div className="flex flex-col items-center gap-2 pt-6">
        <img
          src={fotoCapa}
          alt="NeloreBurguer"
          className="h-[143px] w-[253px] max-w-full object-contain"
        />
        <p className="mt-2 text-center text-sm text-white/70">
          Bem-vindo! Como deseja continuar?
        </p>
      </div>

      {/* Botões de escolha */}
      <div className="flex w-full max-w-[300px] flex-col gap-4">

        {/* Restaurante */}
        <button
          type="button"
          onClick={() => navigate('/restaurante/login')}
          className="flex flex-col items-center gap-1 rounded-2xl border-2 border-[#FFA801] bg-[#FFA801]/10 px-6 py-6 text-center transition hover:bg-[#FFA801]/20 active:scale-95"
        >
          <span className="text-4xl">🏪</span>
          <span className="text-lg font-bold text-[#FFA801]">Sou Restaurante</span>
          <span className="text-xs text-white/60">
            Cadastre seu restaurante, cardápio e entregadores
          </span>
        </button>

        {/* Usuário consumidor */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex flex-col items-center gap-1 rounded-2xl border-2 border-white/30 bg-white/10 px-6 py-6 text-center transition hover:bg-white/20 active:scale-95"
        >
          <span className="text-4xl">🛍️</span>
          <span className="text-lg font-bold text-white">Quero Pedir</span>
          <span className="text-xs text-white/60">
            Acesse a loja e faça seu pedido
          </span>
        </button>
      </div>

      {/* Imagens decorativas */}
      <div className="flex flex-row items-center justify-around gap-8 pt-4">
        <img src={batata} alt="" className="h-[120px] w-[80px] object-contain" />
        <img src={hamburguer} alt="" className="h-[90px] w-[100px] object-contain" />
      </div>
    </div>
  );
}
