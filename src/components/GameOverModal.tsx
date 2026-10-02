import React, { useEffect, useState } from 'react';
import { PlayerStats } from '../types/game';
import { Skull, RotateCcw, Trophy, Target, Crosshair } from 'lucide-react';

interface GameOverModalProps {
  stats: PlayerStats;
  round: number;
  onRestart: () => void;
  onQuitToMenu?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, round, onRestart, onQuitToMenu }) => {
  const [bestRound, setBestRound] = useState<number>(1);
  const [bestScore, setBestScore] = useState<number>(0);

  useEffect(() => {
    try {
      const storedRound = parseInt(localStorage.getItem('cod_zombies_best_round') || '1', 10);
      const storedScore = parseInt(localStorage.getItem('cod_zombies_best_score') || '0', 10);

      const newBestRound = Math.max(storedRound, round);
      const newBestScore = Math.max(storedScore, stats.score);

      localStorage.setItem('cod_zombies_best_round', newBestRound.toString());
      localStorage.setItem('cod_zombies_best_score', newBestScore.toString());

      setBestRound(newBestRound);
      setBestScore(newBestScore);
    } catch {
      // LocalStorage blocked
    }
  }, [round, stats.score]);

  const accuracy = stats.bulletsFired > 0 
    ? Math.round((stats.bulletsHit / stats.bulletsFired) * 100) 
    : 0;

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="max-w-md w-full bg-stone-950 border-2 border-red-900/80 p-6 sm:p-8 rounded-sm shadow-[0_0_50px_rgba(185,28,28,0.4)] text-center relative overflow-hidden">
        {/* Blood dripping accent header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-800 via-red-600 to-red-800" />

        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-600 flex items-center justify-center shadow-lg animate-pulse">
            <Skull className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <h1 className="font-['Creepster'] text-4xl sm:text-5xl text-red-600 tracking-wider drop-shadow-[0_2px_12px_rgba(220,38,38,0.8)]">
          HAS CAÍDO
        </h1>
        <p className="text-stone-400 font-mono text-xs uppercase tracking-widest mt-1">
          La horda ha consumido tu último aliento
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-6 font-mono text-left">
          <div className="bg-stone-900/90 border border-stone-800 p-3 rounded-xs">
            <span className="text-[11px] text-stone-500 uppercase block">Rondas Sobrevividas</span>
            <span className="font-['Black_Ops_One'] text-2xl text-stone-100">{round}</span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 p-3 rounded-xs">
            <span className="text-[11px] text-stone-500 uppercase block">Puntuación Total</span>
            <span className="font-['Black_Ops_One'] text-2xl text-amber-400">{stats.score}</span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 p-3 rounded-xs">
            <span className="text-[11px] text-stone-500 uppercase block">Zombies Eliminados</span>
            <span className="font-['Black_Ops_One'] text-xl text-red-400">{stats.kills}</span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 p-3 rounded-xs">
            <span className="text-[11px] text-stone-500 uppercase block">Tiros a la Cabeza</span>
            <span className="font-['Black_Ops_One'] text-xl text-yellow-300">{stats.headshots}</span>
          </div>
        </div>

        {/* Record Banner */}
        <div className="flex items-center justify-between bg-stone-900/60 border border-amber-500/30 px-4 py-2.5 rounded-xs mb-6 text-xs font-mono">
          <div className="flex items-center gap-2 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span className="font-bold">MEJOR RÉCORD</span>
          </div>
          <span className="text-stone-300">
            Ronda <strong className="text-white">{bestRound}</strong> · <strong className="text-amber-400">{bestScore}</strong> pts
          </span>
        </div>

        {/* Actions: Restart or Quit to Menu */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3.5 bg-red-700 hover:bg-red-600 active:scale-98 text-white font-['Black_Ops_One'] tracking-wider rounded-xs text-base sm:text-lg transition-all shadow-[0_4px_15px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>REINTENTAR SUPERVIVENCIA</span>
          </button>

          {onQuitToMenu && (
            <button
              onClick={onQuitToMenu}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-mono text-xs rounded-xs transition-colors cursor-pointer"
            >
              VOLVER AL MENÚ PRINCIPAL
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
