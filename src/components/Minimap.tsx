import React, { useRef, useEffect, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { Compass, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { RemotePlayer } from '../multiplayer/MultiplayerClient';

interface MinimapProps {
  engine: GameEngine;
  remotePlayers?: RemotePlayer[];
}

export const Minimap: React.FC<MinimapProps> = ({ engine, remotePlayers = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Listen to 'M' key to toggle minimap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        setIsCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isCollapsed) return;

    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const mapW = engine.map.width;
      const mapH = engine.map.height;

      const scaleX = w / mapW;
      const scaleY = h / mapH;

      ctx.clearRect(0, 0, w, h);

      // Radar dark background
      ctx.fillStyle = '#080a0e';
      ctx.fillRect(0, 0, w, h);

      // Subtle tactical grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Rooms / Walls
      ctx.fillStyle = '#334155';
      for (const wall of engine.map.walls) {
        ctx.fillRect(
          wall.x * scaleX, 
          wall.y * scaleY, 
          Math.max(1.5, wall.w * scaleX), 
          Math.max(1.5, wall.h * scaleY)
        );
      }

      // Doors (Orange if closed, subtle green if open)
      for (const d of engine.map.doors) {
        if (!d.isOpen) {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(d.x * scaleX, d.y * scaleY, Math.max(2, d.w * scaleX), Math.max(2, d.h * scaleY));
        } else {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
          ctx.fillRect(d.x * scaleX, d.y * scaleY, Math.max(2, d.w * scaleX), Math.max(2, d.h * scaleY));
        }
      }

      // Electric Trap location
      const trap = engine.map.electricTrap;
      ctx.fillStyle = trap.isActive ? '#0284c7' : '#713f12';
      ctx.fillRect(trap.x * scaleX, trap.y * scaleY, trap.w * scaleX, Math.max(2, trap.h * scaleY));

      // Active Mystery Box (Glowing Amber)
      const activeBox = engine.map.mysteryBoxes.find(b => b.isActive);
      if (activeBox) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 6;
        ctx.fillRect(activeBox.x * scaleX - 1, activeBox.y * scaleY - 1, 5, 4);
        ctx.shadowBlur = 0;
      }

      // Perk Machines (Cyan dots)
      ctx.fillStyle = '#06b6d4';
      for (const pm of engine.map.perkMachines) {
        ctx.fillRect(pm.x * scaleX, pm.y * scaleY, 3, 3);
      }

      // Altares Místicos (Sagrado y Maldito)
      for (const altar of engine.map.altars) {
        ctx.fillStyle = altar.type === 'sacred' ? '#38bdf8' : '#ef4444';
        ctx.fillRect(altar.x * scaleX, altar.y * scaleY, 4, 4);
      }

      // Power Switch (Emerald if ON, Red if OFF)
      ctx.fillStyle = engine.map.powerSwitch.isOn ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.arc(engine.map.powerSwitch.x * scaleX, engine.map.powerSwitch.y * scaleY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Zombies (Pulsing Red blips)
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 4;
      for (const z of engine.zombies) {
        ctx.beginPath();
        ctx.arc(z.x * scaleX, z.y * scaleY, z.type === 'hellhound' ? 2.5 : 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Remote Squadmates (Cyan/Blue beacons)
      for (const rp of remotePlayers) {
        ctx.save();
        ctx.translate(rp.x * scaleX, rp.y * scaleY);
        ctx.fillStyle = rp.isDowned ? '#ef4444' : '#38bdf8';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Player Beacon (Green arrow with vision cone)
      const p = engine.player;
      ctx.save();
      ctx.translate(p.x * scaleX, p.y * scaleY);
      ctx.rotate(p.angle);

      // Player view cone
      ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 20, -0.45, 0.45);
      ctx.closePath();
      ctx.fill();

      // Player triangle arrow
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-3.5, -3);
      ctx.lineTo(-1.5, 0);
      ctx.lineTo(-3.5, 3);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      // Radar sweep beam effect
      const sweep = (Date.now() / 18) % h;
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, sweep);
      ctx.lineTo(w, sweep);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine, isCollapsed]);

  return (
    <div 
      className="hidden sm:flex flex-col absolute top-[66px] right-3 sm:right-5 z-20 pointer-events-auto bg-stone-950/90 border border-stone-800/90 rounded-sm shadow-2xl backdrop-blur-md overflow-hidden select-none transition-all duration-200"
      style={{ width: isCollapsed ? '136px' : '148px' }}
    >
      {/* Header bar: Title, Zombie count, and Collapse Toggle */}
      <div 
        onClick={() => setIsCollapsed(prev => !prev)}
        className="flex items-center justify-between px-2 py-1 bg-stone-900/90 border-b border-stone-800/80 cursor-pointer hover:bg-stone-800/90 transition-colors"
        title="Haz clic o pulsa [M] para alternar el Minimapa"
      >
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-emerald-400">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>RADAR</span>
        </div>

        <div className="flex items-center gap-1 text-[9px] font-mono text-stone-400">
          <span className="text-red-400 font-bold">{engine.zombies.length}Z</span>
          {isCollapsed ? (
            <ChevronDown className="w-3 h-3 text-stone-400" />
          ) : (
            <ChevronUp className="w-3 h-3 text-stone-400" />
          )}
        </div>
      </div>

      {/* Radar Canvas Body (Visible when expanded) */}
      {!isCollapsed && (
        <div className="p-1.5 flex flex-col items-center">
          <div className="relative border border-stone-800/80 rounded-xs overflow-hidden">
            <canvas
              ref={canvasRef}
              width={136}
              height={116}
              className="block"
            />
          </div>

          {/* Quick Legend / Hotkey tip */}
          <div className="flex items-center justify-between w-full px-1 text-[8px] font-mono text-stone-500 mt-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> TÚ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> ENERO
            </span>
            <span className="text-stone-400 font-bold">[M]</span>
          </div>
        </div>
      )}
    </div>
  );
};
