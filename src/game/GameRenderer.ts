import { GameEngine } from './GameEngine';
import { PERK_REGISTRY, WEAPON_REGISTRY, MYSTERY_BOX_WEAPONS } from '../data/weapons';
import { RemotePlayer } from '../multiplayer/MultiplayerClient';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 800;
  private height: number = 600;
  public hitmarkerTimer: number = 0;

  // Pre-seeded noise/crack points for consistent painterly floor rendering
  private floorCracks: Array<{ x: number; y: number; segments: Array<{ dx: number; dy: number }> }> = [];
  private puddles: Array<{ x: number; y: number; rx: number; ry: number; rot: number }> = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.generatePainterlyDetails();
  }

  private generatePainterlyDetails() {
    // Generate static artistic cracks across the bunker concrete
    const seedPoints = [
      { x: 350, y: 1200 }, { x: 620, y: 1400 }, { x: 450, y: 1050 },
      { x: 300, y: 400 }, { x: 750, y: 350 }, { x: 550, y: 750 },
      { x: 1200, y: 1300 }, { x: 1550, y: 1400 }, { x: 1700, y: 1100 },
      { x: 1300, y: 350 }, { x: 1500, y: 650 }, { x: 1750, y: 450 }
    ];

    this.floorCracks = seedPoints.map(pt => {
      const segments: Array<{ dx: number; dy: number }> = [];
      let cx = 0;
      let cy = 0;
      const count = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        cx += (Math.random() - 0.5) * 35;
        cy += (Math.random() - 0.5) * 35;
        segments.push({ dx: cx, dy: cy });
      }
      return { x: pt.x, y: pt.y, segments };
    });

    // Generate wet puddles with reflective sheen (Disco Elysium motif)
    this.puddles = [
      { x: 400, y: 1300, rx: 75, ry: 45, rot: 0.2 },
      { x: 650, y: 1150, rx: 90, ry: 50, rot: -0.3 },
      { x: 380, y: 450, rx: 110, ry: 60, rot: 0.15 },
      { x: 720, y: 680, rx: 85, ry: 55, rot: -0.1 },
      { x: 1400, y: 1250, rx: 120, ry: 65, rot: 0.25 },
      { x: 1650, y: 1350, rx: 95, ry: 50, rot: -0.15 },
      { x: 1350, y: 550, rx: 105, ry: 58, rot: 0.05 },
      { x: 1620, y: 550, rx: 100, ry: 52, rot: -0.2 }
    ];
  }

  public resize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  public triggerHitmarker() {
    this.hitmarkerTimer = 0.15;
  }

  public render(
    engine: GameEngine, 
    mouseWorldPos: { x: number; y: number }, 
    dt: number = 0.016,
    remotePlayers?: RemotePlayer[]
  ) {
    const ctx = this.ctx;
    const player = engine.player;

    if (this.hitmarkerTimer > 0) {
      this.hitmarkerTimer -= dt;
    }

    // Apply Screen Shake
    ctx.save();
    if (engine.screenShake > 0) {
      const sx = (Math.random() - 0.5) * engine.screenShake * 2;
      const sy = (Math.random() - 0.5) * engine.screenShake * 2;
      ctx.translate(sx, sy);
    }

    // Camera transform: Center smoothly on player
    const camX = player.x - this.width / 2;
    const camY = player.y - this.height / 2;

    ctx.save();
    ctx.translate(-camX, -camY);

    // 1. Painterly Asphalt & Concrete Floor with Weathered Tiles & Wet Puddles
    this.renderFloor(engine);

    // 2. Chiaroscuro Wall Shadows (Atmospheric depth cast across the ground)
    this.renderWallCastShadows(engine);

    // 3. Oil-Paint Blood Decals
    this.renderBloodDecals(engine);

    // 4. Wall Buys & Chalk Inscriptions
    this.renderWallBuys(engine);

    // 5. Doors & Barricades (Reinforced Windows)
    this.renderDoorsAndBarricades(engine);

    // 6. Interactive Machines & Mystical Altars
    this.renderMachines(engine);

    // 7. Power-Up Drops
    this.renderPowerUps(engine);

    // 8. Grenades
    this.renderGrenades(engine);

    // 9. Painterly Undead Zombies & Hellhounds
    this.renderZombies(engine);

    // 10. Painterly Player & Co-op Squadmates
    this.renderPlayer(engine);
    if (remotePlayers && remotePlayers.length > 0) {
      this.renderRemotePlayers(remotePlayers);
    }

    // 11. Projectiles & Tracers
    this.renderBullets(engine);

    // 12. Particles, Smoke & Embers
    this.renderParticles(engine);

    // 13. Solid Architectural Walls (Weathered concrete with bevel & trim)
    this.renderWalls(engine);

    // 14. Neon Signs, Atmospheric Lighting & Flashlight
    this.renderLighting(engine, camX, camY);

    // 15. Floating Tactical Numbers
    this.renderFloatingTexts(engine);

    ctx.restore(); // Restore camera translate

    // 16. Aim Crosshair & Hitmarker
    this.renderCrosshair(mouseWorldPos, camX, camY);

    // 17. Painterly Vignette & Damage Overlay
    this.renderScreenDamageVignette(engine);

    ctx.restore(); // Restore screen shake
  }

  // --- PAINTERLY FLOOR & GROUND RENDERING (Disco Elysium Aesthetic) ---
  private renderFloor(engine: GameEngine) {
    const ctx = this.ctx;

    // Void exterior ground (deep moody asphalt abyss)
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(0, 0, 2100, 1900);

    // Outdoor muddy perimeter around windows
    ctx.fillStyle = '#11151c';
    ctx.fillRect(50, 1050, 150, 250);
    ctx.fillRect(300, 1560, 200, 150);
    ctx.fillRect(20, 350, 80, 200);
    ctx.fillRect(500, 10, 200, 90);
    ctx.fillRect(1876, 1150, 150, 200);
    ctx.fillRect(1350, 10, 200, 90);

    // Sector 1: Spawn Room (Cold, stained industrial bunker floor)
    ctx.fillStyle = '#181d24';
    ctx.fillRect(200, 950, 620, 610);

    // Sector 2: Courtyard / Central Hub (Weathered wet asphalt with olive/umber undertones)
    ctx.fillStyle = '#1e1c18';
    ctx.fillRect(100, 100, 950, 850);

    // Sector 3: Central Eléctrica (Sooted, grime-stained utility floor)
    ctx.fillStyle = '#191f24';
    ctx.fillRect(820, 950, 1056, 610);

    // Sector 4: Laboratorio 115 (Polished cold slate with ritual discoloration)
    ctx.fillStyle = '#131e26';
    ctx.fillRect(1050, 100, 826, 850);

    // Decorative industrial railway track in Courtyard (Disco Elysium reference)
    ctx.save();
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(150, 680);
    ctx.lineTo(950, 680);
    ctx.moveTo(150, 725);
    ctx.lineTo(950, 725);
    ctx.stroke();

    // Wooden railway ties
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 6;
    for (let rx = 160; rx <= 940; rx += 28) {
      ctx.beginPath();
      ctx.moveTo(rx, 672);
      ctx.lineTo(rx, 733);
      ctx.stroke();
    }
    ctx.restore();

    // Painterly Concrete Slab Grid & Seams
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    const tileSize = 70;

    ctx.beginPath();
    for (let x = 100; x <= 1876; x += tileSize) {
      ctx.moveTo(x, 100);
      ctx.lineTo(x, 1560);
    }
    for (let y = 100; y <= 1560; y += tileSize) {
      ctx.moveTo(100, y);
      ctx.lineTo(1876, y);
    }
    ctx.stroke();
    ctx.restore();

    // Wet Puddles with Light Sheen (Signature Disco Elysium wet ground)
    for (const p of this.puddles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      // Dark water pool
      ctx.fillStyle = 'rgba(10, 15, 22, 0.65)';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Soft water edge rim
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Specular sky/light reflection gradient across puddle
      const grad = ctx.createLinearGradient(-p.rx * 0.5, -p.ry, p.rx * 0.5, p.ry);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.08)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.06)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.rx * 0.85, p.ry * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Concrete Weather Cracks
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1.2;
    for (const crack of this.floorCracks) {
      ctx.beginPath();
      ctx.moveTo(crack.x, crack.y);
      for (const seg of crack.segments) {
        ctx.lineTo(crack.x + seg.dx, crack.y + seg.dy);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Weathered Stencil Sector Markings
    ctx.save();
    ctx.font = 'bold 20px "Black Ops One", cursive';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.textAlign = 'center';

    ctx.fillText('SECTOR 1 // BARRACÓN OESTE', 510, 1260);
    ctx.fillText('SECTOR 2 // PATIO DE CARGA', 570, 480);
    ctx.fillText('SECTOR 3 // SUB-ESTACIÓN 115', 1350, 1350);
    ctx.fillText('SECTOR 4 // SANTUARIO RITUAL', 1460, 600);
    ctx.restore();

    // Doorway Warning Hazard Stripes
    this.drawCautionStripes(450, 938, 120, 24);
    this.drawCautionStripes(808, 1200, 24, 120);
    this.drawCautionStripes(1038, 480, 24, 120);
    this.drawCautionStripes(1450, 938, 120, 24); // Door 4 Power <-> Lab
  }

  // --- CHIAROSCURO WALL CAST SHADOWS (Creates tangible isometric depth) ---
  private renderWallCastShadows(engine: GameEngine) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    const shadowDist = 26;

    for (const w of engine.map.walls) {
      if (!w.isSolid) continue;
      // Project shadow angled slightly down and right
      ctx.fillRect(w.x + 4, w.y + w.h, w.w + shadowDist * 0.5, shadowDist);
    }
    ctx.restore();
  }

  private drawCautionStripes(x: number, y: number, w: number, h: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 5;
    const maxDim = Math.max(w, h);
    for (let i = -maxDim; i < maxDim * 2; i += 14) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + h, y + h);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- PAINTERLY OIL-PAINT BLOOD DECALS ---
  private renderBloodDecals(engine: GameEngine) {
    const ctx = this.ctx;
    for (const d of engine.bloodDecals) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);

      // Deep dried blood base
      ctx.fillStyle = `rgba(69, 10, 10, ${d.alpha * 0.85})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, d.size * 1.05, d.size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Arterial crimson center (oil paint texture)
      ctx.fillStyle = `rgba(153, 27, 27, ${d.alpha * 0.75})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, d.size * 0.8, d.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Viscous droplets & spatter
      ctx.fillStyle = `rgba(185, 28, 28, ${d.alpha * 0.7})`;
      for (let s = 0; s < 5; s++) {
        const angle = (s * Math.PI) / 2.5;
        const offX = Math.cos(angle) * (d.size * 0.95);
        const offY = Math.sin(angle) * (d.size * 0.75);
        ctx.beginPath();
        ctx.arc(offX, offY, d.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderWallBuys(engine: GameEngine) {
    const ctx = this.ctx;
    for (const wb of engine.map.wallBuys) {
      const def = WEAPON_REGISTRY[wb.weaponId];
      if (!def) continue;

      ctx.save();
      ctx.translate(wb.x, wb.y);

      // Weathered chalk weapon outline
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);

      ctx.strokeRect(-24, -8, 48, 16);
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(-6, -14);
      ctx.lineTo(8, -14);
      ctx.lineTo(14, -8);
      ctx.stroke();

      ctx.setLineDash([]);

      // Chalk text cost
      ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${def.name} [${def.wallCost}]`, 0, wb.facing === 'top' ? -20 : 26);

      ctx.restore();
    }
  }

  private renderDoorsAndBarricades(engine: GameEngine) {
    const ctx = this.ctx;

    // Doors
    for (const d of engine.map.doors) {
      if (d.isOpen) continue;

      ctx.save();
      ctx.fillStyle = '#262626';
      ctx.fillRect(d.x, d.y, d.w, d.h);

      // Reinforced steel plating with rivets
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.strokeRect(d.x, d.y, d.w, d.h);

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`BLOQUEADO [${d.cost}]`, d.x + d.w / 2, d.y + d.h / 2);

      ctx.restore();
    }

    // Windows & Barricades
    for (const b of engine.map.barricades) {
      ctx.save();

      // Window Frame opening
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      // Wooden Planks nailed across
      for (let p = 0; p < b.planks; p++) {
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1;

        if (b.w > b.h) {
          // Horizontal window (planks spaced along width)
          const px = b.x + (p * (b.w - 14)) / Math.max(1, b.maxPlanks - 1);
          ctx.fillRect(px, b.y - 2, 12, b.h + 4);
          ctx.strokeRect(px, b.y - 2, 12, b.h + 4);
        } else {
          // Vertical window (planks spaced along height)
          const py = b.y + (p * (b.h - 14)) / Math.max(1, b.maxPlanks - 1);
          ctx.fillRect(b.x - 2, py, b.w + 4, 12);
          ctx.strokeRect(b.x - 2, py, b.w + 4, 12);
        }
      }

      ctx.restore();
    }
  }

  // --- INTERACTIVE MACHINES & ALTARS ---
  private renderMachines(engine: GameEngine) {
    const ctx = this.ctx;
    const powerOn = engine.map.powerSwitch.isOn;

    // 1. Perk-a-Cola Machines
    for (const pm of engine.map.perkMachines) {
      const def = PERK_REGISTRY[pm.id];
      if (!def) continue;

      ctx.save();
      ctx.translate(pm.x, pm.y);

      // Machine Cabinet
      ctx.fillStyle = def.color;
      ctx.fillRect(0, 0, pm.w, pm.h);
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, pm.w, pm.h);

      // Glowing emblem
      ctx.fillStyle = def.iconBg;
      ctx.beginPath();
      ctx.arc(pm.w / 2, pm.h * 0.4, 11, 0, Math.PI * 2);
      ctx.fill();

      if (powerOn) {
        ctx.shadowColor = def.color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(def.name.slice(0, 7), pm.w / 2, pm.h - 8);

      ctx.restore();
    }

    // 2. Mystery Box
    for (const mb of engine.map.mysteryBoxes) {
      ctx.save();
      ctx.translate(mb.x, mb.y);

      ctx.fillStyle = '#292524';
      ctx.fillRect(0, 0, mb.w, mb.h);

      if (mb.isActive) {
        // Glowing question marks
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, mb.w, mb.h);

        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 15px "Black Ops One", cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('? ?', mb.w / 2, mb.h / 2);
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = '#57534e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, 0, mb.w, mb.h);
      }
      ctx.restore();
    }

    // 3. Altares Místicos: Altar Sagrado y Altar Maldito
    for (const altar of engine.map.altars) {
      ctx.save();
      ctx.translate(altar.x, altar.y);

      const isSacred = altar.type === 'sacred';
      const mainColor = isSacred ? '#38bdf8' : '#ef4444';
      const runeColor = isSacred ? '#fef08a' : '#f87171';

      // Stone altar pedestal
      ctx.fillStyle = isSacred ? '#0f172a' : '#18181b';
      ctx.fillRect(0, 0, altar.w, altar.h);
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(0, 0, altar.w, altar.h);

      // Corner ritual pillars
      ctx.fillStyle = isSacred ? '#334155' : '#27272a';
      ctx.fillRect(-3, -3, 10, 10);
      ctx.fillRect(altar.w - 7, -3, 10, 10);
      ctx.fillRect(-3, altar.h - 7, 10, 10);
      ctx.fillRect(altar.w - 7, altar.h - 7, 10, 10);

      if (powerOn) {
        ctx.shadowColor = mainColor;
        ctx.shadowBlur = altar.isUpgrading ? 35 : 16;

        if (isSacred) {
          // Holy light beam & divine aura
          const grad = ctx.createLinearGradient(altar.w / 2, altar.h, altar.w / 2, -45);
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
          grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(8, altar.h / 2);
          ctx.lineTo(altar.w / 2, -50);
          ctx.lineTo(altar.w - 8, altar.h / 2);
          ctx.fill();

          // Holy chalice / relic symbol
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(altar.w / 2, altar.h / 2 - 4, 7, 0, Math.PI);
          ctx.fill();
          ctx.fillRect(altar.w / 2 - 2, altar.h / 2 + 2, 4, 8);
        } else {
          // Infernal fire & demonic flames
          for (let f = 0; f < 3; f++) {
            ctx.fillStyle = f === 0 ? '#ef4444' : f === 1 ? '#f97316' : '#a855f7';
            ctx.beginPath();
            const fx = altar.w * (0.3 + f * 0.2);
            const fy = altar.h / 2 + (Math.sin(Date.now() / 150 + f) * 3);
            ctx.arc(fx, fy - 6, 5 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
          }

          // Demonic horns icon
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(altar.w / 2 - 12, altar.h / 2 - 8);
          ctx.lineTo(altar.w / 2 - 6, altar.h / 2);
          ctx.lineTo(altar.w / 2 + 6, altar.h / 2);
          ctx.lineTo(altar.w / 2 + 12, altar.h / 2 - 8);
          ctx.stroke();
        }
      }

      // Altar label
      ctx.fillStyle = runeColor;
      ctx.font = 'bold 8.5px "Black Ops One", cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isSacred ? 'ALTAR SAGRADO' : 'ALTAR MALDITO', altar.w / 2, altar.h - 10);

      ctx.restore();
    }

    // 4. Power Switch
    const ps = engine.map.powerSwitch;
    ctx.save();
    ctx.translate(ps.x, ps.y);
    ctx.fillStyle = '#292524';
    ctx.fillRect(-15, -25, 30, 50);
    ctx.strokeStyle = '#a8a29e';
    ctx.strokeRect(-15, -25, 30, 50);

    // Indicator Light
    ctx.fillStyle = ps.isOn ? '#22c55e' : '#ef4444';
    ctx.shadowColor = ps.isOn ? '#22c55e' : '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, -12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Switch handle
    ctx.strokeStyle = '#f4f4f5';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, ps.isOn ? -4 : 20);
    ctx.stroke();

    ctx.restore();

    // 5. Electric Trap Corridor
    const trap = engine.map.electricTrap;
    ctx.save();
    ctx.fillStyle = trap.isActive ? '#0369a1' : '#1c1917';
    ctx.fillRect(trap.x, trap.y, trap.w, trap.h);
    ctx.strokeStyle = trap.isActive ? '#38bdf8' : '#eab308';
    ctx.lineWidth = 2;
    ctx.strokeRect(trap.x, trap.y, trap.w, trap.h);

    if (trap.isActive) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2.5;
      for (let a = 0; a < 3; a++) {
        ctx.beginPath();
        ctx.moveTo(trap.x, trap.y + 5 + a * 8);
        const midX1 = trap.x + trap.w * 0.33;
        const midY1 = trap.y + (Math.random() * trap.h);
        const midX2 = trap.x + trap.w * 0.66;
        const midY2 = trap.y + (Math.random() * trap.h);
        ctx.lineTo(midX1, midY1);
        ctx.lineTo(midX2, midY2);
        ctx.lineTo(trap.x + trap.w, trap.y + 5 + a * 8);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  private renderPowerUps(engine: GameEngine) {
    const ctx = this.ctx;
    for (const p of engine.powerUpDrops) {
      ctx.save();
      ctx.translate(p.x, p.y);

      const scale = 1 + Math.sin(p.pulse) * 0.15;
      ctx.scale(scale, scale);

      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type.replace('_', ' ').toUpperCase(), 0, 0);

      ctx.restore();
    }
  }

  private renderGrenades(engine: GameEngine) {
    const ctx = this.ctx;
    for (const g of engine.grenades) {
      ctx.save();
      ctx.translate(g.x, g.y);

      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      const blink = Math.floor(g.timer * 8) % 2 === 0;
      if (blink) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // --- PAINTERLY UNDEAD ZOMBIES & HELLHOUNDS (Disco Elysium brushwork) ---
  private renderZombies(engine: GameEngine) {
    const ctx = this.ctx;
    for (const z of engine.zombies) {
      ctx.save();
      ctx.translate(z.x, z.y);

      // Hit flash
      const isFlashing = z.hitFlashTimer > 0;
      ctx.rotate(z.angle);

      if (z.type === 'hellhound') {
        // Fiery demonic hellhound
        ctx.fillStyle = isFlashing ? '#ffffff' : '#7f1d1d';
        ctx.beginPath();
        ctx.ellipse(0, 0, z.radius * 1.1, z.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spectral flames curling from back
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(-8, -4, 4, 0, Math.PI * 2);
        ctx.arc(-8, 4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Glowing predatory red eyes
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(8, -5, 2.5, 0, Math.PI * 2);
        ctx.arc(8, 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (z.type === 'crawler') {
        // Legless Crawler
        ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
        ctx.beginPath();
        ctx.ellipse(0, 0, z.radius * 0.6, z.radius * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        // Claw reaches
        ctx.fillStyle = isFlashing ? '#ffffff' : '#475569';
        ctx.fillRect(2, -z.radius + 1, 16, 4);
        ctx.fillRect(2, z.radius - 5, 16, 4);

        // Decayed head
        ctx.fillStyle = isFlashing ? '#ffffff' : '#3f6212';
        ctx.beginPath();
        ctx.arc(0, 0, z.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Piercing yellow eyes
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(3, -2, 2, 0, Math.PI * 2);
        ctx.arc(3, 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Standard Zombie / Runner (Painterly decaying trench coat and sunken silhouette)
        // Tattered military trenchcoat body
        ctx.fillStyle = isFlashing ? '#f8fafc' : '#292524';
        ctx.beginPath();
        ctx.ellipse(-2, 0, z.radius * 0.85, z.radius * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();

        // Coat folds and torn shoulder seams
        ctx.strokeStyle = isFlashing ? '#ffffff' : '#1c1917';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-z.radius * 0.5, -z.radius * 0.6);
        ctx.lineTo(z.radius * 0.2, 0);
        ctx.lineTo(-z.radius * 0.5, z.radius * 0.6);
        ctx.stroke();

        // Reaching rotten arms with blood-stained hands
        const armReach = z.isAttacking || z.isClimbing ? 20 : 15;
        ctx.fillStyle = isFlashing ? '#ffffff' : '#44403c';
        ctx.fillRect(4, -z.radius + 2, armReach, 5);
        ctx.fillRect(4, z.radius - 7, armReach, 5);

        // Claw tips (bloodied)
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(4 + armReach - 3, -z.radius + 2, 3, 5);
        ctx.fillRect(4 + armReach - 3, z.radius - 7, 3, 5);

        // Putrid rotting head
        ctx.fillStyle = isFlashing ? '#ffffff' : '#365314';
        ctx.beginPath();
        ctx.arc(1, 0, z.radius * 0.58, 0, Math.PI * 2);
        ctx.fill();

        // Sunken eye sockets with eerie yellow incandescence (Disco Elysium haunted gaze)
        ctx.fillStyle = '#0c0a09';
        ctx.fillRect(4, -4, 4, 3);
        ctx.fillRect(4, 2, 4, 3);

        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 7;
        ctx.beginPath();
        ctx.arc(5.5, -2.5, 2, 0, Math.PI * 2);
        ctx.arc(5.5, 3.5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      // Mini Health Bar overhead if damaged
      if (z.health < z.maxHealth) {
        ctx.save();
        ctx.translate(z.x, z.y - z.radius - 10);
        const barW = 28;
        const barH = 3.5;
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-barW / 2, 0, barW, barH);

        const hpPercent = Math.max(0, z.health / z.maxHealth);
        ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(-barW / 2, 0, barW * hpPercent, barH);
        ctx.restore();
      }
    }
  }

  // --- PAINTERLY PLAYER RENDERING (Disco Elysium Survivor Look) ---
  private renderPlayer(engine: GameEngine) {
    const ctx = this.ctx;
    const p = engine.player;
    const currentWeapon = p.weapons[p.currentWeaponIndex];

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    // Tactical Laser Sight
    const isPack = currentWeapon?.def.isPackAPunched;
    const isSacred = currentWeapon?.def.altarAffinity === 'sacred';
    const isCursed = currentWeapon?.def.altarAffinity === 'cursed';

    const laserColor = isSacred ? 'rgba(56, 189, 248, 0.65)' : isCursed ? 'rgba(239, 68, 68, 0.65)' : isPack ? 'rgba(56, 189, 248, 0.5)' : 'rgba(239, 68, 68, 0.45)';
    ctx.strokeStyle = laserColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(280, 0);
    ctx.stroke();

    // Laser dot at end
    ctx.fillStyle = isSacred ? '#38bdf8' : isCursed ? '#ef4444' : isPack ? '#38bdf8' : '#ef4444';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(280, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Trench coat silhouette (Disco Elysium inspired detective/soldier coat)
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.ellipse(-3, 0, p.radius * 0.8, p.radius * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tactical armor vest (midnight blue / slate)
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(-8, -12, 16, 24);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -12, 16, 24);

    // Combat Helmet / Fedora lapels
    ctx.fillStyle = '#44403c';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Weapon & tactical arms
    if (currentWeapon) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, -9, 13, 4.5);
      ctx.fillRect(4, 5, 13, 4.5);

      // Gloves
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(15, -10, 5, 5);
      ctx.fillRect(15, 5, 5, 5);

      // Weapon receiver
      ctx.fillStyle = currentWeapon.def.color;
      ctx.fillRect(8, -3.5, 26, 7);

      if (isPack) {
        ctx.shadowColor = isSacred ? '#38bdf8' : isCursed ? '#ef4444' : '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = isSacred ? '#7dd3fc' : isCursed ? '#f87171' : '#7dd3fc';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, -3.5, 26, 7);
        ctx.shadowBlur = 0;
      }
    }

    // Knife slash
    if (p.isKnifing) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 42, -Math.PI / 3.5, Math.PI / 3.5);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderRemotePlayers(remotePlayers: RemotePlayer[]) {
    const ctx = this.ctx;

    for (const rp of remotePlayers) {
      ctx.save();
      ctx.translate(rp.x, rp.y);

      // Overhead name tag
      ctx.save();
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(rp.name, 0, -26);

      if (rp.isDowned) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('¡CAÍDO! [F] REVIVIR', 0, -38);
      }

      // Mini Health Bar
      const barW = 32;
      const barH = 3.5;
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-barW / 2, -20, barW, barH);
      const hpPercent = Math.max(0, rp.health / rp.maxHealth);
      ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(-barW / 2, -20, barW * hpPercent, barH);
      ctx.restore();

      ctx.rotate(rp.angle);

      // Torso
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tactical Squad Vest
      ctx.fillStyle = '#059669';
      ctx.fillRect(-8, -12, 16, 24);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-8, -12, 16, 24);

      // Helmet
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Weapon
      ctx.fillStyle = rp.isPackAPunched ? '#38bdf8' : '#e2e8f0';
      ctx.fillRect(8, -3.5, 24, 7);

      ctx.restore();
    }
  }

  private renderBullets(engine: GameEngine) {
    const ctx = this.ctx;
    for (const b of engine.bullets) {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderParticles(engine: GameEngine) {
    const ctx = this.ctx;
    for (const p of engine.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // --- WEATHERED CONCRETE WALLS (Industrial Grime, Bevel & Seams) ---
  private renderWalls(engine: GameEngine) {
    const ctx = this.ctx;
    for (const w of engine.map.walls) {
      if (!w.isSolid) continue;

      // Base weathered bunker wall face
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(w.x, w.y, w.w, w.h);

      // Concrete top edge cap (light highlight)
      ctx.fillStyle = '#44403c';
      ctx.fillRect(w.x, w.y, w.w, 4);

      // Subtle concrete texture stripes
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    }
  }

  // --- ATMOSPHERIC LIGHTING, NEON SIGN & FLASHLIGHT (Disco Elysium Ambiance) ---
  private renderLighting(engine: GameEngine, camX: number, camY: number) {
    const ctx = this.ctx;
    const p = engine.player;
    const powerOn = engine.map.powerSwitch.isOn;

    ctx.save();

    // 1. NEON SIGN ON NORTH COURTYARD WALL (Disco Elysium "Whirling-in-Rags" homage)
    // Located at northern courtyard wall (x: 480..850, y: 100)
    ctx.save();
    const neonPulse = 0.85 + Math.sin(Date.now() / 200) * 0.15;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 24 * neonPulse;

    // Glowing neon letters
    ctx.font = 'bold 18px "Creepster", cursive';
    ctx.fillStyle = `rgba(239, 68, 68, ${0.9 * neonPulse})`;
    ctx.textAlign = 'center';
    ctx.fillText('WHIRLING-115 // BÚNKER DE CONTENCIÓN', 680, 88);

    // Warm red neon light spill wash onto the wet courtyard pavement
    const neonWash = ctx.createRadialGradient(680, 110, 20, 680, 180, 260);
    neonWash.addColorStop(0, `rgba(239, 68, 68, ${0.2 * neonPulse})`);
    neonWash.addColorStop(0.6, `rgba(220, 38, 38, ${0.08 * neonPulse})`);
    neonWash.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = neonWash;
    ctx.fillRect(400, 100, 560, 220);
    ctx.restore();

    // 2. Subtle Moody Ambient Darkness (High contrast, not pitch black)
    const ambientAlpha = powerOn ? 0.08 : 0.22;
    ctx.fillStyle = `rgba(0, 0, 0, ${ambientAlpha})`;
    ctx.fillRect(camX, camY, this.width, this.height);

    // 3. Volumetric Flashlight Beam with Painterly Falloff
    const beamGrad = ctx.createRadialGradient(p.x, p.y, 25, p.x, p.y, 480);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.24)');
    beamGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.09)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, 480, p.angle - 0.45, p.angle + 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private renderFloatingTexts(engine: GameEngine) {
    const ctx = this.ctx;
    for (const ft of engine.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.font = `bold ${Math.round(14 * (ft.scale || 1))}px "Black Ops One", cursive`;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  private renderCrosshair(mouseWorldPos: { x: number; y: number }, camX: number, camY: number) {
    const ctx = this.ctx;
    const sx = mouseWorldPos.x - camX;
    const sy = mouseWorldPos.y - camY;

    ctx.save();
    ctx.strokeStyle = this.hitmarkerTimer > 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;

    // Reticle circle
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Ticks
    const len = 6;
    ctx.beginPath();
    ctx.moveTo(sx - 12 - len, sy);
    ctx.lineTo(sx - 12, sy);
    ctx.moveTo(sx + 12, sy);
    ctx.lineTo(sx + 12 + len, sy);
    ctx.moveTo(sx, sy - 12 - len);
    ctx.lineTo(sx, sy - 12);
    ctx.moveTo(sx, sy + 12);
    ctx.lineTo(sx, sy + 12 + len);
    ctx.stroke();

    // Hitmarker "X"
    if (this.hitmarkerTimer > 0) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      const s = 6;
      ctx.beginPath();
      ctx.moveTo(sx - s, sy - s);
      ctx.lineTo(sx + s, sy + s);
      ctx.moveTo(sx + s, sy - s);
      ctx.lineTo(sx - s, sy + s);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderScreenDamageVignette(engine: GameEngine) {
    const ctx = this.ctx;
    const hp = engine.player.health;
    const maxHp = engine.player.maxHealth;

    if (hp < maxHp) {
      const dmgPercent = 1 - hp / maxHp;
      ctx.save();
      const vignette = ctx.createRadialGradient(
        this.width / 2, this.height / 2, this.width * 0.35,
        this.width / 2, this.height / 2, this.width * 0.75
      );
      vignette.addColorStop(0, 'rgba(185, 28, 28, 0)');
      vignette.addColorStop(1, `rgba(153, 27, 27, ${dmgPercent * 0.65})`);

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }
}
