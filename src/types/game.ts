export type WeaponId = 
  | 'm1911'
  | 'olympia'
  | 'mp40'
  | 'kar98k'
  | 'trenchgun'
  | 'rpk'
  | 'raygun'
  | 'mustang_sally'
  | 'hades'
  | 'afterburner'
  | 'armageddon'
  | 'gut_shot'
  | 'rpk_dread'
  | 'porters_raygun';

export type AltarType = 'sacred' | 'cursed';

export interface AltarDef {
  id: string;
  type: AltarType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isUpgrading: boolean;
  upgradeTimer: number;
  depositedWeapon: PlayerWeapon | null;
}

export interface WeaponDef {
  id: WeaponId;
  name: string;
  papName?: string;
  papId?: WeaponId;
  type: 'pistol' | 'shotgun' | 'smg' | 'rifle' | 'lmg' | 'wonder';
  damage: number;
  fireRate: number; // rounds per second
  magazineSize: number;
  maxReserveAmmo: number;
  reloadTime: number; // in seconds
  spread: number; // degrees
  pellets?: number; // for shotguns
  bulletSpeed: number;
  isAutomatic: boolean;
  wallCost?: number;
  ammoCost?: number;
  isPackAPunched?: boolean;
  altarAffinity?: AltarType;
  lifesteal?: number; // Sacred: heal X HP per hit!
  fireBurn?: boolean; // Cursed: infernal burn!
  color: string;
  bulletColor: string;
  bulletRadius: number;
  penetration: number; // how many zombies it can pierce
  explosive?: boolean;
  explosionRadius?: number;
  explosionDamage?: number;
  description: string;
}

export interface PlayerWeapon {
  def: WeaponDef;
  currentMag: number;
  reserveAmmo: number;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  lastFiredTime: number;
}

export type PerkType = 'juggernog' | 'speed_cola' | 'double_tap' | 'quick_revive' | 'stamin_up';

export interface PerkDef {
  id: PerkType;
  name: string;
  cost: number;
  color: string;
  iconBg: string;
  description: string;
  tagline: string;
}

export type PowerUpType = 'max_ammo' | 'insta_kill' | 'double_points' | 'nuke' | 'carpenter' | 'fire_sale';

export interface ActivePowerUp {
  type: PowerUpType;
  timeLeft: number; // in seconds
  duration: number;
}

export interface PowerUpDrop {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  duration: number; // time until despawn (30s)
  pulse: number;
}

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
  isSolid: boolean;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cost: number;
  isOpen: boolean;
  name: string;
  roomA: string;
  roomB: string;
}

export interface Barricade {
  id: string;
  roomId: 'spawn' | 'courtyard' | 'power' | 'laboratory';
  x: number;
  y: number;
  w: number;
  h: number;
  planks: number; // max 6
  maxPlanks: number;
  repairing: boolean;
  facing: 'top' | 'bottom' | 'left' | 'right';
  spawnPoint: { x: number; y: number };
}

export interface WallBuy {
  id: string;
  weaponId: WeaponId;
  x: number;
  y: number;
  facing: 'top' | 'bottom' | 'left' | 'right';
}

export interface PerkMachine {
  id: PerkType;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MysteryBoxLocation {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isActive: boolean;
}

export interface PackAPunchMachine {
  x: number;
  y: number;
  w: number;
  h: number;
  isUpgrading: boolean;
  upgradeTimer: number;
  depositedWeapon: PlayerWeapon | null;
}

export interface Zombie {
  id: string;
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  angle: number;
  type: 'walker' | 'runner' | 'crawler' | 'hellhound';
  isAttacking: boolean;
  attackCooldown: number;
  targetBarricadeId: string | null;
  hitFlashTimer: number;
  limbLost?: boolean;
  isClimbing?: boolean;
  climbTimer?: number;
  stumbleTimer?: number;
  steeringBias?: number;
  waypointTarget?: { x: number; y: number } | null;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  penetrationLeft: number;
  color: string;
  radius: number;
  distanceTraveled: number;
  maxDistance: number;
  isExplosive?: boolean;
  explosionRadius?: number;
  explosionDamage?: number;
  fromPlayer: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'blood' | 'spark' | 'smoke' | 'fire' | 'shell' | 'laser';
}

export interface BloodDecal {
  x: number;
  y: number;
  size: number;
  alpha: number;
  rotation: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  life: number;
}

export interface PlayerStats {
  score: number;
  kills: number;
  headshots: number;
  downs: number;
  revivesLeft: number;
  roundsSurvived: number;
  bulletsFired: number;
  bulletsHit: number;
}

export interface PlayerState {
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  speed: number;
  stamina: number;
  maxStamina: number;
  isSprinting: boolean;
  radius: number;
  points: number;
  weapons: PlayerWeapon[];
  currentWeaponIndex: number;
  perks: PerkType[];
  isKnifing: boolean;
  knifeTimer: number;
  regenCooldown: number;
  lastDamageTime: number;
  alignment: 'neutral' | 'sacred' | 'cursed';
}

export type GameStatus = 'start' | 'playing' | 'paused' | 'gameover' | 'victory';
