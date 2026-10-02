import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Zap, Sparkles, HelpCircle, LogOut } from 'lucide-react';
import { PERK_REGISTRY } from '../data/weapons';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ 
  onResume, 
  onRestart, 
  onQuitToMenu,
  isMuted, 
  onToggleMute, 
  volume, 
  onVolumeChange 
}) => {
  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="max-w-lg w-full bg-stone-950 border border-stone-800 p-6 sm:p-8 rounded-sm shadow-2xl">
        <h2 className="font-['Black_Ops_One'] text-3xl text-stone-100 text-center tracking-wider mb-6">
          JUEGO EN PAUSA
        </h2>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={onResume}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-black font-['Black_Ops_One'] text-base tracking-wider rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>CONTINUAR</span>
          </button>

          {/* Volume Control Slider */}
          <div className="bg-stone-900 border border-stone-800 p-3 rounded-xs flex items-center justify-between gap-4 font-mono text-xs text-stone-300">
            <button
              onClick={onToggleMute}
              className="flex items-center gap-2 hover:text-white cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{isMuted || volume === 0 ? 'MUTED' : `VOLUMEN: ${Math.round(volume * 100)}%`}</span>
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-stone-700 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onRestart}
              className="py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-mono text-xs rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>REINICIAR</span>
            </button>
            <button
              onClick={onQuitToMenu}
              className="py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 font-mono text-xs rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>SALIR AL MENÚ</span>
            </button>
          </div>
        </div>

        {/* Controls Guide */}
        <div className="border-t border-stone-800 pt-4">
          <h3 className="text-xs uppercase tracking-widest text-stone-400 font-bold font-mono mb-3 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            Controles de Combate
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-stone-300">
            <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-amber-400">WASD</kbd> Moverse</div>
            <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-amber-400">CLICK IZQ</kbd> Disparar</div>
            <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-amber-400">R</kbd> Recargar</div>
            <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-amber-400">F</kbd> Interactuar / Comprar</div>
            <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-amber-400">SHIFT</kbd> Correr / Sprint</div>
            <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-amber-400">E / CLICK DER</kbd> Cuchillo Melee</div>
            <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-amber-400">1 / 2 / Q</kbd> Cambiar de Arma</div>
            <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-amber-400">G</kbd> Lanzar Granada</div>
          </div>
        </div>

        {/* Perk Guide Brief */}
        <div className="border-t border-stone-800 pt-4 mt-4">
          <h3 className="text-xs uppercase tracking-widest text-stone-400 font-bold font-mono mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Perk-a-Colas Disponibles
          </h3>
          <div className="space-y-1 text-[11px] font-mono text-stone-400">
            <p><strong className="text-red-400">Juggernog:</strong> 250 HP (Resiste 5 golpes)</p>
            <p><strong className="text-emerald-400">Speed Cola:</strong> Recarga 50% más veloz y repara barricadas</p>
            <p><strong className="text-amber-400">Double Tap:</strong> +33% cadencia y +40% potencia</p>
            <p><strong className="text-cyan-400">Quick Revive:</strong> Auto-revive al caer en combate</p>
            <p><strong className="text-yellow-400">Stamin-Up:</strong> Velocidad +25% y sprint ilimitado</p>
          </div>
        </div>
      </div>
    </div>
  );
};
