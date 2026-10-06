import React from 'react';
import { GameEngine } from '../game/GameEngine';
import { PERK_REGISTRY } from '../data/weapons';
import { getPlayerZone } from '../game/mapData';
import { PainterlyPortrait } from './PainterlyPortrait';
import { 
  Zap, Shield, Crosshair, Skull, Award, RefreshCw, Volume2, VolumeX, Pause, Flame, 
  MapPin, Heart, Activity, AlertTriangle, Sparkles 
} from 'lucide-react';

interface HUDProps {
  engine: GameEngine;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  // Mobile virtual button handlers
  onMobileButton?: (action: string) => void;
}

export const HUD: React.FC<HUDProps> = ({ 
  engine, 
  onPause, 
  isMuted, 
  onToggleMute, 
  volume, 
  onVolumeChange, 
  onMobileButton 
}) => {
  const p = engine.player;
  const currentWeapon = p.weapons[p.currentWeaponIndex];
  const round = engine.round;
  const isHellhound = engine.isHellhoundRound;
  const currentZone = getPlayerZone(p.x, p.y);

  const zoneLabel = currentZone === 'spawn'
    ? 'SECTOR 1: SALA DE INICIO'
    : currentZone === 'courtyard'
    ? 'SECTOR 2: PATIO CENTRAL'
    : currentZone === 'power'
    ? 'SECTOR 3: CENTRAL ELÉCTRICA'
    : 'SECTOR 4: PACK-A-PUNCH LAB';

  // Render round tally marks
  const renderRoundDisplay = () => {
    if (round <= 5) {
      const marks = [];
      for (let i = 0; i < round; i++) {
        marks.push('I');
      }
      return (
        <span className="font-['Creepster'] tracking-widest text-4xl sm:text-5xl text-red-600 drop-shadow-[0_2px_12px_rgba(220,38,38,0.9)] animate-pulse">
          {round === 5 ? 'V' : marks.join('')}
        </span>
      );
    }
    return (
      <span className="font-['Creepster'] text-4xl sm:text-5xl text-red-600 drop-shadow-[0_2px_12px_rgba(220,38,38,0.9)]">
        {round}
      </span>
    );
  };

  const healthPercent = Math.max(0, Math.min(100, (p.health / p.maxHealth) * 100));
  const isLowHealth = healthPercent < 35;
  const isLowAmmo = currentWeapon && !currentWeapon.isReloading && currentWeapon.currentMag <= Math.ceil(currentWeapon.def.magazineSize * 0.25);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden">
      {/* Top Bar: Round Counter, Zone Badge, Zombies Remaining, Status & Volume */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Round & Zone info */}
        <div className="flex items-center gap-2.5">
          {/* Round Counter */}
          <div className="flex items-center gap-3 bg-stone-950/90 backdrop-blur-md border border-stone-800/90 px-4 py-1.5 rounded-sm shadow-2xl">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold font-mono">Ronda</span>
              <div className="flex items-center gap-2">
                {renderRoundDisplay()}
                {isHellhound && (
                  <Flame className="w-5 h-5 text-red-500 animate-bounce" />
                )}
              </div>
            </div>
          </div>

          {/* Current Room / Zone Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-stone-950/90 border border-stone-800/90 px-3.5 py-2 rounded-sm shadow-xl text-stone-300 font-mono text-xs backdrop-blur-sm">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold tracking-wide text-amber-400">{zoneLabel}</span>
          </div>

          {/* Zombies Remaining Counter */}
          <div className="flex items-center gap-1.5 bg-stone-950/90 border border-red-900/80 px-3 py-2 rounded-sm shadow-xl text-stone-300 font-mono text-xs backdrop-blur-sm">
            <Skull className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span className="font-bold tracking-wide text-red-400">
              RESTANTES: {engine.zombiesRemainingToSpawn + engine.zombies.length}
            </span>
          </div>
        </div>

        {/* Center Round Banner Alert */}
        {engine.roundBannerTimer > 0 && (
          <div className="absolute left-1/2 -translate-x-1/2 top-14 text-center pointer-events-none animate-pulse">
            <h2 className={`font-['Creepster'] text-3xl sm:text-5xl ${isHellhound ? 'text-amber-500' : 'text-red-600'} drop-shadow-[0_0_20px_rgba(239,68,68,0.95)]`}>
              {isHellhound ? '¡RONDA DE PERROS DEL INFIERNO!' : `RONDA ${engine.round}`}
            </h2>
            <p className="text-xs uppercase tracking-widest text-stone-300 font-mono mt-1 font-bold">
              {isHellhound ? '¡Búscame sus almas!' : 'Sobrevive a la horda'}
            </p>
          </div>
        )}

        {/* Top Right: Power, Sound & Pause */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Power Status Icon */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border ${engine.map.powerSwitch.isOn ? 'bg-emerald-950/90 border-emerald-600 text-emerald-400' : 'bg-stone-900/90 border-stone-700 text-stone-400'} text-xs font-mono font-bold shadow-md backdrop-blur-sm`}>
            <Zap className={`w-3.5 h-3.5 ${engine.map.powerSwitch.isOn ? 'text-emerald-400 animate-pulse' : 'text-stone-500'}`} />
            <span className="hidden sm:inline">{engine.map.powerSwitch.isOn ? 'CORRIENTE: ON' : 'CORRIENTE: OFF'}</span>
          </div>

          {/* Sound Mute & Volume Slider */}
          <div className="flex items-center gap-2 bg-stone-900/90 border border-stone-700/80 px-2.5 py-1.5 rounded-sm shadow-md backdrop-blur-sm">
            <button
              onClick={onToggleMute}
              className="text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Silenciar / Activar sonido"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-14 sm:w-20 accent-emerald-500 cursor-pointer h-1.5 bg-stone-700 rounded-lg"
              title={`Volumen: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="p-2 bg-stone-900/90 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded-sm transition-colors cursor-pointer shadow-md"
            title="Pausa"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Active Power-Ups Indicators */}
      <div className="flex items-center justify-center gap-3">
        {Array.from(engine.activePowerUps.values()).map(pu => (
          <div
            key={pu.type}
            className="flex items-center gap-2 bg-stone-950/95 border-2 border-emerald-500 px-3.5 py-1.5 rounded-sm text-emerald-400 text-xs font-bold font-mono animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          >
            {pu.type === 'insta_kill' && <Skull className="w-4 h-4 text-red-400" />}
            {pu.type === 'double_points' && <Award className="w-4 h-4 text-amber-400" />}
            <span className="uppercase tracking-wider font-['Black_Ops_One']">{pu.type.replace('_', ' ')}</span>
            <span className="text-white bg-emerald-950/90 px-1.5 py-0.5 rounded-xs font-mono">{Math.ceil(pu.timeLeft)}s</span>
          </div>
        ))}
      </div>

      {/* Interaction Prompt (F to buy / open / repair) */}
      {engine.promptText && (
        <div className="self-center bg-black/90 border-2 border-amber-500 text-amber-300 px-6 py-2.5 rounded-sm text-sm sm:text-base font-['Black_Ops_One'] shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-pulse tracking-wide text-center">
          {engine.promptText}
        </div>
      )}

      {/* Bottom Bar: Health/Perks (Left), Points (Center), Ammo & Weapons (Right) */}
      <div className="flex items-end justify-between w-full">
        {/* Left: Disco Elysium Painterly Portrait & Survivor Vitals */}
        <div className="flex flex-col gap-2">
          {/* Health & Volition Box with Character Portrait */}
          <div className="flex items-center gap-3 bg-stone-950/95 p-2.5 border border-stone-800/90 rounded-sm shadow-2xl backdrop-blur-md">
            <PainterlyPortrait 
              health={p.health}
              maxHealth={p.maxHealth}
              alignment={p.alignment || (currentWeapon?.def.altarAffinity || 'neutral')}
              aimAngle={p.angle}
              lastDamageTime={p.lastDamageTime}
              isKnifing={p.isKnifing}
            />
            <div className="flex flex-col gap-1.5 w-36 sm:w-52">
              {/* Alignment Badge */}
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-xs uppercase ${
                  (p.alignment || currentWeapon?.def.altarAffinity) === 'sacred'
                    ? 'bg-amber-950/90 text-amber-300 border border-amber-500/80 shadow-[0_0_8px_#f59e0b]'
                    : (p.alignment || currentWeapon?.def.altarAffinity) === 'cursed'
                    ? 'bg-red-950/90 text-red-300 border border-red-600/80 shadow-[0_0_8px_#dc2626]'
                    : 'bg-stone-900 text-stone-400 border border-stone-700'
                }`}>
                  {(p.alignment || currentWeapon?.def.altarAffinity) === 'sacred'
                    ? '✨ LADO SAGRADO'
                    : (p.alignment || currentWeapon?.def.altarAffinity) === 'cursed'
                    ? '🔥 LADO MALDITO'
                    : 'DETECTIVE BÚNKER'}
                </span>
                <span className="text-[9px] font-mono text-stone-500">
                  {Math.round(healthPercent)}%
                </span>
              </div>

              {/* Health row */}
              <div className="flex justify-between items-center text-[10px] font-mono text-stone-400">
                <span className="flex items-center gap-1 font-bold text-stone-200 tracking-wider">
                  <Heart className={`w-3.5 h-3.5 ${isLowHealth ? 'text-red-500 animate-ping' : 'text-emerald-400'}`} />
                  SALUD
                </span>
                <span className={`font-bold font-mono ${isLowHealth ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {Math.round(p.health)} / {p.maxHealth}
                </span>
              </div>

              {/* Health Bar */}
              <div className="w-full bg-stone-900 h-2.5 rounded-xs overflow-hidden border border-stone-800 relative">
                <div
                  className={`h-full transition-all duration-150 ${
                    healthPercent > 50 
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' 
                      : healthPercent > 25 
                      ? 'bg-gradient-to-r from-amber-600 to-amber-400' 
                      : 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
                  }`}
                  style={{ width: `${healthPercent}%` }}
                />
              </div>

              {/* Volition / Stamina Bar */}
              <div className="flex justify-between items-center text-[9px] font-mono text-stone-500 mt-0.5">
                <span className="tracking-wider uppercase">VOLICIÓN / SPRINT</span>
                <span>{Math.round(p.stamina)}%</span>
              </div>
              <div className="w-full bg-stone-900 h-1.5 rounded-xs overflow-hidden border border-stone-800">
                <div
                  className="bg-amber-500 h-full transition-all duration-75"
                  style={{ width: `${Math.max(0, Math.min(100, (p.stamina / p.maxStamina) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Perk-a-Cola icons */}
          <div className="flex items-center gap-2">
            {p.perks.map(perkId => {
              const def = PERK_REGISTRY[perkId];
              return (
                <div
                  key={perkId}
                  className={`w-9 h-9 sm:w-10 sm:h-10 ${def.iconBg} border border-amber-300/80 rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.3)] text-[10px] sm:text-xs font-bold text-white font-mono tracking-tighter hover:scale-105 transition-transform`}
                  title={`${def.name}: ${def.tagline}`}
                >
                  {def.name.slice(0, 3).toUpperCase()}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Vintage Arcade COD Points Display */}
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center bg-stone-950/90 border-2 border-stone-800 px-5 py-2 rounded-sm shadow-2xl backdrop-blur-sm">
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 font-bold">PUNTOS</span>
            <span className="font-['Black_Ops_One'] text-3xl sm:text-4xl text-amber-400 tracking-wider drop-shadow-[0_2px_10px_rgba(245,158,11,0.7)]">
              {p.points}
            </span>
          </div>

          {/* Quick Stats: Bajas y Tiros a la Cabeza */}
          <div className="flex items-center gap-3 text-[10px] font-mono text-stone-400 mt-1 bg-black/60 px-3 py-0.5 rounded-full border border-stone-800">
            <span>BAJAS: <strong className="text-white">{engine.stats.kills}</strong></span>
            <span>HEADSHOTS: <strong className="text-red-400">{engine.stats.headshots}</strong></span>
          </div>
        </div>

        {/* Right: Tactical Weapon Card & Ammo */}
        <div className="flex flex-col items-end gap-1.5 bg-stone-950/90 border border-stone-800/90 p-3 sm:p-3.5 rounded-sm shadow-2xl min-w-[150px] sm:min-w-[190px] backdrop-blur-sm">
          {currentWeapon ? (
            <>
              {/* Weapon Header & Tag */}
              <div className="flex items-center justify-between w-full border-b border-stone-800/80 pb-1">
                <span className="text-[9px] font-mono text-stone-400 tracking-wider uppercase font-bold">
                  {currentWeapon.def.type === 'wonder' ? 'ESPECIAL' : currentWeapon.def.type.toUpperCase()}
                </span>
                {currentWeapon.def.altarAffinity === 'sacred' && (
                  <span className="flex items-center gap-1 text-[9px] bg-sky-950 text-sky-300 border border-sky-400 px-1.5 py-0.2 rounded-xs font-mono font-bold shadow-[0_0_8px_rgba(56,189,248,0.6)]">
                    <Sparkles className="w-2.5 h-2.5 text-sky-300" /> SAGRADO
                  </span>
                )}
                {currentWeapon.def.altarAffinity === 'cursed' && (
                  <span className="flex items-center gap-1 text-[9px] bg-red-950 text-red-300 border border-red-500 px-1.5 py-0.2 rounded-xs font-mono font-bold shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse">
                    <Flame className="w-2.5 h-2.5 text-red-400" /> MALDITO
                  </span>
                )}
                {!currentWeapon.def.altarAffinity && currentWeapon.def.isPackAPunched && (
                  <span className="flex items-center gap-1 text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-400 px-1.5 py-0.2 rounded-xs font-mono font-bold animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                    <Sparkles className="w-2.5 h-2.5" /> PaP
                  </span>
                )}
              </div>

              {/* Weapon Name */}
              <div className="w-full text-right">
                <span className={`font-['Black_Ops_One'] text-base sm:text-lg tracking-wide ${
                  currentWeapon.def.altarAffinity === 'sacred' 
                    ? 'text-sky-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.85)]' 
                    : currentWeapon.def.altarAffinity === 'cursed'
                    ? 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.85)]'
                    : currentWeapon.def.isPackAPunched 
                    ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.85)]' 
                    : 'text-stone-100'
                }`}>
                  {currentWeapon.def.name}
                </span>
              </div>

              {/* Digital Ammo Readout */}
              <div className="flex items-baseline gap-1.5 font-['Black_Ops_One'] mt-0.5">
                <span className={`text-3xl sm:text-4xl ${currentWeapon.currentMag === 0 ? 'text-red-500 animate-pulse' : isLowAmmo ? 'text-amber-400 animate-pulse' : 'text-white'}`}>
                  {currentWeapon.currentMag}
                </span>
                <span className="text-stone-600 text-lg">/</span>
                <span className="text-stone-400 text-lg sm:text-xl font-mono">
                  {currentWeapon.reserveAmmo}
                </span>
              </div>

              {/* Bullet Magazine Graphic Visualizer */}
              <div className="flex items-center gap-0.5 mt-0.5">
                {Array.from({ length: Math.min(18, currentWeapon.def.magazineSize) }).map((_, idx) => {
                  const isLoaded = idx < Math.min(18, currentWeapon.currentMag);
                  return (
                    <div
                      key={idx}
                      className={`w-1.5 h-3.5 rounded-xs transition-colors ${
                        isLoaded 
                          ? currentWeapon.def.altarAffinity === 'sacred'
                            ? 'bg-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.8)]'
                            : currentWeapon.def.altarAffinity === 'cursed'
                            ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]'
                            : currentWeapon.def.isPackAPunched 
                            ? 'bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.8)]' 
                            : 'bg-amber-400' 
                          : 'bg-stone-800'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Low Ammo Alert or Reloading status */}
              {currentWeapon.isReloading ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono animate-pulse mt-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>RECARGANDO...</span>
                </div>
              ) : isLowAmmo ? (
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono animate-bounce mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>¡PULSA [R]!</span>
                </div>
              ) : null}

              {/* Grenades info */}
              <div className="flex items-center justify-between w-full border-t border-stone-800/80 pt-1.5 mt-1 text-xs font-mono">
                <span className="text-stone-400">GRANADAS [G]:</span>
                <span className="text-emerald-400 font-bold">{engine.grenadeCount}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 px-1 text-center">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse mb-1" />
              <span className="font-['Black_Ops_One'] text-sm text-amber-300">RITUAL EN PROCESO</span>
              <span className="text-[10px] font-mono text-stone-400">CANALIZANDO EN ALTAR...</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Touch Controls for phones/tablets */}
      <div className="pointer-events-auto sm:hidden flex justify-between items-center w-full px-2 py-1 mt-1">
        <div className="flex items-center gap-2">
          <button
            onTouchStart={() => onMobileButton && onMobileButton('knife')}
            className="w-12 h-12 rounded-full bg-stone-900/90 border border-red-500 text-red-400 flex items-center justify-center font-bold text-xs shadow-lg active:scale-95"
          >
            KNIFE
          </button>
          <button
            onTouchStart={() => onMobileButton && onMobileButton('grenade')}
            className="w-12 h-12 rounded-full bg-stone-900/90 border border-emerald-500 text-emerald-400 flex items-center justify-center font-bold text-xs shadow-lg active:scale-95"
          >
            NADE
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onTouchStart={() => onMobileButton && onMobileButton('interact')}
            className="w-12 h-12 rounded-full bg-stone-900/90 border border-amber-500 text-amber-400 flex items-center justify-center font-bold text-xs shadow-lg active:scale-95"
          >
            [F]
          </button>
          <button
            onTouchStart={() => onMobileButton && onMobileButton('reload')}
            className="w-12 h-12 rounded-full bg-stone-900/90 border border-blue-500 text-blue-400 flex items-center justify-center font-bold text-xs shadow-lg active:scale-95"
          >
            RELOAD
          </button>
          <button
            onTouchStart={() => onMobileButton && onMobileButton('switch')}
            className="w-12 h-12 rounded-full bg-stone-900/90 border border-stone-500 text-stone-300 flex items-center justify-center font-bold text-xs shadow-lg active:scale-95"
          >
            SWAP
          </button>
        </div>
      </div>
    </div>
  );
};
