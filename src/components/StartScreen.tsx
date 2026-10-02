import React from 'react';
import { Skull, Play, Volume2, Shield, Zap, Box, Sparkles, HelpCircle, Users } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface StartScreenProps {
  onStartSolo: () => void;
  onOpenMultiplayer: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStartSolo, onOpenMultiplayer }) => {
  const handleSolo = () => {
    soundEngine.ensureContext();
    onStartSolo();
  };

  const handleMultiplayer = () => {
    soundEngine.ensureContext();
    onOpenMultiplayer();
  };

  return (
    <div className="absolute inset-0 bg-[#07090c] flex flex-col items-center justify-center p-4 z-50 overflow-y-auto select-none">
      {/* Background radial atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.15)_0,rgba(7,9,12,0.95)_70%)] pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10 my-auto py-6">
        {/* Emblem */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-red-950/80 border-2 border-red-600 flex items-center justify-center shadow-[0_0_35px_rgba(220,38,38,0.6)] animate-pulse">
              <Skull className="w-10 h-10 text-red-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black font-['Black_Ops_One'] text-[10px] px-1.5 py-0.5 rounded-xs">
              115
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-['Creepster'] text-5xl sm:text-7xl text-red-600 tracking-wider drop-shadow-[0_4px_25px_rgba(220,38,38,0.85)] leading-tight">
          CALL OF DUTY
        </h1>
        <h2 className="font-['Black_Ops_One'] text-2xl sm:text-3xl text-stone-200 tracking-widest -mt-1 drop-shadow-md">
          ZOMBIES: BUNKER 115
        </h2>
        <p className="text-stone-400 font-mono text-xs sm:text-sm uppercase tracking-widest mt-2 max-w-md mx-auto">
          Sobrevive ronda tras ronda a las hordas implacables en las profundidades del búnker.
        </p>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-6 text-left font-mono">
          <div className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs mb-1">
              <Box className="w-3.5 h-3.5" />
              <span>Caja Misteriosa</span>
            </div>
            <p className="text-[11px] text-stone-400">950 Pts para armas aleatorias y la Ray Gun.</p>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-xs">
            <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Perk-a-Colas</span>
            </div>
            <p className="text-[11px] text-stone-400">Juggernog, Speed Cola, Double Tap y más.</p>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-xs">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pack-a-Punch</span>
            </div>
            <p className="text-[11px] text-stone-400">Mejora tus armas con daño devastador.</p>
          </div>

          <div className="bg-stone-900/80 border border-stone-800 p-2.5 rounded-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Energía y Trampas</span>
            </div>
            <p className="text-[11px] text-stone-400">Activa la corriente y las trampas eléctricas.</p>
          </div>
        </div>

        {/* Controls bar */}
        <div className="bg-stone-950/90 border border-stone-800 p-3 rounded-xs mb-6 text-stone-300 font-mono text-xs flex flex-wrap justify-center gap-x-4 gap-y-2">
          <span><strong className="text-amber-400">WASD:</strong> Moverse</span>
          <span><strong className="text-amber-400">Mouse:</strong> Apuntar y Disparar</span>
          <span><strong className="text-amber-400">R:</strong> Recargar</span>
          <span><strong className="text-amber-400">F:</strong> Comprar / Reparar</span>
          <span><strong className="text-amber-400">Shift:</strong> Sprint</span>
          <span><strong className="text-amber-400">E:</strong> Cuchillo</span>
          <span><strong className="text-amber-400">G:</strong> Granadas</span>
        </div>

        {/* Start Game Buttons: Solo vs Co-op Multiplayer */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <button
            onClick={handleSolo}
            className="w-full sm:flex-1 py-3.5 bg-red-700 hover:bg-red-600 active:scale-98 text-white font-['Black_Ops_One'] tracking-wider text-base sm:text-lg rounded-xs transition-all shadow-[0_4px_25px_rgba(220,38,38,0.6)] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>SOLITARIO</span>
          </button>

          <button
            onClick={handleMultiplayer}
            className="w-full sm:flex-1 py-3.5 bg-stone-900 hover:bg-stone-800 border-2 border-amber-500/80 active:scale-98 text-amber-400 font-['Black_Ops_One'] tracking-wider text-base sm:text-lg rounded-xs transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Users className="w-5 h-5" />
            <span>CO-OP MULTIJUGADOR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
