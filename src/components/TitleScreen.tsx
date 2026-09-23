import React from 'react';
import { Play, Flame, ShieldAlert, Crosshair, Skull } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: () => void;
  bestKills: number;
  bestSurvivalTime: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  bestKills,
  bestSurvivalTime,
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 sm:p-10 bg-black/90 text-white overflow-y-auto selection:bg-rose-900 selection:text-white">
      {/* Background horror lighting & subtle blood vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-950/40 via-black/80 to-black z-0" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_50%,_rgba(15,2,2,0.85)_100%)] z-0" />

      {/* Subtle blood splatter / scratches decorative SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-25 z-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="horror-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0.4  0 0 0 0 0  0 0 0 0 0  0 0 0 0.8 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#horror-noise)" opacity="0.15" />
        <circle cx="20%" cy="30%" r="90" fill="#881337" opacity="0.3" filter="blur(50px)" />
        <circle cx="80%" cy="70%" r="140" fill="#991b1b" opacity="0.25" filter="blur(70px)" />
      </svg>

      {/* Header / Badges */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between text-xs text-neutral-400 font-mono">
        <div className="flex items-center gap-2 tracking-widest text-rose-500 uppercase">
          <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
          <span>Top-Down Survival Shooter</span>
        </div>
        {(bestKills > 0 || bestSurvivalTime > 0) && (
          <div className="flex items-center gap-4 text-neutral-400">
            <span>Рекорд: <strong className="text-rose-400">{bestKills}</strong> фрагов</span>
            <span>·</span>
            <span>Время: <strong className="text-neutral-200">{formatTime(bestSurvivalTime)}</strong></span>
          </div>
        )}
      </div>

      {/* Main Title Hero */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-8">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded border border-rose-900/60 bg-rose-950/40 text-rose-300 text-xs font-mono uppercase tracking-widest">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          Касание любого зомби смертельно
        </div>

        <h1 className="font-cinzel text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white drop-shadow-[0_10px_25px_rgba(225,29,72,0.45)] mb-3 uppercase">
          LAST MINUTE <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-rose-400 via-rose-600 to-red-950">
            CHANCE
          </span>
        </h1>

        <p className="max-w-xl text-neutral-300 text-sm sm:text-base leading-relaxed mb-8">
          Орда зомби нарастает <span className="text-rose-400 font-bold font-mono">каждые 5 секунд</span> (1, 2, 3, 4, 5, 6...).
          Двигайся клавишами <span className="text-white font-bold font-mono">WASD</span>, целься и стреляй мышью.
        </p>

        {/* The single prominent Play button */}
        <button
          onClick={onStartGame}
          className="group relative inline-flex items-center justify-center gap-4 px-12 sm:px-16 py-5 bg-gradient-to-r from-red-700 via-rose-700 to-red-900 hover:from-red-600 hover:via-rose-600 hover:to-red-800 text-white font-cinzel text-xl sm:text-2xl font-bold tracking-widest uppercase rounded-md shadow-[0_0_40px_rgba(225,29,72,0.6)] hover:shadow-[0_0_60px_rgba(225,29,72,0.9)] active:scale-95 transition-all duration-200 border border-rose-500/80 cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[pulse_2s_infinite]" />
          <Play className="w-7 h-7 fill-white text-white group-hover:scale-110 transition-transform" />
          <span className="relative z-10">Play</span>
        </button>
      </div>

      {/* Rules & Weapon Progression Cards */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-neutral-950/80 border border-neutral-900 rounded-lg p-3.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-semibold text-rose-400 font-cinzel">
            <Crosshair className="w-4 h-4 text-rose-500" />
            <span>УПРАВЛЕНИЕ</span>
          </div>
          <p className="text-neutral-400">
            Движение: <strong className="text-white font-mono">W, A, S, D</strong>. Оружие и прицел смотрят в мышь.
          </p>
          <span className="text-neutral-300 font-mono mt-auto text-[11px]">
            ЛКМ — огонь (зажми для непрерывной стрельбы)
          </span>
        </div>

        <div className="bg-neutral-950/80 border border-neutral-900 rounded-lg p-3.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-semibold text-amber-400 font-cinzel">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>ПРОГРЕССИЯ ОРУЖИЯ</span>
          </div>
          <div className="flex flex-col gap-1 text-[11px] text-neutral-300 font-mono">
            <div className="flex justify-between">
              <span>0–19 фрагов:</span>
              <span className="text-amber-300">Пистолет (1 в/сек)</span>
            </div>
            <div className="flex justify-between">
              <span>20–49 фрагов:</span>
              <span className="text-amber-400 font-semibold">Автомат (3 в/сек)</span>
            </div>
            <div className="flex justify-between">
              <span>50+ фрагов:</span>
              <span className="text-rose-400 font-bold">Тяжелый авт. (5 в/сек)</span>
            </div>
          </div>
        </div>

        <div className="bg-neutral-950/80 border border-neutral-900 rounded-lg p-3.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-semibold text-emerald-400 font-cinzel">
            <Skull className="w-4 h-4 text-emerald-500" />
            <span>РЕАКЦИЯ ЗОМБИ</span>
          </div>
          <p className="text-neutral-400">
            Попадание пули оглушает зомби на 1 сек (он замирает и безопасен), затем он расплывается в зеленую жижу еще на 1 сек.
          </p>
          <span className="text-neutral-500 font-mono text-[11px]">
            Зомби проходят сквозь толпу прямо к игроку
          </span>
        </div>
      </div>
    </div>
  );
};
