import logoHome from '@assets/images/logoHome.png';

export function LojaHeader() {
  return (
    <header className="flex w-full max-w-lg flex-row items-center justify-around px-2 pt-2 pb-3">
      <img
        src={logoHome}
        alt="NeloreBuguer"
        className="h-[69px] w-[69px] object-contain"
      />
      <button
        type="button"
        className="flex h-[33px] w-[194px] flex-row items-center justify-between rounded-[20px] border-2 border-[#FFA801] bg-[#FF0000] px-2"
      >
        <span className="text-[#FFA801]" aria-hidden>
          📍
        </span>
        <span className="text-center text-[10px] leading-tight text-[#FFA801]">
          Endereço
        </span>
        <span className="flex items-center text-[#FFA801]">
          <span className="pb-1 text-[25px] leading-none">|</span>
          <span className="text-lg">✎</span>
        </span>
      </button>
      <span className="text-[#FFA801]" aria-hidden>
        🔔
      </span>
    </header>
  );
}
