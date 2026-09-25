import React from 'react';
import { Volume2, VolumeX, Crosshair, Skull, ShieldAlert, Timer } from 'lucide-react';
import { WeaponConfig, getWaveZombieCount } from '../types/game';

interface HUDProps {
  kills: number;
  currentWave: number;
  waveProgress: number; // 0 to 1 (5s loop)
  survivalSeconds: number;
  currentWeapon: WeaponConfig;
  shotsFired: number;
  shotsHit: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  kills,
  currentWave,
  waveProgress,
  survivalSeconds,
  currentWeapon,
  shotsFired,
  shotsHit,
  isMuted,
  onToggleMute,
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const ms = Math.floor((totalSec % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const accuracy = shotsFired > 0 ? Math.min(100, Math.round((shotsHit / shotsFired) * 100)) : 0;

  // Next weapon threshold
  let nextThresholdText = '';
  let progressPct = 100;
  if (currentWeapon.maxKills !== null) {
    const target = currentWeapon.maxKills + 1;
    const currentInTier = kills - currentWeapon.minKills;
    const needed = target - currentWeapon.minKills;
    progressPct = Math.min(100, Math.max(0, (currentInTier / needed) * 100));
    nextThresholdText = `${target - kills} to next tier`;
  } else {
    nextThresholdText = 'MAX TIER';
    progressPct = 100;
  }

  // Zombie count in current wave = Linear progression (1, 2, 3, 4, 5, 6...)
  const zombiesInWave = getWaveZombieCount(currentWave);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 p-4 select-none z-20 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        {/* Left: Kills & Weapon progression */}
        <div className="flex flex-col gap-1.5 bg-black/60 backdrop-blur-md border border-neutral-800/80 px-4 py-2.5 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-rose-500" />
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Kills</span>
            <span className="text-xl font-bold font-mono tabular-nums text-white tracking-tight">{kills}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-amber-400">{currentWeapon.nameRu}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-300 font-mono tabular-nums">{currentWeapon.fireRate} выстр/с</span>
          </div>

          {currentWeapon.maxKills !== null && (
            <div className="w-36 bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="bg-amber-500 h-full transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
          <span className="text-[10px] text-neutral-500 font-mono tracking-tight">{nextThresholdText}</span>
        </div>

        {/* Center: Wave Alert & Countdown */}
        <div className="flex flex-col items-center bg-black/60 backdrop-blur-md border border-neutral-800/80 px-6 py-2.5 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="font-cinzel text-lg font-bold tracking-wider text-emerald-400">
              ВОЛНА {currentWave}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
            <span>+{zombiesInWave} зомби</span>
          </div>

          {/* 5s wave loop bar */}
          <div className="w-40 bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-neutral-800 mt-1.5">
            <div
              className="bg-emerald-500 h-full transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, waveProgress * 100))}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
            След. волна: {((1 - waveProgress) * 5).toFixed(1)}s
          </span>
        </div>

        {/* Right: Survival Timer, Accuracy & Audio */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1 bg-black/60 backdrop-blur-md border border-neutral-800/80 px-4 py-2.5 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-cyan-400" />
              <span className="text-base font-mono font-bold tabular-nums text-white">
                {formatTime(survivalSeconds)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
              <Crosshair className="w-3.5 h-3.5 text-neutral-400" />
              <span>{accuracy}% точн.</span>
              <span className="text-neutral-600">·</span>
              <span>{shotsFired} выстр.</span>
            </div>
          </div>

          {/* Sound Mute Button */}
          <button
            onClick={onToggleMute}
            className="pointer-events-auto p-3 bg-black/60 hover:bg-neutral-800/90 active:scale-95 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition-all shadow-lg"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};
