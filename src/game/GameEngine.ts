import { 
  PlayerState, PlayerWeapon, Zombie, Bullet, Particle, BloodDecal, FloatingText, 
  PowerUpDrop, ActivePowerUp, PlayerStats, GameStatus, WeaponId, PerkType, PowerUpType,
  Barricade, AltarDef, WeaponDef
} from '../types/game';
import { WEAPON_REGISTRY, MYSTERY_BOX_WEAPONS, PERK_REGISTRY } from '../data/weapons';
import { MapData, createBunkerMap, getPlayerZone, BunkerRoom, getNextWaypointToRoom } from './mapData';
import { pathfindingGrid } from './PathfindingGrid';
import { soundEngine } from '../audio/soundEngine';

export class GameEngine {
  public map: MapData;
  public player: PlayerState;
  public stats: PlayerStats;
  public zombies: Zombie[] = [];
  public bullets: Bullet[] = [];
  public particles: Particle[] = [];
  public bloodDecals: BloodDecal[] = [];
  public floatingTexts: FloatingText[] = [];
  public powerUpDrops: PowerUpDrop[] = [];
  public activePowerUps: Map<PowerUpType, ActivePowerUp> = new Map();

  // Round system
  public round: number = 1;
  public zombiesRemainingToSpawn: number = 0;
  public zombiesAlive: number = 0;
  public isRoundIntermission: boolean = false;
  public intermissionTimer: number = 0;
  public isHellhoundRound: boolean = false;
  public roundBannerTimer: number = 4; // shows banner at start

  // Mystery box state
  public boxRolling: boolean = false;
  public boxRollTimer: number = 0;
  public boxReadyWeapon: WeaponId | null = null;
  public boxIsTeddy: boolean = false;
  public boxClaimTimer: number = 0;

  // Grenades
  public grenades: { x: number; y: number; vx: number; vy: number; timer: number }[] = [];
  public grenadeCount: number = 2;
  public grenadeCooldown: number = 0;

  // Game Status
  public status: GameStatus = 'start';
  public lastTimestamp: number = 0;
  public promptText: string | null = null;

  // Screen shake
  public screenShake: number = 0;
  public hasNewHit: boolean = false;
  public spawnCooldown: number = 0;

  // Multiplayer Event Hooks
  public onWorldAction?: (action: string, data?: any) => void;
  public onBulletFired?: (bullet: Bullet) => void;

  constructor() {
    this.map = createBunkerMap();
    this.stats = {
      score: 0,
      kills: 0,
      headshots: 0,
      downs: 0,
      revivesLeft: 3,
      roundsSurvived: 0,
      bulletsFired: 0,
      bulletsHit: 0
    };

    const startPistol: PlayerWeapon = {
      def: { ...WEAPON_REGISTRY['m1911'] },
      currentMag: 8,
      reserveAmmo: 32,
      isReloading: false,
      reloadProgress: 0,
      lastFiredTime: 0
    };

    this.player = {
      x: this.map.playerSpawn.x,
      y: this.map.playerSpawn.y,
      angle: 0,
      health: 100,
      maxHealth: 100,
      speed: 210,
      stamina: 100,
      maxStamina: 100,
      isSprinting: false,
      radius: 18,
      points: 500,
      weapons: [startPistol],
      currentWeaponIndex: 0,
      perks: [],
      isKnifing: false,
      knifeTimer: 0,
      regenCooldown: 0,
      lastDamageTime: 0
    };

    pathfindingGrid.init(this.map.walls);
    this.startRound(1);
  }

  public resetGame() {
    this.map = createBunkerMap();
    pathfindingGrid.init(this.map.walls);
    this.stats = {
      score: 0,
      kills: 0,
      headshots: 0,
      downs: 0,
      revivesLeft: 3,
      roundsSurvived: 0,
      bulletsFired: 0,
      bulletsHit: 0
    };

    const startPistol: PlayerWeapon = {
      def: { ...WEAPON_REGISTRY['m1911'] },
      currentMag: 8,
      reserveAmmo: 32,
      isReloading: false,
      reloadProgress: 0,
      lastFiredTime: 0
    };

    this.player = {
      x: this.map.playerSpawn.x,
      y: this.map.playerSpawn.y,
      angle: 0,
      health: 100,
      maxHealth: 100,
      speed: 210,
      stamina: 100,
      maxStamina: 100,
      isSprinting: false,
      radius: 18,
      points: 500,
      weapons: [startPistol],
      currentWeaponIndex: 0,
      perks: [],
      isKnifing: false,
      knifeTimer: 0,
      regenCooldown: 0,
      lastDamageTime: 0
    };

    this.zombies = [];
    this.bullets = [];
    this.particles = [];
    this.bloodDecals = [];
    this.floatingTexts = [];
    this.powerUpDrops = [];
    this.activePowerUps.clear();
    this.grenades = [];
    this.grenadeCount = 2;
    this.boxRolling = false;
    this.boxReadyWeapon = null;
    this.status = 'playing';
    this.startRound(1);
  }

  public startRound(roundNum: number) {
    this.round = roundNum;
    this.stats.roundsSurvived = Math.max(this.stats.roundsSurvived, roundNum - 1);
    this.isRoundIntermission = false;
    this.isHellhoundRound = roundNum >= 5 && roundNum % 5 === 0;
    this.roundBannerTimer = 4.5;
    this.grenadeCount = Math.min(4, this.grenadeCount + 2);
    this.spawnCooldown = 1.0;

    // Authentic COD zombies count per round with clear caps:
    if (this.isHellhoundRound) {
      this.zombiesRemainingToSpawn = Math.min(8 + Math.floor(roundNum * 1.5), 24);
    } else if (roundNum === 1) {
      this.zombiesRemainingToSpawn = 6;
    } else if (roundNum === 2) {
      this.zombiesRemainingToSpawn = 8;
    } else if (roundNum === 3) {
      this.zombiesRemainingToSpawn = 12;
    } else if (roundNum === 4) {
      this.zombiesRemainingToSpawn = 16;
    } else {
      this.zombiesRemainingToSpawn = Math.min(18 + (roundNum - 4) * 4, 70);
    }

    soundEngine.playRoundStart();
  }

  public update(dt: number, input: {
    moveX: number;
    moveY: number;
    aimX: number;
    aimY: number;
    shoot: boolean;
    sprint: boolean;
    interact: boolean;
    reload: boolean;
    knife: boolean;
    switchWeapon: boolean;
    throwGrenade: boolean;
  }) {
    if (this.status !== 'playing') return;

    // Apply dt limits to prevent huge jump on tab switch
    const clampedDt = Math.min(dt, 0.1);

    // 1. Player Aiming
    this.player.angle = Math.atan2(input.aimY - this.player.y, input.aimX - this.player.x);

    // 2. Sprinting & Stamina
    const hasStaminUp = this.player.perks.includes('stamin_up');
    const isMoving = Math.abs(input.moveX) > 0.05 || Math.abs(input.moveY) > 0.05;
    
    if (input.sprint && isMoving && (hasStaminUp || this.player.stamina > 5)) {
      this.player.isSprinting = true;
      if (!hasStaminUp) {
        this.player.stamina = Math.max(0, this.player.stamina - clampedDt * 25);
      }
    } else {
      this.player.isSprinting = false;
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + clampedDt * 30);
    }

    // Base Speed calculation
    let currentSpeed = 210;
    if (hasStaminUp) currentSpeed *= 1.25;
    if (this.player.isSprinting) currentSpeed *= 1.45;

    // 3. Movement with wall collision
    if (isMoving) {
      const len = Math.hypot(input.moveX, input.moveY) || 1;
      const dx = (input.moveX / len) * currentSpeed * clampedDt;
      const dy = (input.moveY / len) * currentSpeed * clampedDt;

      // Try X move
      if (!this.checkPlayerCollision(this.player.x + dx, this.player.y)) {
        this.player.x += dx;
      }
      // Try Y move
      if (!this.checkPlayerCollision(this.player.x, this.player.y + dy)) {
        this.player.y += dy;
      }
    }

