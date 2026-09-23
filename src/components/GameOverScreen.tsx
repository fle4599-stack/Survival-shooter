import React from 'react';
import { RotateCcw, Skull, Timer, Crosshair, Target, Award } from 'lucide-react';
import { GameStats } from '../types/game';

interface GameOverScreenProps {
  stats: GameStats;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ stats, onRestart }) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const accuracy =
    stats.shotsFired > 0
      ? Math.min(100, Math.round((stats.shotsHit / stats.shotsFired) * 100))
      : 0;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-emerald-950/80 backdrop-blur-md select-none overflow-y-auto">
      {/* Background soft mossy mist and ambient glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(16,44,34,0.85)_0%,_rgba(4,18,13,0.96)_100%)]" />

      {/* Overgrown Gravestone Monument Card */}
      <div className="relative z-10 w-full max-w-lg my-auto flex flex-col items-center">
        {/* Tombstone Frame */}
        <div className="relative w-full rounded-t-[120px] rounded-b-2xl bg-gradient-to-b from-[#1b3d30] via-[#102920] to-[#0a1c15] border-2 border-[#2b5946]/70 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_80px_rgba(20,83,45,0.25)] p-8 sm:p-10 flex flex-col items-center text-center overflow-hidden">
          {/* Subtle stone texture noise & cracks */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
            <filter id="stone-texture">
              <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" result="noise" />
              <feColorMatrix type="matrix" values="0.3 0 0 0 0.1  0 0.4 0 0 0.2  0 0 0.3 0 0.15  0 0 0 0.6 0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#stone-texture)" />
            {/* Crack lines on stone */}
            <path d="M 60 40 L 95 80 L 110 70 L 135 120" stroke="#16382a" strokeWidth="2" fill="none" />
            <path d="M 380 90 L 350 140 L 365 170" stroke="#16382a" strokeWidth="2" fill="none" />
          </svg>

          {/* Creeping Ivy & Leaves Decorative Garland (SVG) */}
          <div className="absolute top-0 inset-x-0 h-40 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Vines */}
              <path
                d="M 20 120 Q 80 40 200 30 Q 320 40 380 120"
                stroke="#2d6a4f"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 60 140 Q 120 70 200 60 Q 280 70 340 140"
                stroke="#1b4332"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Ivy Leaves */}
              <g fill="#40916c" opacity="0.9">
                <path d="M 90 42 C 85 30, 75 35, 78 45 C 80 55, 95 55, 90 42 Z" />
                <path d="M 140 32 C 145 20, 155 22, 152 34 C 150 42, 138 42, 140 32 Z" />
                <path d="M 200 24 C 205 12, 215 15, 212 26 C 210 34, 198 34, 200 24 Z" />
                <path d="M 260 32 C 255 20, 245 22, 248 34 C 250 42, 262 42, 260 32 Z" />
                <path d="M 310 45 C 315 32, 325 35, 322 47 C 320 55, 308 55, 310 45 Z" />
                <path d="M 50 80 C 42 70, 35 75, 40 85 C 45 92, 55 90, 50 80 Z" />
                <path d="M 350 80 C 358 70, 365 75, 360 85 C 355 92, 345 90, 350 80 Z" />
              </g>

              {/* Delicate White and Yellow Cemetery Wildflowers */}
              <g>
                {/* Flower 1 */}
                <circle cx="115" cy="38" r="4" fill="#fef08a" />
                <circle cx="111" cy="38" r="3" fill="#ffffff" opacity="0.9" />
                <circle cx="119" cy="38" r="3" fill="#ffffff" opacity="0.9" />
                <circle cx="115" cy="34" r="3" fill="#ffffff" opacity="0.9" />
                <circle cx="115" cy="42" r="3" fill="#ffffff" opacity="0.9" />

                {/* Flower 2 */}
                <circle cx="285" cy="38" r="4" fill="#fef08a" />
                <circle cx="281" cy="38" r="3" fill="#ffffff" opacity="0.9" />
                <circle cx="289" cy="38" r="3" fill="#ffffff" opacity="0.9" />
                <circle cx="285" cy="34" r="3" fill="#ffffff" opacity="0.9" />
                <circle cx="285" cy="42" r="3" fill="#ffffff" opacity="0.9" />

                {/* Flower 3 - subtle bluebell / forget-me-not */}
                <circle cx="200" cy="56" r="3.5" fill="#a7f3d0" />
                <circle cx="197" cy="56" r="2.5" fill="#e0e7ff" opacity="0.8" />
                <circle cx="203" cy="56" r="2.5" fill="#e0e7ff" opacity="0.8" />
              </g>
            </svg>
          </div>

          {/* Top Cross / Monument Emblem */}
          <div className="relative mt-8 mb-4 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#1b3d30] border border-[#3b755d] flex items-center justify-center text-[#86efac] shadow-inner mb-2">
              <Skull className="w-5 h-5 text-[#86efac]/80" />
            </div>
            <span className="text-[11px] font-cinzel font-semibold tracking-widest text-[#86efac]/70 uppercase">
              R. I. P. · REST IN PEACE
            </span>
          </div>

          {/* Monument Inscription Heading */}
          <h2 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-[#d8f3dc] tracking-wider mb-1 uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            LAST MINUTE CHANCE
          </h2>
          <p className="text-xs text-[#95d5b2]/75 font-serif italic mb-6">
            «Здесь пал защитник, сдерживавший орду до последней секунды»
          </p>

          {/* Hairline Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#2d6a4f] to-transparent mb-6" />

          {/* Statistics Grid (Clean Tabular Numbers, Zero-Pill) */}
          <div className="w-full grid grid-cols-2 gap-3 text-left mb-7">
            {/* Stat 1: Kills */}
            <div className="bg-[#0b2018]/90 border border-[#204938] rounded-lg p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs text-[#95d5b2]/80">
                <Skull className="w-3.5 h-3.5 text-rose-400" />
                <span>Убито зомби</span>
              </div>
              <span className="font-mono text-2xl font-bold tabular-nums text-white mt-1">
                {stats.kills}
              </span>
            </div>

            {/* Stat 2: Survival Time */}
            <div className="bg-[#0b2018]/90 border border-[#204938] rounded-lg p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs text-[#95d5b2]/80">
                <Timer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Время выживания</span>
              </div>
              <span className="font-mono text-2xl font-bold tabular-nums text-white mt-1">
                {formatTime(stats.survivalTime)}
              </span>
            </div>

            {/* Stat 3: Shots Fired */}
            <div className="bg-[#0b2018]/90 border border-[#204938] rounded-lg p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs text-[#95d5b2]/80">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Всего выстрелов</span>
              </div>
              <span className="font-mono text-2xl font-bold tabular-nums text-white mt-1">
                {stats.shotsFired}
              </span>
            </div>

            {/* Stat 4: Accuracy */}
            <div className="bg-[#0b2018]/90 border border-[#204938] rounded-lg p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-xs text-[#95d5b2]/80">
                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                <span>Точность попаданий</span>
              </div>
              <span className="font-mono text-2xl font-bold tabular-nums text-[#86efac] mt-1">
                {accuracy}%
              </span>
            </div>
          </div>

          {/* Wave Record Row */}
          <div className="w-full flex items-center justify-between text-xs text-[#95d5b2]/80 border-t border-[#1b4332] pt-3 pb-6">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Финальная волна:</span>
            </div>
            <span className="font-mono font-bold text-white text-sm">
              Волна {stats.currentWave}
            </span>
          </div>

          {/* Restart Button */}
          <button
            onClick={onRestart}
            className="group relative w-full py-4 px-6 bg-gradient-to-r from-[#2d6a4f] via-[#40916c] to-[#2d6a4f] hover:from-[#40916c] hover:via-[#52b788] hover:to-[#40916c] active:scale-[0.98] text-[#081c15] font-cinzel font-bold text-base sm:text-lg tracking-wider uppercase rounded-xl shadow-[0_8px_25px_rgba(45,106,79,0.5)] border border-[#74c69d]/60 cursor-pointer flex items-center justify-center gap-3 transition-all duration-200"
          >
            <RotateCcw className="w-5 h-5 text-[#081c15] group-hover:rotate-180 transition-transform duration-500" />
            <span>Play Again</span>
          </button>
        </div>

        {/* Grass Tuft Ground Mound at Base */}
        <div className="w-full -mt-4 h-8 flex justify-center items-center pointer-events-none">
          <svg className="w-3/4 h-8" viewBox="0 0 300 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 10 30 Q 30 10 40 30 Q 60 5 70 30 Q 95 12 110 30 Q 140 2 155 30 Q 180 8 195 30 Q 225 4 240 30 Q 265 14 280 30"
              stroke="#2d6a4f"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 25 30 Q 45 15 55 30 Q 80 8 90 30 Q 125 14 135 30 Q 165 6 175 30 Q 205 12 215 30 Q 245 8 255 30"
              stroke="#40916c"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
