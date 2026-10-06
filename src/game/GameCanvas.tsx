import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from './GameEngine';
import { GameRenderer } from './GameRenderer';
import { HUD } from '../components/HUD';
import { Minimap } from '../components/Minimap';
import { GameOverModal } from '../components/GameOverModal';
import { PauseMenu } from '../components/PauseMenu';
import { StartScreen } from '../components/StartScreen';
import { MultiplayerLobbyModal } from '../components/MultiplayerLobbyModal';
import { multiplayerClient } from '../multiplayer/MultiplayerClient';
import { soundEngine } from '../audio/soundEngine';

export const GameCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine>(new GameEngine());
  const rendererRef = useRef<GameRenderer | null>(null);

  // React UI state synced from engine
  const [gameStatus, setGameStatus] = useState<string>('start');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.35);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState<boolean>(false);
  const [, setTick] = useState<number>(0);

  // Input states
  const keysDown = useRef<Set<string>>(new Set());
  const mouseScreenPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseDown = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(performance.now());
  const lastSyncTime = useRef<number>(0);
  const lastUiTickRef = useRef<number>(0);
  const canvasRectRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });

  // Ambient Music Lifecycle
  useEffect(() => {
    if (gameStatus === 'playing') {
      soundEngine.startAmbientMusic();
    } else {
      soundEngine.stopAmbientMusic();
    }
    return () => {
      soundEngine.stopAmbientMusic();
    };
  }, [gameStatus]);

  // Mobile virtual joystick states
  const touchMove = useRef<{ active: boolean; startX: number; startY: number; currX: number; currY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0
  });

  const touchAim = useRef<{ active: boolean; startX: number; startY: number; currX: number; currY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0
  });

  // Mobile one-shot button triggers
  const mobileTriggers = useRef<{
    knife: boolean;
    grenade: boolean;
    reload: boolean;
    switch: boolean;
    interact: boolean;
  }>({
    knife: false,
    grenade: false,
    reload: false,
    switch: false,
    interact: false
  });

  // Initialize Canvas & Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new GameRenderer(ctx);

    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      canvas.width = w;
      canvas.height = h;
      rendererRef.current?.resize(w, h);
      const r = canvas.getBoundingClientRect();
      canvasRectRef.current = { left: r.left, top: r.top };
    };

    const handleScroll = () => {
      if (canvas) {
        const r = canvas.getBoundingClientRect();
        canvasRectRef.current = { left: r.left, top: r.top };
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Hook Multiplayer Network Events to GameEngine
  useEffect(() => {
    const engine = engineRef.current;

    // 1. When local player shoots, send bullet to squad
    engine.onBulletFired = (bullet) => {
      if (multiplayerClient.isConnected && multiplayerClient.roomId) {
        multiplayerClient.broadcastBullet(bullet);
      }
    };

    // 2. When local player opens door/powers up/activates trap
    engine.onWorldAction = (action, data) => {
      if (multiplayerClient.isConnected && multiplayerClient.roomId) {
        multiplayerClient.broadcastWorldAction(action, data);
      }
    };

    // 3. When a remote peer shoots
    const handlePeerBullet = (data: any) => {
      if (data.bullet) {
        engine.bullets.push({
          ...data.bullet,
          fromPlayer: false
        });
        soundEngine.playGunshot('rifle', data.bullet.color === '#38bdf8');
      }
    };

    // 4. When a remote peer performs world action (open door, turn power)
    const handleWorldEvent = (data: any) => {
      if (data.action === 'door_open' && data.data?.doorId) {
        const d = engine.map.doors.find(door => door.id === data.data.doorId);
        if (d && !d.isOpen) {
          d.isOpen = true;
          soundEngine.playPointsClink();
        }
      } else if (data.action === 'power_on') {
        if (!engine.map.powerSwitch.isOn) {
          engine.map.powerSwitch.isOn = true;
          soundEngine.playPowerOn();
        }
      } else if (data.action === 'trap_activate') {
        engine.map.electricTrap.isActive = true;
        engine.map.electricTrap.activeTime = 25;
        soundEngine.playPowerOn();
      }
    };

    multiplayerClient.on('peer_bullet', handlePeerBullet);
    multiplayerClient.on('world_event', handleWorldEvent);

    return () => {
      multiplayerClient.off('peer_bullet', handlePeerBullet);
      multiplayerClient.off('world_event', handleWorldEvent);
    };
  }, []);

  // Keyboard and Mouse Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown.current.add(e.code);

      // Escape to Pause
      if (e.code === 'Escape') {
        const engine = engineRef.current;
        if (engine.status === 'playing') {
          engine.status = 'paused';
          setGameStatus('paused');
        } else if (engine.status === 'paused') {
          engine.status = 'playing';
          setGameStatus('playing');
        }
      }

      // Audio context unlock on interaction
      soundEngine.ensureContext();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current.delete(e.code);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseScreenPos.current.x = e.clientX - canvasRectRef.current.left;
      mouseScreenPos.current.y = e.clientY - canvasRectRef.current.top;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown.current = true;
      } else if (e.button === 2) {
        // Right click knife melee
        mobileTriggers.current.knife = true;
      }
      soundEngine.ensureContext();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown.current = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Touch Event Handling for Mobile Screens
  const handleTouchStart = (e: React.TouchEvent) => {
    soundEngine.ensureContext();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const tx = t.clientX - rect.left;
      const ty = t.clientY - rect.top;

      // Left half = Movement Joystick
      if (tx < rect.width * 0.45 && !touchMove.current.active) {
        touchMove.current = {
          active: true,
          startX: tx,
          startY: ty,
          currX: tx,
          currY: ty
        };
      } else if (tx >= rect.width * 0.45 && !touchAim.current.active) {
        // Right half = Aim & Auto-Shoot Joystick
        touchAim.current = {
          active: true,
          startX: tx,
          startY: ty,
          currX: tx,
          currY: ty
        };
        mouseScreenPos.current = { x: tx, y: ty };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const tx = t.clientX - rect.left;
      const ty = t.clientY - rect.top;

      if (touchMove.current.active && tx < rect.width * 0.5) {
        touchMove.current.currX = tx;
        touchMove.current.currY = ty;
      } else if (touchAim.current.active && tx >= rect.width * 0.5) {
        touchAim.current.currX = tx;
        touchAim.current.currY = ty;
        mouseScreenPos.current = { x: tx, y: ty };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const tx = t.clientX - rect.left;

      if (tx < rect.width * 0.5) {
        touchMove.current.active = false;
      } else {
        touchAim.current.active = false;
      }
    }
  };

  // Main Game Loop (60 FPS)
  useEffect(() => {
    let animId: number;

    const loop = (currentTime: number) => {
      const rawDt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      const dt = Math.min(rawDt, 0.08); // Prevent large delta jumps

      const engine = engineRef.current;
      const renderer = rendererRef.current;

      if (engine.status === 'playing' && renderer) {
        // Calculate Movement Input (Keyboard + Mobile Joystick)
        let moveX = 0;
        let moveY = 0;

        if (keysDown.current.has('KeyW') || keysDown.current.has('ArrowUp')) moveY -= 1;
        if (keysDown.current.has('KeyS') || keysDown.current.has('ArrowDown')) moveY += 1;
        if (keysDown.current.has('KeyA') || keysDown.current.has('ArrowLeft')) moveX -= 1;
        if (keysDown.current.has('KeyD') || keysDown.current.has('ArrowRight')) moveX += 1;

        if (touchMove.current.active) {
          const deltaX = touchMove.current.currX - touchMove.current.startX;
          const deltaY = touchMove.current.currY - touchMove.current.startY;
          const dist = Math.hypot(deltaX, deltaY);
          const maxDist = 55;
          if (dist > 5) {
            moveX = Math.max(-1, Math.min(1, deltaX / maxDist));
            moveY = Math.max(-1, Math.min(1, deltaY / maxDist));
          }
        }

        // Aim World Coordinates (Screen to World translation via Camera)
        const canvasW = canvasRef.current?.width || 800;
        const canvasH = canvasRef.current?.height || 600;
        const camX = engine.player.x - canvasW / 2;
        const camY = engine.player.y - canvasH / 2;

        const aimWorldX = mouseScreenPos.current.x + camX;
        const aimWorldY = mouseScreenPos.current.y + camY;

        // Action Inputs
        const isShooting = isMouseDown.current || touchAim.current.active;
        const sprint = keysDown.current.has('ShiftLeft') || keysDown.current.has('ShiftRight');
        const reload = keysDown.current.has('KeyR') || mobileTriggers.current.reload;
        const interact = keysDown.current.has('KeyF') || mobileTriggers.current.interact;
        const knife = keysDown.current.has('KeyE') || keysDown.current.has('Space') || mobileTriggers.current.knife;
        const switchWeapon = keysDown.current.has('KeyQ') || keysDown.current.has('Digit1') || keysDown.current.has('Digit2') || mobileTriggers.current.switch;
        const throwGrenade = keysDown.current.has('KeyG') || mobileTriggers.current.grenade;

        // Reset one-shot mobile triggers
        mobileTriggers.current.reload = false;
        mobileTriggers.current.knife = false;
        mobileTriggers.current.switch = false;
        mobileTriggers.current.grenade = false;

        // Update Game Engine
        engine.update(dt, {
          moveX,
          moveY,
          aimX: aimWorldX,
          aimY: aimWorldY,
          shoot: isShooting,
          sprint,
          interact,
          reload,
          knife,
          switchWeapon,
          throwGrenade
        });

        // Hitmarker trigger
        if (engine.hasNewHit) {
          renderer.triggerHitmarker();
          engine.hasNewHit = false;
        }

        // Multiplayer Sync (Periodic 20Hz update)
        if (multiplayerClient.isConnected && multiplayerClient.roomId) {
          const now = performance.now();
          if (now - lastSyncTime.current > 45) {
            lastSyncTime.current = now;
            const p = engine.player;
            const curW = p.weapons[p.currentWeaponIndex];
            multiplayerClient.syncPlayerState({
              x: p.x,
              y: p.y,
              angle: p.angle,
              health: p.health,
              maxHealth: p.maxHealth,
              isDowned: p.health <= 0,
              currentWeaponName: curW?.def.name || 'M1911',
              isPackAPunched: curW?.def.isPackAPunched || false,
              isKnifing: p.isKnifing,
              score: p.points,
              kills: engine.stats.kills
            });
          }
        }

        const remoteSquad = Array.from(multiplayerClient.remotePlayersMap.values());

        // Render Frame
        renderer.render(engine, { x: aimWorldX, y: aimWorldY }, dt, remoteSquad);

        // Sync status if changed (e.g. game over)
        if (engine.status !== gameStatus) {
          setGameStatus(engine.status);
        }
      }

      // Tick UI for ammo, points, and timers
      setTick(prev => prev + 1);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameStatus]);

  // Solo Start
  const handleStartSolo = useCallback(() => {
    multiplayerClient.disconnect();
    engineRef.current.resetGame();
    engineRef.current.status = 'playing';
    setGameStatus('playing');
  }, []);

  // Co-op Start from Lobby
  const handleStartCoop = useCallback(() => {
    setIsMultiplayerOpen(false);
    engineRef.current.resetGame();
    engineRef.current.status = 'playing';
    setGameStatus('playing');
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current.resetGame();
    engineRef.current.status = 'playing';
    setGameStatus('playing');
  }, []);

  // Exit and return to main menu
  const handleQuitToMenu = useCallback(() => {
    multiplayerClient.disconnect();
    engineRef.current.resetGame();
    engineRef.current.status = 'start';
    setGameStatus('start');
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current.status = 'playing';
    setGameStatus('playing');
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current.status = 'paused';
    setGameStatus('paused');
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    soundEngine.setMuted(nextMuted);
    setIsMuted(nextMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((newVol: number) => {
    soundEngine.setVolume(newVol);
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      soundEngine.setMuted(false);
      setIsMuted(false);
    }
  }, [isMuted]);

  const handleMobileButton = useCallback((action: string) => {
    if (action === 'knife') mobileTriggers.current.knife = true;
    if (action === 'grenade') mobileTriggers.current.grenade = true;
    if (action === 'reload') mobileTriggers.current.reload = true;
    if (action === 'switch') mobileTriggers.current.switch = true;
    if (action === 'interact') mobileTriggers.current.interact = true;
  }, []);

  const remoteSquad = Array.from(multiplayerClient.remotePlayersMap.values());

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-[#07090c] overflow-hidden select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
      />

      {/* In-Game HUD & Radar */}
      {gameStatus === 'playing' && (
        <>
          <HUD
            engine={engineRef.current}
            onPause={handlePause}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            onMobileButton={handleMobileButton}
          />
          <Minimap 
            engine={engineRef.current} 
            remotePlayers={remoteSquad}
          />
        </>
      )}

      {/* Start Title Screen (Solo vs Multiplayer Choice) */}
      {gameStatus === 'start' && (
        <StartScreen 
          onStartSolo={handleStartSolo} 
          onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
        />
      )}

      {/* Multiplayer Lobby Modal */}
      {isMultiplayerOpen && (
        <MultiplayerLobbyModal 
          onClose={() => setIsMultiplayerOpen(false)}
          onGameStart={handleStartCoop}
        />
      )}

      {/* Pause Menu Modal with Quit to Menu option */}
      {gameStatus === 'paused' && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onQuitToMenu={handleQuitToMenu}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          volume={volume}
          onVolumeChange={handleVolumeChange}
        />
      )}

      {/* Game Over Modal with Quit to Menu option */}
      {gameStatus === 'gameover' && (
        <GameOverModal
          stats={engineRef.current.stats}
          round={engineRef.current.round}
          onRestart={handleRestart}
          onQuitToMenu={handleQuitToMenu}
        />
      )}
    </div>
  );
};
