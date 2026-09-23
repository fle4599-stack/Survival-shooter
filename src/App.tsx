/**
 * Last Minute Chance - Top-Down Infinite Survival Shooter
 */

import { useState, useEffect, useCallback } from 'react';
import { GameState, GameStats } from './types/game';
import { GameCanvas } from './components/GameCanvas';
import { TitleScreen } from './components/TitleScreen';
import { GameOverScreen } from './components/GameOverScreen';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [lastStats, setLastStats] = useState<GameStats>({
    kills: 0,
    shotsFired: 0,
    shotsHit: 0,
    currentWave: 1,
    survivalTime: 0,
    finalKills: 0,
    accuracy: 0,
  });

  const [bestKills, setBestKills] = useState<number>(0);
  const [bestSurvivalTime, setBestSurvivalTime] = useState<number>(0);

  // Load high scores
  useEffect(() => {
    try {
      const savedKills = localStorage.getItem('lmc_best_kills');
      if (savedKills) setBestKills(parseInt(savedKills, 10));

      const savedTime = localStorage.getItem('lmc_best_time');
      if (savedTime) setBestSurvivalTime(parseFloat(savedTime));
    } catch {
      // LocalStorage access fallback
    }
  }, []);

  const handleStartGame = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handleGameOver = useCallback((stats: GameStats) => {
    setLastStats(stats);
    setGameState('GAME_OVER');

    // Update records
    setBestKills((prev) => {
      const next = Math.max(prev, stats.kills);
      try { localStorage.setItem('lmc_best_kills', String(next)); } catch { /* ignore */ }
      return next;
    });

    setBestSurvivalTime((prev) => {
      const next = Math.max(prev, stats.survivalTime);
      try { localStorage.setItem('lmc_best_time', String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleRestart = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#221812] text-white select-none">
      {/* 2D Canvas Engine (always mounted for crisp background and freeze-frame) */}
      <GameCanvas
        gameState={gameState}
        onGameOver={handleGameOver}
        onStateChange={setGameState}
      />

      {/* Title Screen Overlay */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStartGame={handleStartGame}
          bestKills={bestKills}
          bestSurvivalTime={bestSurvivalTime}
        />
      )}

      {/* Game Over Gravestone Screen Overlay */}
      {gameState === 'GAME_OVER' && (
        <GameOverScreen
          stats={lastStats}
          onRestart={handleRestart}
        />
      )}
    </main>
  );
}