    // 4. Health Regen
    this.updateHealthRegen(clampedDt);

    // 5. Knife attack
    if (input.knife && !this.player.isKnifing) {
      this.executeKnife();
    }
    if (this.player.isKnifing) {
      this.player.knifeTimer -= clampedDt;
      if (this.player.knifeTimer <= 0) {
        this.player.isKnifing = false;
      }
    }

    // 6. Weapon Management (Switching, Reloading, Shooting)
    this.updateWeapons(clampedDt, input);

    // 7. Grenades
    if (this.grenadeCooldown > 0) this.grenadeCooldown -= clampedDt;
    if (input.throwGrenade && this.grenadeCount > 0 && this.grenadeCooldown <= 0) {
      this.grenadeCooldown = 0.8;
      this.throwGrenade();
    }
    this.updateGrenades(clampedDt);

    // 8. Navmesh Pathfinding Grid & Zombie AI
    pathfindingGrid.updateDynamicObstacles(this.map.doors, this.map.barricades);
    pathfindingGrid.updatePlayerFlowField(this.player.x, this.player.y);
    this.updateZombies(clampedDt);

    // 9. Bullets Physics & Hits
    this.updateBullets(clampedDt);

    // 10. Mystery Box & Pack-a-Punch update
    this.updateInteractables(clampedDt);

    // 11. Interactions (Doors, Wall buys, Perks, Box, Barricades)
    this.handleInteraction(input.interact, clampedDt);

    // 12. Power-Ups logic
    this.updatePowerUps(clampedDt);

    // 13. Particles & Decals
    this.updateParticles(clampedDt);

