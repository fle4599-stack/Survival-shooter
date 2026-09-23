export type GameState = 'TITLE' | 'PLAYING' | 'FREEZE' | 'GAME_OVER';

export interface WeaponConfig {
  name: string;
  nameRu: string;
  fireRate: number; // shots per second
  intervalMs: number;
  bulletSpeed: number;
  bulletSize: number;
  damage: number;
  minKills: number;
  maxKills: number | null;
  soundType: 'pistol' | 'smg' | 'heavy';
}

export const WEAPON_TIERS: WeaponConfig[] = [
  {
    name: 'Pistol 9mm',
    nameRu: 'Пистолет',
    fireRate: 1, // 1 shot per second
    intervalMs: 1000,
    bulletSpeed: 820,
    bulletSize: 4,
    damage: 1,
    minKills: 0,
    maxKills: 99,
    soundType: 'pistol',
  },
  {
    name: 'Tactical SMG',
    nameRu: 'Автомат',
    fireRate: 3, // 3 shots per second
    intervalMs: 333.33,
    bulletSpeed: 950,
    bulletSize: 4.5,
    damage: 1,
    minKills: 100,
    maxKills: 249,
    soundType: 'smg',
  },
  {
    name: 'Heavy Assault Rifle',
    nameRu: 'Тяжелый автомат',
    fireRate: 5, // 5 shots per second
    intervalMs: 200,
    bulletSpeed: 1100,
    bulletSize: 5,
    damage: 1,
    minKills: 250,
    maxKills: null,
    soundType: 'heavy',
  },
];

export interface Player {
  x: number;
  y: number;
  radius: number;
  angle: number;
  speed: number;
  barrelLength: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export type ZombieState = 'alive' | 'frozen' | 'puddle';

export interface Zombie {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  state: ZombieState;
  stateTimer: number; // in seconds
  rot: number;
  puddleRadius: number;
  variant: number; // 0, 1, 2 for head details
}

export interface BloodSplat {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  blobs: { dx: number; dy: number; r: number }[];
}

export interface SlimePuddle {
  x: number;
  y: number;
  maxRadius: number;
  currentRadius: number;
  alpha: number;
  life: number;
}

export interface MuzzleFlash {
  x: number;
  y: number;
  angle: number;
  life: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface GameStats {
  kills: number;
  shotsFired: number;
  shotsHit: number;
  currentWave: number;
  survivalTime: number; // in seconds
  finalKills: number;
  accuracy: number;
}