    // 14. Floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= clampedDt * 25;
      ft.life -= clampedDt;
      ft.alpha = Math.max(0, ft.life / 1.0);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 15. Screen Shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - clampedDt * 18);
    }

    // 16. Round banner timer
    if (this.roundBannerTimer > 0) {
      this.roundBannerTimer -= clampedDt;
    }

    // 17. Electric trap timer
    if (this.map.electricTrap.isActive) {
      this.map.electricTrap.activeTime -= clampedDt;
      if (this.map.electricTrap.activeTime <= 0) {
        this.map.electricTrap.isActive = false;
      }
      // Zap nearby zombies
      const trap = this.map.electricTrap;
      for (const z of this.zombies) {
        if (z.x >= trap.x - 20 && z.x <= trap.x + trap.w + 20 &&
            z.y >= trap.y - 20 && z.y <= trap.y + trap.h + 20) {
          this.killZombie(z, false, false);
          this.createElectricSparks(z.x, z.y);
        }
      }
    }

    // Check game over
    if (this.player.health <= 0) {
      this.handlePlayerDown();
    }
  }

  private checkPlayerCollision(newX: number, newY: number): boolean {
    const r = this.player.radius;

    // Check solid walls
    for (const w of this.map.walls) {
      if (w.isSolid) {
        if (newX + r > w.x && newX - r < w.x + w.w &&
            newY + r > w.y && newY - r < w.y + w.h) {
          return true;
        }
      }
    }

    // Check closed doors
    for (const d of this.map.doors) {
      if (!d.isOpen) {
        if (newX + r > d.x && newX - r < d.x + d.w &&
            newY + r > d.y && newY - r < d.y + d.h) {
          return true;
        }
      }
    }

    // Check barricades (player can't walk through intact windows)
    for (const b of this.map.barricades) {
      if (b.planks > 0) {
        if (newX + r > b.x && newX - r < b.x + b.w &&
            newY + r > b.y && newY - r < b.y + b.h) {
          return true;
        }
      }
    }

    // Map bounds
    if (newX - r < 120 || newX + r > 1880 || newY - r < 120 || newY + r > 1580) {
      return true;
    }

    return false;
  }

  private updateHealthRegen(dt: number) {
    const hasQuickRevive = this.player.perks.includes('quick_revive');
    const hasCursedWeapon = this.player.weapons.some(w => w.def.altarAffinity === 'cursed');
    let regenDelay = hasQuickRevive ? 2.5 : 4.0;
    if (hasCursedWeapon) regenDelay += 2.5; // Cursed Altar blood covenant delay
    const regenSpeed = hasQuickRevive ? 65 : 40;

    if (Date.now() - this.player.lastDamageTime > regenDelay * 1000) {
      if (this.player.health < this.player.maxHealth) {
        this.player.health = Math.min(this.player.maxHealth, this.player.health + regenSpeed * dt);
      }
    }

    soundEngine.updateHeartbeat(this.player.health <= 40);
  }

  private executeKnife() {
    this.player.isKnifing = true;
    this.player.knifeTimer = 0.35;
    soundEngine.playKnife();

    // Damage zombie in front
    const reach = 55;
    const knifeDamage = this.activePowerUps.has('insta_kill') ? 99999 : 150;

    for (const z of this.zombies) {
      const dist = Math.hypot(z.x - this.player.x, z.y - this.player.y);
      if (dist <= reach) {
        const angleToZombie = Math.atan2(z.y - this.player.y, z.x - this.player.x);
        let diff = Math.abs(angleToZombie - this.player.angle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        if (diff < Math.PI / 2.5) {
          this.damageZombie(z, knifeDamage, false, true);
          soundEngine.playZombieHit(true);
          this.createBloodSplatter(z.x, z.y, 8);
          break; // One knife slash per attack
        }
      }
    }
  }

  private updateWeapons(dt: number, input: {
    shoot: boolean;
    reload: boolean;
    switchWeapon: boolean;
  }) {
    const currentWeapon = this.player.weapons[this.player.currentWeaponIndex];
    if (!currentWeapon) return;

    // Switch weapon (cancels reload if active)
    if (input.switchWeapon && this.player.weapons.length > 1) {
      if (currentWeapon.isReloading) {
        currentWeapon.isReloading = false;
        currentWeapon.reloadProgress = 0;
      }
      this.player.currentWeaponIndex = (this.player.currentWeaponIndex + 1) % this.player.weapons.length;
      return;
    }

    const hasSpeedCola = this.player.perks.includes('speed_cola');
    const hasDoubleTap = this.player.perks.includes('double_tap');

    // Reloading logic
    if (input.reload && !currentWeapon.isReloading && currentWeapon.currentMag < currentWeapon.def.magazineSize && currentWeapon.reserveAmmo > 0) {
      currentWeapon.isReloading = true;
      currentWeapon.reloadProgress = 0;
      soundEngine.playReload();
    }

    if (currentWeapon.isReloading) {
      const effectiveReloadTime = hasSpeedCola ? currentWeapon.def.reloadTime * 0.5 : currentWeapon.def.reloadTime;
      currentWeapon.reloadProgress += dt / effectiveReloadTime;

      if (currentWeapon.reloadProgress >= 1) {
        currentWeapon.isReloading = false;
        const needed = currentWeapon.def.magazineSize - currentWeapon.currentMag;
        const available = Math.min(needed, currentWeapon.reserveAmmo);
        currentWeapon.currentMag += available;
        currentWeapon.reserveAmmo -= available;
      }
      return;
    }

    // Auto-reload on empty clip
    if (currentWeapon.currentMag === 0 && currentWeapon.reserveAmmo > 0 && !currentWeapon.isReloading) {
      currentWeapon.isReloading = true;
      currentWeapon.reloadProgress = 0;
      soundEngine.playReload();
      return;
    }

    // Firing logic
    if (input.shoot && currentWeapon.currentMag > 0) {
      const now = performance.now();
      const fireInterval = (1000 / currentWeapon.def.fireRate) * (hasDoubleTap ? 0.75 : 1.0);

      if (now - currentWeapon.lastFiredTime >= fireInterval) {
        currentWeapon.lastFiredTime = now;
        currentWeapon.currentMag--;
        this.stats.bulletsFired++;

        soundEngine.playGunshot(currentWeapon.def.type, currentWeapon.def.isPackAPunched);

        // Screen recoil
        this.screenShake = Math.min(8, this.screenShake + (currentWeapon.def.type === 'shotgun' ? 3 : 1.2));

        // Fire bullets/pellets
        const pelletCount = currentWeapon.def.pellets || 1;
        const baseAngle = this.player.angle;

        for (let p = 0; p < pelletCount; p++) {
          const spreadRad = ((Math.random() - 0.5) * currentWeapon.def.spread * Math.PI) / 180;
          const shotAngle = baseAngle + spreadRad;
          const vx = Math.cos(shotAngle) * currentWeapon.def.bulletSpeed;
          const vy = Math.sin(shotAngle) * currentWeapon.def.bulletSpeed;

          // Muzzle position
          const muzzleDist = 26;
          const bx = this.player.x + Math.cos(baseAngle) * muzzleDist;
          const by = this.player.y + Math.sin(baseAngle) * muzzleDist;

          let damage = currentWeapon.def.damage;
          if (hasDoubleTap) damage *= 1.4;

          const bulletObj: Bullet = {
            id: Math.random().toString(),
            x: bx,
            y: by,
            vx,
            vy,
            damage,
            penetrationLeft: currentWeapon.def.penetration,
            color: currentWeapon.def.bulletColor,
            radius: currentWeapon.def.bulletRadius,
            distanceTraveled: 0,
            maxDistance: currentWeapon.def.type === 'shotgun' ? 450 : 1200,
            isExplosive: currentWeapon.def.explosive,
            explosionRadius: currentWeapon.def.explosionRadius,
            explosionDamage: currentWeapon.def.explosionDamage,
            fromPlayer: true
          };

          this.bullets.push(bulletObj);
          if (this.onBulletFired) this.onBulletFired(bulletObj);

          // Bullet casing particle
          this.particles.push({
            x: bx,
            y: by,
            vx: Math.cos(baseAngle - Math.PI / 2) * (50 + Math.random() * 30),
            vy: Math.sin(baseAngle - Math.PI / 2) * (50 + Math.random() * 30),
            size: 2,
            color: '#facc15',
            alpha: 1,
            life: 0.6,
            maxLife: 0.6,
            type: 'shell'
          });
        }

        // Muzzle flash particle
        this.particles.push({
          x: this.player.x + Math.cos(baseAngle) * 32,
          y: this.player.y + Math.sin(baseAngle) * 32,
          vx: 0,
          vy: 0,
          size: currentWeapon.def.type === 'wonder' ? 14 : 9,
          color: currentWeapon.def.bulletColor,
          alpha: 0.9,
          life: 0.05,
          maxLife: 0.05,
          type: 'spark'
        });
      }
    }
  }

  private throwGrenade() {
    this.grenadeCount--;
    const speed = 400;
    this.grenades.push({
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(this.player.angle) * speed,
      vy: Math.sin(this.player.angle) * speed,
      timer: 1.8 // explodes in 1.8s
    });
  }

  private updateGrenades(dt: number) {
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vx *= 0.92;
      g.vy *= 0.92;
      g.timer -= dt;

      // Bounce off walls
      for (const w of this.map.walls) {
        if (g.x > w.x && g.x < w.x + w.w && g.y > w.y && g.y < w.y + w.h) {
          g.vx *= -0.7;
          g.vy *= -0.7;
        }
      }

      if (g.timer <= 0) {
        this.grenades.splice(i, 1);
        this.explodeGrenade(g.x, g.y);
      }
    }
  }

  private explodeGrenade(gx: number, gy: number) {
    soundEngine.playNuke();
    this.screenShake = 12;

    // Explosive particles
    for (let p = 0; p < 25; p++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 180;
      this.particles.push({
        x: gx,
        y: gy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 5 + Math.random() * 8,
        color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
        alpha: 1,
        life: 0.7,
        maxLife: 0.7,
        type: 'fire'
      });
    }

    const blastRadius = 140;
    const blastDmg = 800;

    for (const z of this.zombies) {
      const dist = Math.hypot(z.x - gx, z.y - gy);
      if (dist <= blastRadius) {
        const falloff = 1 - dist / blastRadius;
        const dmg = blastDmg * falloff;
        this.damageZombie(z, dmg, false, false);
      }
    }
  }

  private updateZombies(dt: number) {
    // Dynamic concurrent active zombie cap based on round
    // (Limits simultaneous zombies on map to prevent flooding)
    const maxConcurrentZombies = this.round <= 2 ? 6 : this.round <= 4 ? 10 : this.round <= 7 ? 16 : 24;

    // Paced Spawner: stream zombies in rhythmically
    this.spawnCooldown -= dt;
    if (this.zombiesRemainingToSpawn > 0 && this.zombies.length < maxConcurrentZombies && this.spawnCooldown <= 0) {
      this.spawnZombie();
      const pacing = Math.max(0.7, 2.5 - this.round * 0.15);
      this.spawnCooldown = pacing;
    }

    // Check round complete
    if (this.zombiesRemainingToSpawn === 0 && this.zombies.length === 0 && !this.isRoundIntermission) {
      this.isRoundIntermission = true;
      this.intermissionTimer = 5.0; // 5s break between rounds
    }

    if (this.isRoundIntermission) {
      this.intermissionTimer -= dt;
      if (this.intermissionTimer <= 0) {
        this.startRound(this.round + 1);
      }
    }

    // --- Anti-stacking flocking separation between zombies ---
    for (let i = 0; i < this.zombies.length; i++) {
      const z1 = this.zombies[i];
      for (let j = i + 1; j < this.zombies.length; j++) {
        const z2 = this.zombies[j];
        const dist = Math.hypot(z1.x - z2.x, z1.y - z2.y);
        const minDist = z1.radius + z2.radius + 3;
        if (dist > 0 && dist < minDist) {
          const overlap = (minDist - dist) * 0.45;
          const nx = (z1.x - z2.x) / dist;
          const ny = (z1.y - z2.y) / dist;
          z1.x += nx * overlap;
          z1.y += ny * overlap;
          z2.x -= nx * overlap;
          z2.y -= ny * overlap;
        }
      }
    }

    // Update alive zombies
    const playerRoom = getPlayerZone(this.player.x, this.player.y);

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      if (z.hitFlashTimer > 0) z.hitFlashTimer -= dt;
      if (z.attackCooldown > 0) z.attackCooldown -= dt;

      // Stumble slowdown when shot
      let currentZombieSpeed = z.speed;
      if (z.stumbleTimer && z.stumbleTimer > 0) {
        z.stumbleTimer -= dt;
        currentZombieSpeed *= 0.45;
      }

      // 1. Vaulting/Climbing through window transition:
      if (z.isClimbing) {
        z.climbTimer = (z.climbTimer || 0) - dt;
        const b = this.map.barricades.find(item => item.id === z.targetBarricadeId);
        if (b) {
          // Push zombie gradually into the room
          const step = dt * 65;
          if (b.facing === 'left') z.x += step;
          else if (b.facing === 'right') z.x -= step;
          else if (b.facing === 'top') z.y += step;
          else if (b.facing === 'bottom') z.y -= step;
        }
        if (z.climbTimer <= 0) {
          z.isClimbing = false;
          z.targetBarricadeId = null; // Free inside room!
          soundEngine.playZombieGrowl();
        }
        continue;
      }

      // 2. If zombie is outside targeting a window barricade:
      if (z.targetBarricadeId) {
        const b = this.map.barricades.find(item => item.id === z.targetBarricadeId);
        if (b) {
          const bcx = b.x + b.w / 2;
          const bcy = b.y + b.h / 2;
          const distToWindow = Math.hypot(bcx - z.x, bcy - z.y);

          // Face the window
          z.angle = Math.atan2(bcy - z.y, bcx - z.x);

          if (distToWindow > 16) {
            // Walk straight toward the window
            z.isAttacking = false;
            z.x += Math.cos(z.angle) * currentZombieSpeed * dt;
            z.y += Math.sin(z.angle) * currentZombieSpeed * dt;
          } else {
            // At the window!
            if (b.planks > 0) {
              // Claw at the wooden planks
              z.isAttacking = true;
              if (z.attackCooldown <= 0) {
                z.attackCooldown = 0.9;
                b.planks = Math.max(0, b.planks - 1);
                soundEngine.playZombieAttack();
                this.createWoodDebris(bcx, bcy);
              }
            } else {
              // Planks destroyed! Start vaulting/climbing into the room
              z.isAttacking = false;
              z.isClimbing = true;
              z.climbTimer = 0.6; // Vault over window
            }
          }
          continue;
        } else {
          z.targetBarricadeId = null;
        }
      }

      // 3. Zombie is inside the bunker chasing the player:
      const distToPlayer = Math.hypot(this.player.x - z.x, this.player.y - z.y);

      // Attack player if in melee reach
      if (distToPlayer < this.player.radius + z.radius + 6) {
        z.isAttacking = true;
        if (z.attackCooldown <= 0) {
          z.attackCooldown = 1.0;
          this.damagePlayer(z.type === 'hellhound' ? 30 : 45);
          soundEngine.playZombieAttack();
        }
        continue;
      }

      z.isAttacking = false;

      // Intelligent Navmesh Pathfinding & Flocking
      // A) Direct Line of Sight check
      const hasLOS = pathfindingGrid.hasLineOfSight(z.x, z.y, this.player.x, this.player.y);
      let targetDx = 0;
      let targetDy = 0;

      if (hasLOS && distToPlayer < 550) {
        // Direct predatory charge
        targetDx = (this.player.x - z.x) / distToPlayer;
        targetDy = (this.player.y - z.y) / distToPlayer;
      } else {
        // B) Flow-field Navmesh guidance around rooms, doors, corners
        const flow = pathfindingGrid.getFlowVector(z.x, z.y);
        if (flow) {
          targetDx = flow.x;
          targetDy = flow.y;
        } else {
          // Fallback to waypoint or direct heading
          const zombieRoom = getPlayerZone(z.x, z.y);
          let targetX = this.player.x;
          let targetY = this.player.y;
          if (zombieRoom !== playerRoom) {
            const nextWp = getNextWaypointToRoom(zombieRoom, playerRoom, this.map.doors);
            if (nextWp) {
              targetX = nextWp.x;
              targetY = nextWp.y;
            }
          }
          const d = Math.hypot(targetX - z.x, targetY - z.y);
          if (d > 0.1) {
            targetDx = (targetX - z.x) / d;
            targetDy = (targetY - z.y) / d;
          }
        }
      }

      // C) Horde Separation Force (flocking) to prevent single-file stacking
      let sepX = 0;
      let sepY = 0;
      for (let o = 0; o < this.zombies.length; o++) {
        if (o === i) continue;
        const other = this.zombies[o];
        const dx = z.x - other.x;
        const dy = z.y - other.y;
        const distSq = dx * dx + dy * dy;
        const minDist = z.radius * 2.2;
        if (distSq < minDist * minDist && distSq > 0.01) {
          const d = Math.sqrt(distSq);
          const force = (minDist - d) / minDist;
          sepX += (dx / d) * force;
          sepY += (dy / d) * force;
        }
      }

      // Combine movement and separation
      let moveDirX = targetDx + sepX * 0.4;
      let moveDirY = targetDy + sepY * 0.4;
      const moveLen = Math.hypot(moveDirX, moveDirY);
      if (moveLen > 0.01) {
        moveDirX /= moveLen;
        moveDirY /= moveLen;
      }

      const stepDist = currentZombieSpeed * dt;
      const stepX = moveDirX * stepDist;
      const stepY = moveDirY * stepDist;

      // Smooth obstacle avoidance & sliding
      if (!this.isZombiePositionBlocked(z.x + stepX, z.y + stepY, z.radius)) {
        z.x += stepX;
        z.y += stepY;
        z.angle = Math.atan2(moveDirY, moveDirX);
      } else if (!this.isZombiePositionBlocked(z.x + stepX, z.y, z.radius)) {
        z.x += stepX;
        z.angle = Math.atan2(0, stepX);
      } else if (!this.isZombiePositionBlocked(z.x, z.y + stepY, z.radius)) {
        z.y += stepY;
        z.angle = Math.atan2(stepY, 0);
      } else {
        // Resolve pushout from walls
        this.resolveZombieObstaclePushout(z);
      }

      // Random zombie groan
      if (Math.random() < dt * 0.04) {
        soundEngine.playZombieGrowl();
      }
    }
  }

  private isZombiePositionBlocked(x: number, y: number, radius: number): boolean {
    // Map bounds
    if (x - radius < 100 || x + radius > 1890 || y - radius < 100 || y + radius > 1580) {
      return true;
    }

    // Solid walls & pillars
    for (const w of this.map.walls) {
      if (w.isSolid) {
        if (x + radius > w.x && x - radius < w.x + w.w &&
            y + radius > w.y && y - radius < w.y + w.h) {
          return true;
        }
      }
    }

    // Closed doors
    for (const d of this.map.doors) {
      if (!d.isOpen) {
        if (x + radius > d.x && x - radius < d.x + d.w &&
            y + radius > d.y && y - radius < d.y + d.h) {
          return true;
        }
      }
    }

    // Intact window barricades
    for (const b of this.map.barricades) {
      if (b.planks > 0) {
        if (x + radius > b.x && x - radius < b.x + b.w &&
            y + radius > b.y && y - radius < b.y + b.h) {
          return true;
        }
      }
    }

    return false;
  }

  private resolveZombieObstaclePushout(z: Zombie) {
    for (const w of this.map.walls) {
      if (!w.isSolid) continue;
      const closestX = Math.max(w.x, Math.min(z.x, w.x + w.w));
      const closestY = Math.max(w.y, Math.min(z.y, w.y + w.h));
      const distX = z.x - closestX;
      const distY = z.y - closestY;
      const dist = Math.hypot(distX, distY);
      if (dist < z.radius && dist > 0) {
        const push = (z.radius - dist) + 1;
        z.x += (distX / dist) * push;
        z.y += (distY / dist) * push;
      }
    }
  }

  private moveZombieWithAvoidance(z: Zombie, targetX: number, targetY: number, speed: number, dt: number) {
    const baseAngle = Math.atan2(targetY - z.y, targetX - z.x);
    const stepDist = speed * dt;

    // 1. Try direct path first
    const dirX = Math.cos(baseAngle) * stepDist;
    const dirY = Math.sin(baseAngle) * stepDist;

    if (!this.isZombiePositionBlocked(z.x + dirX, z.y + dirY, z.radius)) {
      z.x += dirX;
      z.y += dirY;
      z.angle = baseAngle;
      return;
    }

    // 2. Multi-angle feelers with steering bias to prevent oscillation
    const bias = z.steeringBias || 1;
    const angleOffsets = bias > 0
      ? [0.45, 0.9, 1.35, 1.6, -0.45, -0.9, -1.35, -1.6]
      : [-0.45, -0.9, -1.35, -1.6, 0.45, 0.9, 1.35, 1.6];
    let moved = false;

    for (const offset of angleOffsets) {
      const testAngle = baseAngle + offset;
      const tx = Math.cos(testAngle) * stepDist;
      const ty = Math.sin(testAngle) * stepDist;

      if (!this.isZombiePositionBlocked(z.x + tx, z.y + ty, z.radius)) {
        z.x += tx;
        z.y += ty;
        z.angle = testAngle;
        if (Math.abs(offset) > 0.4) {
          z.steeringBias = Math.sign(offset);
        }
        moved = true;
        break;
      }
    }

    if (!moved) {
      // 3. Single-axis sliding fallback
      if (!this.isZombiePositionBlocked(z.x + dirX, z.y, z.radius)) {
        z.x += dirX;
        z.angle = baseAngle;
      } else if (!this.isZombiePositionBlocked(z.x, z.y + dirY, z.radius)) {
        z.y += dirY;
        z.angle = baseAngle;
      } else {
        // 4. Resolve overlap pushout if trapped
        this.resolveZombieObstaclePushout(z);
      }
    }
  }

  private spawnZombie() {
    this.zombiesRemainingToSpawn--;

    // Dynamic Zone-Based Spawning:
    // 1. Identify player's current room
    const playerRoom = getPlayerZone(this.player.x, this.player.y);

    // 2. Identify all connected rooms (player room + opened adjacent rooms)
    const activeRooms = new Set<BunkerRoom>([playerRoom]);
    for (const d of this.map.doors) {
      if (d.isOpen) {
        if (d.roomA === playerRoom) activeRooms.add(d.roomB as BunkerRoom);
        if (d.roomB === playerRoom) activeRooms.add(d.roomA as BunkerRoom);
      }
    }

    // 3. Select barricade: 75% in player's immediate room, 25% in connected open rooms
    let candidateBarricades = this.map.barricades.filter(b => b.roomId === playerRoom);
    if (candidateBarricades.length === 0 || Math.random() > 0.75) {
      const connectedBarricades = this.map.barricades.filter(b => activeRooms.has(b.roomId));
      if (connectedBarricades.length > 0) {
        candidateBarricades = connectedBarricades;
      }
    }

    const b = candidateBarricades[Math.floor(Math.random() * candidateBarricades.length)] || this.map.barricades[0];
    const spawnX = b.spawnPoint.x;
    const spawnY = b.spawnPoint.y;

    const isHellhound = this.isHellhoundRound;
    const baseHealth = isHellhound 
      ? 110 + this.round * 20
      : 90 * Math.pow(1.08, this.round - 1);

    // Speed scaling
    let speed = 60 + Math.random() * 20; // walker
    let type: 'walker' | 'runner' | 'crawler' | 'hellhound' = 'walker';

    if (isHellhound) {
      type = 'hellhound';
      speed = 175 + Math.random() * 25; // fast
    } else if (this.round >= 4 && Math.random() > 0.4) {
      type = 'runner';
      speed = 125 + Math.random() * 30;
    } else if (this.round >= 2 && Math.random() > 0.6) {
      type = 'runner';
      speed = 100 + Math.random() * 20;
    }

    this.zombies.push({
      id: Math.random().toString(),
      x: spawnX,
      y: spawnY,
      radius: isHellhound ? 14 : 17,
      health: baseHealth,
      maxHealth: baseHealth,
      speed,
      angle: 0,
      type,
      isAttacking: false,
      attackCooldown: 0,
      targetBarricadeId: b.id, // Zombie must breach this window!
      hitFlashTimer: 0,
      steeringBias: Math.random() > 0.5 ? 1 : -1
    });
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const dist = Math.hypot(b.vx, b.vy) * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.distanceTraveled += dist;

      // Check max range
      if (b.distanceTraveled >= b.maxDistance) {
        if (b.isExplosive) {
          this.triggerBulletExplosion(b.x, b.y, b.explosionRadius || 50, b.explosionDamage || 250);
        }
        this.bullets.splice(i, 1);
        continue;
      }

      // Check wall collision
      let hitWall = false;
      for (const w of this.map.walls) {
        if (w.isSolid && b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) {
          hitWall = true;
          this.createSpark(b.x, b.y);
          break;
        }
      }
      if (hitWall) {
        if (b.isExplosive) {
          this.triggerBulletExplosion(b.x, b.y, b.explosionRadius || 50, b.explosionDamage || 250);
        }
        this.bullets.splice(i, 1);
        continue;
      }

      // Check zombie collision
      for (let zIdx = this.zombies.length - 1; zIdx >= 0; zIdx--) {
        const z = this.zombies[zIdx];
        const hitDist = Math.hypot(z.x - b.x, z.y - b.y);

        if (hitDist <= z.radius + b.radius) {
          this.stats.bulletsHit++;
          // Headshot check (if bullet is hitting top portion relative to zombie angle)
          const isInstaKill = this.activePowerUps.has('insta_kill');
          const isHeadshot = Math.random() < 0.35; // Headshot chance on precision

          const damage = isInstaKill ? 99999 : (isHeadshot ? b.damage * 2.2 : b.damage);
          this.damageZombie(z, damage, isHeadshot, false);

          soundEngine.playZombieHit(isHeadshot);
          this.createBloodSplatter(z.x, z.y, isHeadshot ? 12 : 5);

          // Sacred Altar lifesteal & Cursed Altar flame
          const activeWeapon = this.player.weapons[this.player.currentWeaponIndex];
          if (b.fromPlayer && activeWeapon) {
            if (activeWeapon.def.altarAffinity === 'sacred') {
              this.player.health = Math.min(this.player.maxHealth, this.player.health + 4);
              this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50,
                size: 3.5,
                color: '#38bdf8',
                alpha: 1,
                life: 0.3,
                maxLife: 0.3,
                type: 'spark'
              });
            } else if (activeWeapon.def.altarAffinity === 'cursed') {
              for (let fp = 0; fp < 3; fp++) {
                this.particles.push({
                  x: z.x,
                  y: z.y,
                  vx: (Math.random() - 0.5) * 70,
                  vy: (Math.random() - 0.5) * 70,
                  size: 4,
                  color: Math.random() > 0.5 ? '#ef4444' : '#a855f7',
                  alpha: 1,
                  life: 0.4,
                  maxLife: 0.4,
                  type: 'fire'
                });
              }
            }
          }

          if (b.isExplosive) {
            this.triggerBulletExplosion(b.x, b.y, b.explosionRadius || 55, b.explosionDamage || 300);
          }

          b.penetrationLeft--;
          if (b.penetrationLeft <= 0) {
            this.bullets.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  private triggerBulletExplosion(x: number, y: number, radius: number, damage: number) {
    soundEngine.playNuke();
    this.screenShake = 6;
    for (let p = 0; p < 12; p++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 4 + Math.random() * 5,
        color: '#f97316',
        alpha: 1,
        life: 0.4,
        maxLife: 0.4,
        type: 'fire'
      });
    }

    for (const z of this.zombies) {
      const dist = Math.hypot(z.x - x, z.y - y);
      if (dist <= radius) {
        this.damageZombie(z, damage * (1 - dist / radius), false, false);
      }
    }
  }

  public damageZombie(z: Zombie, amount: number, isHeadshot: boolean, isKnife: boolean) {
    z.health -= amount;
    z.hitFlashTimer = 0.08;
    z.stumbleTimer = 0.16; // Hit stumble slowdown
    this.hasNewHit = true;

    // Crawler chance on heavy explosive/shotgun blast
    if (amount >= 140 && z.health > 0 && z.type === 'walker' && Math.random() < 0.3) {
      z.type = 'crawler';
      z.speed = 38;
      z.limbLost = true;
    }

    // Points on hit
    const doublePoints = this.activePowerUps.has('double_points');
    const pointsMultiplier = doublePoints ? 2 : 1;

    const hitPoints = 10 * pointsMultiplier;
    this.player.points += hitPoints;
    this.stats.score += hitPoints;

    if (z.health <= 0) {
      this.killZombie(z, isHeadshot, isKnife);
    }
  }

  private killZombie(z: Zombie, isHeadshot: boolean, isKnife: boolean) {
    const idx = this.zombies.indexOf(z);
    if (idx !== -1) {
      this.zombies.splice(idx, 1);
    }

    this.stats.kills++;
    if (isHeadshot) this.stats.headshots++;

    const doublePoints = this.activePowerUps.has('double_points');
    const multiplier = doublePoints ? 2 : 1;

    let killPoints = isKnife ? 130 : (isHeadshot ? 100 : 60);
    killPoints *= multiplier;

    this.player.points += killPoints;
    this.stats.score += killPoints;

    // Floating text indicator
    this.floatingTexts.push({
      id: Math.random().toString(),
      x: z.x,
      y: z.y - 15,
      text: isHeadshot ? `+${killPoints} HEADSHOT!` : `+${killPoints}`,
      color: isHeadshot ? '#ef4444' : '#eab308',
      alpha: 1,
      scale: isHeadshot ? 1.3 : 1.0,
      life: 0.9
    });

    // Blood decal on floor
    this.bloodDecals.push({
      x: z.x,
      y: z.y,
      size: 20 + Math.random() * 15,
      alpha: 0.85,
      rotation: Math.random() * Math.PI * 2
    });
    if (this.bloodDecals.length > 80) {
      this.bloodDecals.shift();
    }

    // Power-up drop chance
    if (z.type === 'hellhound' && this.zombiesRemainingToSpawn === 0 && this.zombies.length === 0) {
      // Guaranteed Max Ammo on final dog!
      this.spawnPowerUp(z.x, z.y, 'max_ammo');
    } else if (Math.random() < 0.035) {
      const types: PowerUpType[] = ['max_ammo', 'insta_kill', 'double_points', 'nuke', 'carpenter', 'fire_sale'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      this.spawnPowerUp(z.x, z.y, chosen);
    }
  }

  private spawnPowerUp(x: number, y: number, type: PowerUpType) {
    this.powerUpDrops.push({
      id: Math.random().toString(),
      type,
      x,
      y,
      duration: 30, // 30 seconds before despawning
      pulse: 0
    });
  }

  private updatePowerUps(dt: number) {
    // Check pickup
    for (let i = this.powerUpDrops.length - 1; i >= 0; i--) {
      const p = this.powerUpDrops[i];
      p.duration -= dt;
      p.pulse += dt * 4;

      const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
      if (dist < this.player.radius + 24) {
        this.activatePowerUp(p.type);
        this.powerUpDrops.splice(i, 1);
        continue;
      }

      if (p.duration <= 0) {
        this.powerUpDrops.splice(i, 1);
      }
    }

    // Update active powerups timer
    for (const [type, active] of this.activePowerUps.entries()) {
      active.timeLeft -= dt;
      if (active.timeLeft <= 0) {
        this.activePowerUps.delete(type);
      }
    }
  }

  public activatePowerUp(type: PowerUpType) {
    soundEngine.playPowerUp();

    switch (type) {
      case 'max_ammo':
        for (const w of this.player.weapons) {
          w.currentMag = w.def.magazineSize;
          w.reserveAmmo = w.def.maxReserveAmmo;
        }
        this.floatingTexts.push({
          id: Math.random().toString(),
          x: this.player.x,
          y: this.player.y - 30,
          text: '¡MUNICIÓN MÁXIMA!',
          color: '#38bdf8',
          alpha: 1,
          scale: 1.5,
          life: 1.8
        });
        break;

      case 'nuke':
        soundEngine.playNuke();
        this.screenShake = 16;
        for (const z of [...this.zombies]) {
          this.killZombie(z, false, false);
        }
        this.player.points += 400;
        this.floatingTexts.push({
          id: Math.random().toString(),
          x: this.player.x,
          y: this.player.y - 30,
          text: '¡BOMBA NUCLEAR! +400',
          color: '#f97316',
          alpha: 1,
          scale: 1.6,
          life: 2.0
        });
        break;

      case 'carpenter':
        for (const b of this.map.barricades) {
          b.planks = b.maxPlanks;
        }
        this.player.points += 200;
        this.floatingTexts.push({
          id: Math.random().toString(),
          x: this.player.x,
          y: this.player.y - 30,
          text: '¡CARPINTERO! +200',
          color: '#a3e635',
          alpha: 1,
          scale: 1.4,
          life: 1.8
        });
        break;

      case 'insta_kill':
      case 'double_points':
      case 'fire_sale':
        this.activePowerUps.set(type, {
          type,
          duration: 30,
          timeLeft: 30
        });
        break;
    }
  }

  private damagePlayer(amount: number) {
    const hasCursedWeapon = this.player.weapons.some(w => w.def.altarAffinity === 'cursed');
    const finalAmount = hasCursedWeapon ? amount * 1.15 : amount;
    this.player.health -= finalAmount;
    this.player.lastDamageTime = Date.now();
    this.screenShake = 8;
  }

  private handlePlayerDown() {
    this.stats.downs++;
    if (this.stats.revivesLeft > 0 && this.player.perks.includes('quick_revive')) {
      // Auto-revive
      this.stats.revivesLeft--;
      this.player.health = this.player.maxHealth;
      // Clear perks except quick revive decrement
      this.player.perks = this.player.perks.filter(p => p !== 'quick_revive');
      // Push back nearby zombies
      for (const z of this.zombies) {
        const dist = Math.hypot(z.x - this.player.x, z.y - this.player.y);
        if (dist < 120) {
          const ang = Math.atan2(z.y - this.player.y, z.x - this.player.x);
          z.x += Math.cos(ang) * 90;
          z.y += Math.sin(ang) * 90;
        }
      }
      this.floatingTexts.push({
        id: Math.random().toString(),
        x: this.player.x,
        y: this.player.y - 30,
        text: '¡REVIVIDO POR QUICK REVIVE!',
        color: '#06b6d4',
        alpha: 1,
        scale: 1.5,
        life: 2.0
      });
    } else {
      this.status = 'gameover';
    }
  }

  private updateInteractables(dt: number) {
    // Mystery box roll animation
    if (this.boxRolling) {
      this.boxRollTimer -= dt;
      if (this.boxRollTimer <= 0) {
        this.boxRolling = false;
        if (this.boxIsTeddy) {
          soundEngine.playTeddyLaugh();
          this.moveMysteryBox();
        } else {
          soundEngine.playMysteryBoxReady();
          this.boxClaimTimer = 10; // 10s to grab weapon
        }
      }
    }

    if (this.boxClaimTimer > 0) {
      this.boxClaimTimer -= dt;
      if (this.boxClaimTimer <= 0) {
        this.boxReadyWeapon = null;
      }
    }

    // Pack a punch machine & Altars upgrade timers
    if (this.map.packAPunch.isUpgrading) {
      this.map.packAPunch.upgradeTimer -= dt;
      if (this.map.packAPunch.upgradeTimer <= 0) {
        this.map.packAPunch.isUpgrading = false;
        soundEngine.playMysteryBoxReady();
      }
    }
    for (const altar of this.map.altars) {
      if (altar.isUpgrading) {
        altar.upgradeTimer -= dt;
        if (altar.upgradeTimer <= 0) {
          altar.isUpgrading = false;
          soundEngine.playMysteryBoxReady();
        }
      }
    }

    // Electric trap timer & lethal electrocution
    const trap = this.map.electricTrap;
    if (trap.isActive) {
      trap.activeTime -= dt;
      if (trap.activeTime <= 0) {
        trap.isActive = false;
      } else {
        // Shock zombies walking through trap corridor
        for (let i = this.zombies.length - 1; i >= 0; i--) {
          const z = this.zombies[i];
          if (z.x >= trap.x - 10 && z.x <= trap.x + trap.w + 10 && z.y >= trap.y - 10 && z.y <= trap.y + trap.h + 10) {
            this.killZombie(z, false, false);
            soundEngine.playPowerOn();
            for (let p = 0; p < 8; p++) {
              this.particles.push({
                x: z.x,
                y: z.y,
                vx: (Math.random() - 0.5) * 140,
                vy: (Math.random() - 0.5) * 140,
                size: 3.5,
                color: '#38bdf8',
                alpha: 1,
                life: 0.4,
                maxLife: 0.4,
                type: 'spark'
              });
            }
          }
        }

        // Shock player if careless enough to run through active electric trap
        const px = this.player.x;
        const py = this.player.y;
        if (px >= trap.x && px <= trap.x + trap.w && py >= trap.y && py <= trap.y + trap.h) {
          this.damagePlayer(45 * dt);
        }
      }
    }
  }

  private moveMysteryBox() {
    this.boxReadyWeapon = null;
    this.boxIsTeddy = false;
    const currentBox = this.map.mysteryBoxes.find(b => b.isActive);
    if (currentBox) currentBox.isActive = false;

    const otherBoxes = this.map.mysteryBoxes.filter(b => b !== currentBox);
    const newBox = otherBoxes[Math.floor(Math.random() * otherBoxes.length)];
    if (newBox) newBox.isActive = true;
  }

  private handleInteraction(isInteractPressed: boolean, dt: number) {
    this.promptText = null;
    const px = this.player.x;
    const py = this.player.y;
    const hasSpeedCola = this.player.perks.includes('speed_cola');

    // 1. Barricades repair
    for (const b of this.map.barricades) {
      const dist = Math.hypot(b.x + b.w / 2 - px, b.y + b.h / 2 - py);
      if (dist < 60 && b.planks < b.maxPlanks) {
        this.promptText = 'Mantén [F] para reconstruir barricada (+10 Pts)';
        if (isInteractPressed) {
          b.planks = Math.min(b.maxPlanks, b.planks + (hasSpeedCola ? dt * 4 : dt * 2));
          this.player.points += Math.floor(10 * dt * 2);
          this.stats.score += Math.floor(10 * dt * 2);
          soundEngine.playHammerBoard();
        }
        return;
      }
    }

    // 2. Doors
    for (const d of this.map.doors) {
      if (!d.isOpen) {
        const dist = Math.hypot(d.x + d.w / 2 - px, d.y + d.h / 2 - py);
        if (dist < 75) {
          this.promptText = `[F] Abrir ${d.name} [Costo: ${d.cost}]`;
          if (isInteractPressed && this.player.points >= d.cost) {
            this.player.points -= d.cost;
            d.isOpen = true;
            soundEngine.playPointsClink();
            if (this.onWorldAction) this.onWorldAction('door_open', { doorId: d.id });
          }
          return;
        }
      }
    }

    // 3. Wall Buys
    for (const wb of this.map.wallBuys) {
      const dist = Math.hypot(wb.x - px, wb.y - py);
      if (dist < 65) {
        const weaponDef = WEAPON_REGISTRY[wb.weaponId];
        const playerHasWeapon = this.player.weapons.some(w => w.def.id === wb.weaponId || w.def.papId === wb.weaponId);

        if (playerHasWeapon) {
          const ammoCost = weaponDef.ammoCost || 300;
          this.promptText = `[F] Comprar Munición para ${weaponDef.name} [Costo: ${ammoCost}]`;
          if (isInteractPressed && this.player.points >= ammoCost) {
            const w = this.player.weapons.find(w => w.def.id === wb.weaponId || w.def.papId === wb.weaponId);
            if (w && w.reserveAmmo < w.def.maxReserveAmmo) {
              this.player.points -= ammoCost;
              w.reserveAmmo = w.def.maxReserveAmmo;
              soundEngine.playPointsClink();
            }
          }
        } else {
          const cost = weaponDef.wallCost || 1000;
          this.promptText = `[F] Comprar ${weaponDef.name} [Costo: ${cost}]`;
          if (isInteractPressed && this.player.points >= cost) {
            this.player.points -= cost;
            this.givePlayerWeapon(wb.weaponId);
            soundEngine.playPointsClink();
          }
        }
        return;
      }
    }

    // 4. Mystery Box
    const activeBox = this.map.mysteryBoxes.find(b => b.isActive);
    if (activeBox) {
      const dist = Math.hypot(activeBox.x + activeBox.w / 2 - px, activeBox.y + activeBox.h / 2 - py);
      if (dist < 75) {
        const isFireSale = this.activePowerUps.has('fire_sale');
        const boxCost = isFireSale ? 10 : 950;

        if (this.boxClaimTimer > 0 && this.boxReadyWeapon) {
          const readyDef = WEAPON_REGISTRY[this.boxReadyWeapon];
          this.promptText = `[F] Recoger ${readyDef.name}`;
          if (isInteractPressed) {
            this.givePlayerWeapon(this.boxReadyWeapon);
            this.boxReadyWeapon = null;
            this.boxClaimTimer = 0;
            soundEngine.playPointsClink();
          }
        } else if (!this.boxRolling) {
          this.promptText = `[F] Abrir Caja Misteriosa [Costo: ${boxCost}]`;
          if (isInteractPressed && this.player.points >= boxCost) {
            this.player.points -= boxCost;
            this.startMysteryBoxRoll();
          }
        }
        return;
      }
    }

    // 5. Perk Machines
    for (const pm of this.map.perkMachines) {
      const dist = Math.hypot(pm.x + pm.w / 2 - px, pm.y + pm.h / 2 - py);
      if (dist < 65) {
        const perkDef = PERK_REGISTRY[pm.id];
        const alreadyHas = this.player.perks.includes(pm.id);

        if (!this.map.powerSwitch.isOn) {
          this.promptText = `[Se requiere activar la corriente eléctrica]`;
        } else if (alreadyHas) {
          this.promptText = `Ya posees ${perkDef.name}`;
        } else {
          this.promptText = `[F] Beber ${perkDef.name} [Costo: ${perkDef.cost}]`;
          if (isInteractPressed && this.player.points >= perkDef.cost) {
            this.player.points -= perkDef.cost;
            this.buyPerk(pm.id);
          }
        }
        return;
      }
    }

    // 6. Power Switch
    const powerDist = Math.hypot(this.map.powerSwitch.x - px, this.map.powerSwitch.y - py);
    if (powerDist < 60) {
      if (!this.map.powerSwitch.isOn) {
        this.promptText = `[F] Activar la Corriente Eléctrica Principal`;
        if (isInteractPressed) {
          this.map.powerSwitch.isOn = true;
          soundEngine.playPowerOn();
          if (this.onWorldAction) this.onWorldAction('power_on');
          this.floatingTexts.push({
            id: Math.random().toString(),
            x: this.map.powerSwitch.x,
            y: this.map.powerSwitch.y - 30,
            text: '¡CORRIENTE ELÉCTRICA ACTIVADA!',
            color: '#38bdf8',
            alpha: 1,
            scale: 1.5,
            life: 2.2
          });
        }
      } else {
        this.promptText = `La Corriente Principal está ACTIVADA`;
      }
      return;
    }

    // 7. Altares Místicos (Altar Sagrado y Altar Maldito)
    for (const altar of this.map.altars) {
      const altarDist = Math.hypot(altar.x + altar.w / 2 - px, altar.y + altar.h / 2 - py);
      if (altarDist < 75) {
        if (!this.map.powerSwitch.isOn) {
          this.promptText = `[${altar.name} inactivo - Activa la corriente principal]`;
        } else if (altar.isUpgrading) {
          this.promptText = `${altar.name}: Canalizando energías rituales...`;
        } else if (altar.depositedWeapon) {
          this.promptText = `[F] Reclamar ${altar.depositedWeapon.def.name} del ${altar.name}`;
          if (isInteractPressed) {
            if (this.player.weapons.length < 2) {
              this.player.weapons.push(altar.depositedWeapon);
              this.player.currentWeaponIndex = this.player.weapons.length - 1;
            } else {
              this.player.weapons[this.player.currentWeaponIndex] = altar.depositedWeapon;
            }
            altar.depositedWeapon = null;
            soundEngine.playPointsClink();
          }
        } else {
          const curW = this.player.weapons[this.player.currentWeaponIndex];
          if (curW && !curW.def.isPackAPunched && curW.def.papId) {
            if (altar.type === 'sacred') {
              this.promptText = `[F] Ofrenda Sagrada a ${curW.def.name} [5000 Pts] (Buff: Robo Vida +4 HP | Defecto: -15% Cadencia)`;
            } else {
              this.promptText = `[F] Pacto Maldito a ${curW.def.name} [5000 Pts] (Buff: +180% Daño y Fuego | Defecto: Voto Sangre)`;
            }
            if (isInteractPressed && this.player.points >= 5000) {
              this.player.points -= 5000;
              this.startAltarUpgrade(curW, altar);
            }
          } else {
            this.promptText = `Esta arma ya ha sido bendecida o maldecida en un altar`;
          }
        }
        return;
      }
    }

    // 8. Electric Trap
    const trap = this.map.electricTrap;
    const trapSwitchDist = Math.hypot(trap.x - px, trap.y - py);
    if (trapSwitchDist < 60) {
      if (!this.map.powerSwitch.isOn) {
        this.promptText = `[Trampa eléctrica sin energía]`;
      } else if (trap.isActive) {
        this.promptText = `Trampa Eléctrica ACTIVADA (${Math.ceil(trap.activeTime)}s)`;
      } else {
        this.promptText = `[F] Activar Trampa Eléctrica [Costo: 1000]`;
        if (isInteractPressed && this.player.points >= trap.cost) {
          this.player.points -= trap.cost;
          trap.isActive = true;
          trap.activeTime = 25;
          soundEngine.playPowerOn();
          if (this.onWorldAction) this.onWorldAction('trap_activate');
        }
      }
    }
  }

  private startMysteryBoxRoll() {
    this.boxRolling = true;
    this.boxRollTimer = 3.5;
    this.boxReadyWeapon = null;
    soundEngine.playMysteryBoxSpin();

    // 1 in 8 chance for teddy bear
    this.boxIsTeddy = Math.random() < 0.125;
    if (!this.boxIsTeddy) {
      const chosenId = MYSTERY_BOX_WEAPONS[Math.floor(Math.random() * MYSTERY_BOX_WEAPONS.length)];
      this.boxReadyWeapon = chosenId;
    }
  }

  private startAltarUpgrade(curWeapon: PlayerWeapon, altar: AltarDef) {
    soundEngine.playPackAPunch();
    const basePapDef = WEAPON_REGISTRY[curWeapon.def.papId!];
    const isSacred = altar.type === 'sacred';

    const upgradedDef: WeaponDef = {
      ...basePapDef,
      name: isSacred ? `[SAGRADO] ${basePapDef.name}` : `[MALDITO] ${basePapDef.name}`,
      isPackAPunched: true,
      altarAffinity: altar.type,
      // SACRED BUFF: Lifesteal (+4 HP per zombie hit) + holy penetration (+2) + holy blue color
      // SACRED DEBUFF: -15% fire rate
      // CURSED BUFF: +180% damage + infernal burning fire
      // CURSED DEBUFF: Blood covenant (health regen delayed, player takes slightly more damage)
      damage: isSacred ? Math.round(basePapDef.damage * 1.35) : Math.round(basePapDef.damage * 2.2),
      fireRate: isSacred ? basePapDef.fireRate * 0.85 : basePapDef.fireRate,
      penetration: isSacred ? basePapDef.penetration + 2 : basePapDef.penetration,
      bulletColor: isSacred ? '#38bdf8' : '#ef4444',
      bulletRadius: isSacred ? basePapDef.bulletRadius + 0.5 : basePapDef.bulletRadius + 1.2,
      lifesteal: isSacred ? 4 : 0,
      fireBurn: !isSacred,
      description: isSacred 
        ? 'Bendecida por el Altar Sagrado: Otorga robo de salud (+4 HP por impacto) y penetración divina a costa de una cadencia pausada.'
        : 'Condenada por el Altar Maldito: Desata fuego abisal y +180% daño devastador bajo el juramento del sacrificio de sangre.'
    };

    const upgradedWeapon: PlayerWeapon = {
      def: upgradedDef,
      currentMag: upgradedDef.magazineSize,
      reserveAmmo: upgradedDef.maxReserveAmmo,
      isReloading: false,
      reloadProgress: 0,
      lastFiredTime: 0
    };

    // Remove current weapon from inventory
    this.player.weapons.splice(this.player.currentWeaponIndex, 1);
    this.player.currentWeaponIndex = Math.max(0, this.player.weapons.length - 1);

    altar.isUpgrading = true;
    altar.upgradeTimer = 4.5;
    altar.depositedWeapon = upgradedWeapon;

    this.floatingTexts.push({
      id: Math.random().toString(),
      x: altar.x + altar.w / 2,
      y: altar.y - 30,
      text: isSacred ? '¡BENDICIÓN SAGRADA OTORGADA!' : '¡PACTO DE SANGRE MALDITO!',
      color: isSacred ? '#38bdf8' : '#dc2626',
      alpha: 1,
      scale: 1.5,
      life: 2.5
    });
  }

  private buyPerk(perkId: PerkType) {
    if (this.player.perks.length >= 4) {
      this.floatingTexts.push({
        id: Math.random().toString(),
        x: this.player.x,
        y: this.player.y - 30,
        text: '¡LÍMITE DE 4 VENTAJAS ALCANZADO!',
        color: '#ef4444',
        alpha: 1,
        scale: 1.3,
        life: 1.5
      });
      return;
    }

    soundEngine.playPerkDrink();
    this.player.perks.push(perkId);

    if (perkId === 'juggernog') {
      this.player.maxHealth = 250;
      this.player.health = 250;
    }

    this.floatingTexts.push({
      id: Math.random().toString(),
      x: this.player.x,
      y: this.player.y - 30,
      text: `¡${PERK_REGISTRY[perkId].name.toUpperCase()} ADQUIRIDO!`,
      color: PERK_REGISTRY[perkId].color,
      alpha: 1,
      scale: 1.4,
      life: 2.0
    });
  }

  private givePlayerWeapon(id: WeaponId) {
    const def = WEAPON_REGISTRY[id];
    const newWeapon: PlayerWeapon = {
      def: { ...def },
      currentMag: def.magazineSize,
      reserveAmmo: def.maxReserveAmmo,
      isReloading: false,
      reloadProgress: 0,
      lastFiredTime: 0
    };

    if (this.player.weapons.length < 2) {
      this.player.weapons.push(newWeapon);
      this.player.currentWeaponIndex = this.player.weapons.length - 1;
    } else {
      // Replace active weapon
      this.player.weapons[this.player.currentWeaponIndex] = newWeapon;
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private createBloodSplatter(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3.5,
        color: '#991b1b',
        alpha: 1,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        type: 'blood'
      });
    }
  }

  private createSpark(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2,
        color: '#facc15',
        alpha: 1,
        life: 0.2,
        maxLife: 0.2,
        type: 'spark'
      });
    }
  }

  private createWoodDebris(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 70;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3,
        color: '#78350f',
        alpha: 1,
        life: 0.5,
        maxLife: 0.5,
        type: 'smoke'
      });
    }
  }

  private createElectricSparks(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3,
        color: '#38bdf8',
        alpha: 1,
        life: 0.3,
        maxLife: 0.3,
        type: 'spark'
      });
    }
  }
}
