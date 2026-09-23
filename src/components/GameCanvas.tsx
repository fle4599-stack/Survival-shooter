import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  Player,
  Bullet,
  Zombie,
  BloodSplat,
  MuzzleFlash,
  FloatingText,
  GameStats,
  WEAPON_TIERS,
  WeaponConfig,
  getWaveZombieCount,
} from '../types/game';
import { soundManager } from '../audio/soundManager';
import { HUD } from './HUD';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (stats: GameStats) => void;
  onStateChange: (state: GameState) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  onGameOver,
  onStateChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stats & HUD reactive states
  const [hudKills, setHudKills] = useState<number>(0);
  const [hudWave, setHudWave] = useState<number>(1);
  const [hudWaveProgress, setHudWaveProgress] = useState<number>(0);
  const [hudSurvivalTime, setHudSurvivalTime] = useState<number>(0);
  const [hudShotsFired, setHudShotsFired] = useState<number>(0);
  const [hudShotsHit, setHudShotsHit] = useState<number>(0);
  const [hudWeapon, setHudWeapon] = useState<WeaponConfig>(WEAPON_TIERS[0]);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [freezeCountdown, setFreezeCountdown] = useState<number>(3.0);

  // Game engine references (mutable without re-renders for 60fps canvas performance)
  const engineRef = useRef({
    width: window.innerWidth,
    height: window.innerHeight,
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    isMouseDown: false,
    keysPressed: {} as Record<string, boolean>,
    player: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      radius: 17,
      angle: 0,
      speed: 260,
      barrelLength: 26,
    } as Player,
    bullets: [] as Bullet[],
    zombies: [] as Zombie[],
    bloodSplats: [] as BloodSplat[],
    muzzleFlashes: [] as MuzzleFlash[],
    floatingTexts: [] as FloatingText[],
    // Persistent offscreen canvas for puddles - ensures 60 FPS even with 1000+ puddles
    puddleCanvas: null as HTMLCanvasElement | null,
    puddleCtx: null as CanvasRenderingContext2D | null,
    bulletIdCounter: 1,
    zombieIdCounter: 1,
    textIdCounter: 1,
    kills: 0,
    shotsFired: 0,
    shotsHit: 0,
    currentWave: 1,
    waveTimer: 0, // counts 0 to 5 seconds
    survivalTime: 0,
    lastShotTime: 0,
    freezeTimer: 0, // 3.0s after death
    screenShake: 0,
    lastFrameTime: performance.now(),
    isDead: false,
  });

  // Weapon tier lookup helper (CR8: 0-19 pistol, 20-49 smg, 50+ heavy)
  const getWeaponForKills = useCallback((kills: number): WeaponConfig => {
    if (kills >= 50) return WEAPON_TIERS[2]; // Heavy Rifle (5 shots/sec)
    if (kills >= 20) return WEAPON_TIERS[1]; // SMG (3 shots/sec)
    return WEAPON_TIERS[0]; // Pistol (1 shot/sec)
  }, []);

  // Spawn a wave of zombies: 1, 2, 3, 4, 5, 6... (CR11)
  const spawnWave = useCallback((waveNum: number) => {
    const engine = engineRef.current;
    const count = getWaveZombieCount(waveNum);
    const w = engine.width;
    const h = engine.height;
    const padding = 45; // spawn outside visible borders

    soundManager.playWaveHorn(waveNum);

    // Floating alert for new wave
    engine.floatingTexts.push({
      id: engine.textIdCounter++,
      text: `ВОЛНА ${waveNum} (+${count} ЗОМБИ)`,
      x: w / 2,
      y: h / 2 - 80,
      color: '#34d399',
      life: 2.2,
      maxLife: 2.2,
      size: 24,
    });

    for (let i = 0; i < count; i++) {
      // Pick random side: 0=top, 1=right, 2=bottom, 3=left
      const side = Math.floor(Math.random() * 4);
      let sx = 0;
      let sy = 0;

      switch (side) {
        case 0: // top
          sx = Math.random() * (w + padding * 2) - padding;
          sy = -padding;
          break;
        case 1: // right
          sx = w + padding;
          sy = Math.random() * (h + padding * 2) - padding;
          break;
        case 2: // bottom
          sx = Math.random() * (w + padding * 2) - padding;
          sy = h + padding;
          break;
        case 3: // left
          sx = -padding;
          sy = Math.random() * (h + padding * 2) - padding;
          break;
      }

      // All zombies identical size and speed (CR9: halved speed)
      engine.zombies.push({
        id: engine.zombieIdCounter++,
        x: sx,
        y: sy,
        radius: 16,
        speed: 52.5, // Halved from 105 for better tactical kiting
        state: 'alive',
        stateTimer: 0,
        rot: Math.random() * Math.PI * 2,
        puddleRadius: 0,
        variant: Math.floor(Math.random() * 3),
      });
    }
  }, []);

  // Shoot function
  const tryShoot = useCallback(() => {
    const engine = engineRef.current;
    if (engine.isDead) return;

    const currentWeapon = getWeaponForKills(engine.kills);
    const now = performance.now();
    const elapsedSinceLastShot = now - engine.lastShotTime;

    if (elapsedSinceLastShot < currentWeapon.intervalMs) {
      return; // Weapon cooldown not ready
    }

    engine.lastShotTime = now;
    engine.shotsFired++;

    // Calculate angle towards mouse
    const p = engine.player;
    const dx = engine.mouseX - p.x;
    const dy = engine.mouseY - p.y;
    const angle = Math.atan2(dy, dx);

    // Muzzle position at the end of barrel
    const muzzleX = p.x + Math.cos(angle) * p.barrelLength;
    const muzzleY = p.y + Math.sin(angle) * p.barrelLength;

    // Calculate exact vector from muzzle straight to the cursor position
    const shootDx = engine.mouseX - muzzleX;
    const shootDy = engine.mouseY - muzzleY;
    const shootDist = Math.hypot(shootDx, shootDy);
    const shootAngle = shootDist > 1 ? Math.atan2(shootDy, shootDx) : angle;

    // Bullet velocity vector
    const vx = Math.cos(shootAngle) * currentWeapon.bulletSpeed;
    const vy = Math.sin(shootAngle) * currentWeapon.bulletSpeed;

    engine.bullets.push({
      id: engine.bulletIdCounter++,
      x: muzzleX,
      y: muzzleY,
      vx,
      vy,
      radius: currentWeapon.bulletSize,
    });

    // Muzzle flash visual
    engine.muzzleFlashes.push({
      x: muzzleX,
      y: muzzleY,
      angle,
      life: 0.08,
    });

    // Screen kick
    engine.screenShake = Math.max(engine.screenShake, currentWeapon.soundType === 'heavy' ? 4 : 2);

    // Sound effect
    if (currentWeapon.soundType === 'pistol') {
      soundManager.playPistol();
    } else if (currentWeapon.soundType === 'smg') {
      soundManager.playSMG();
    } else {
      soundManager.playHeavyRifle();
    }
  }, [getWeaponForKills]);

  // Reset engine on new run
  const initGame = useCallback(() => {
    const engine = engineRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;

    engine.width = w;
    engine.height = h;
    engine.mouseX = w / 2;
    engine.mouseY = h / 2;
    engine.isMouseDown = false;
    engine.keysPressed = {};
    engine.player = {
      x: w / 2,
      y: h / 2,
      radius: 17,
      angle: 0,
      speed: 260,
      barrelLength: 26,
    };
    engine.bullets = [];
    engine.zombies = [];
    engine.bloodSplats = [];
    engine.muzzleFlashes = [];
    engine.floatingTexts = [];

    // Reset or initialize persistent puddle canvas
    if (!engine.puddleCanvas) {
      engine.puddleCanvas = document.createElement('canvas');
    }
    engine.puddleCanvas.width = w;
    engine.puddleCanvas.height = h;
    engine.puddleCtx = engine.puddleCanvas.getContext('2d');
    if (engine.puddleCtx) {
      engine.puddleCtx.clearRect(0, 0, w, h);
    }

    engine.kills = 0;
    engine.shotsFired = 0;
    engine.shotsHit = 0;
    engine.currentWave = 1;
    engine.waveTimer = 0;
    engine.survivalTime = 0;
    engine.lastShotTime = 0;
    engine.freezeTimer = 0;
    engine.screenShake = 0;
    engine.lastFrameTime = performance.now();
    engine.isDead = false;

    setHudKills(0);
    setHudWave(1);
    setHudWaveProgress(0);
    setHudSurvivalTime(0);
    setHudShotsFired(0);
    setHudShotsHit(0);
    setHudWeapon(WEAPON_TIERS[0]);
    setFreezeCountdown(3.0);

    // Spawn first wave (1 zombie)
    spawnWave(1);
    soundManager.startAmbient();
  }, [spawnWave]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvasRef.current) {
        canvasRef.current.width = w;
        canvasRef.current.height = h;
      }
      engineRef.current.width = w;
      engineRef.current.height = h;

      // Adjust offscreen puddle canvas on resize
      const engine = engineRef.current;
      if (!engine.puddleCanvas) {
        engine.puddleCanvas = document.createElement('canvas');
      }
      // Preserve existing puddles if already present
      const oldCanvas = engine.puddleCanvas;
      const newCanvas = document.createElement('canvas');
      newCanvas.width = w;
      newCanvas.height = h;
      const newCtx = newCanvas.getContext('2d');
      if (newCtx && oldCanvas.width > 0 && oldCanvas.height > 0) {
        newCtx.drawImage(oldCanvas, 0, 0);
      }
      engine.puddleCanvas = newCanvas;
      engine.puddleCtx = newCtx;
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard WASD Input Handlers (CR2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();
      engineRef.current.keysPressed[code] = true;
      engineRef.current.keysPressed[key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();
      delete engineRef.current.keysPressed[code];
      delete engineRef.current.keysPressed[key];
    };

    const handleBlur = () => {
      engineRef.current.keysPressed = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Mouse Input Handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      engineRef.current.mouseX = e.clientX - rect.left;
      engineRef.current.mouseY = e.clientY - rect.top;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // LMB
        engineRef.current.isMouseDown = true;
        if (gameState === 'PLAYING') {
          tryShoot();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        engineRef.current.isMouseDown = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState, tryShoot]);

  // Initialize game when gameState transitions to PLAYING
  useEffect(() => {
    if (gameState === 'PLAYING') {
      initGame();
    }
  }, [gameState, initGame]);

  // Main Canvas Render & Animation Loop
  useEffect(() => {
    let animId: number;

    const renderLoop = (timestamp: number) => {
      const engine = engineRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dt = Math.min((timestamp - engine.lastFrameTime) / 1000, 0.1);
      engine.lastFrameTime = timestamp;

      // ==========================================
      // 1. GAME UPDATE LOGIC (ONLY IN 'PLAYING' STATE)
      // ==========================================
      if (gameState === 'PLAYING' && !engine.isDead) {
        engine.survivalTime += dt;

        // Wave progression: Every 5 seconds, next wave starts with 2^n zombies
        engine.waveTimer += dt;
        if (engine.waveTimer >= 5.0) {
          engine.waveTimer = 0;
          engine.currentWave += 1;
          spawnWave(engine.currentWave);
        }

        // Automatic continuous shooting when LMB is held down
        if (engine.isMouseDown) {
          tryShoot();
        }

        // CR2: Player movement via WASD keys (no longer follows mouse cursor)
        const p = engine.player;
        const keys = engine.keysPressed;
        let moveX = 0;
        let moveY = 0;

        // Support standard WASD, Arrow keys, and Russian layout (Ц, Ф, Ы, В)
        if (keys['KeyW'] || keys['ArrowUp'] || keys['w'] || keys['ц']) moveY -= 1;
        if (keys['KeyS'] || keys['ArrowDown'] || keys['s'] || keys['ы']) moveY += 1;
        if (keys['KeyA'] || keys['ArrowLeft'] || keys['a'] || keys['ф']) moveX -= 1;
        if (keys['KeyD'] || keys['ArrowRight'] || keys['d'] || keys['в']) moveX += 1;

        if (moveX !== 0 && moveY !== 0) {
          // Normalize diagonal movement speed
          moveX *= Math.SQRT1_2;
          moveY *= Math.SQRT1_2;
        }

        if (moveX !== 0 || moveY !== 0) {
          p.x += moveX * p.speed * dt;
          p.y += moveY * p.speed * dt;
        }

        // Keep player strictly inside visible canvas bounds
        p.x = Math.max(p.radius + 8, Math.min(engine.width - p.radius - 8, p.x));
        p.y = Math.max(p.radius + 8, Math.min(engine.height - p.radius - 8, p.y));

        // Player gun barrel & gaze strictly point towards mouse cursor
        const dx = engine.mouseX - p.x;
        const dy = engine.mouseY - p.y;
        p.angle = Math.atan2(dy, dx);

        // Update Bullets
        for (let i = engine.bullets.length - 1; i >= 0; i--) {
          const b = engine.bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          // Remove if out of screen bounds
          if (b.x < -20 || b.x > engine.width + 20 || b.y < -20 || b.y > engine.height + 20) {
            engine.bullets.splice(i, 1);
            continue;
          }

          // Check collision with living zombies ONLY
          let hitZombieIndex = -1;
          for (let j = 0; j < engine.zombies.length; j++) {
            const z = engine.zombies[j];
            if (z.state !== 'alive') continue; // Dying zombies do not collide with bullets

            const dist = Math.hypot(b.x - z.x, b.y - z.y);
            if (dist < b.radius + z.radius) {
              hitZombieIndex = j;
              break;
            }
          }

          if (hitZombieIndex !== -1) {
            const hitZombie = engine.zombies[hitZombieIndex];
            engine.bullets.splice(i, 1);
            engine.shotsHit++;
            engine.kills++;

            // Hit reaction rule:
            // "зомби мгновенно перестает наносить урон и замирает на 1 секунду.
            // Затем он трансформируется в расплывающуюся зеленую жижу/лужу еще на 1 секунду,
            // после чего полностью исчезает."
            hitZombie.state = 'frozen';
            hitZombie.stateTimer = 1.0;

            soundManager.playZombieHit();

            // Blood splat decals on the floor
            if (engine.bloodSplats.length > 100) {
              engine.bloodSplats.shift(); // Memory cap
            }
            engine.bloodSplats.push({
              x: hitZombie.x,
              y: hitZombie.y,
              radius: 12 + Math.random() * 6,
              color: '#3f6212',
              alpha: 0.6,
              blobs: Array.from({ length: 3 }).map(() => ({
                dx: (Math.random() - 0.5) * 16,
                dy: (Math.random() - 0.5) * 16,
                r: 3 + Math.random() * 4,
              })),
            });

            // Weapon progression checks (CR8: 20 kills -> SMG, 50 kills -> Heavy Rifle)
            if (engine.kills === 20) {
              soundManager.playWeaponUpgrade();
              engine.floatingTexts.push({
                id: engine.textIdCounter++,
                text: 'НОВОЕ ОРУЖИЕ: АВТОМАТ! (3 ВЫСТР/С)',
                x: engine.width / 2,
                y: engine.height / 2 - 40,
                color: '#fbbf24',
                life: 2.5,
                maxLife: 2.5,
                size: 20,
              });
            } else if (engine.kills === 50) {
              soundManager.playWeaponUpgrade();
              engine.floatingTexts.push({
                id: engine.textIdCounter++,
                text: 'МАКС. УРОВЕНЬ: ТЯЖЕЛЫЙ АВТОМАТ! (5 ВЫСТР/С)',
                x: engine.width / 2,
                y: engine.height / 2 - 40,
                color: '#f43f5e',
                life: 2.8,
                maxLife: 2.8,
                size: 22,
              });
            }
          }
        }

        // Update Zombies
        for (let i = engine.zombies.length - 1; i >= 0; i--) {
          const z = engine.zombies[i];

          if (z.state === 'alive') {
            // Zombies move straight towards player and can pass through each other
            const zdx = p.x - z.x;
            const zdy = p.y - z.y;
            const zDist = Math.hypot(zdx, zdy);

            if (zDist > 0.1) {
              z.x += (zdx / zDist) * z.speed * dt;
              z.y += (zdy / zDist) * z.speed * dt;
              z.rot = Math.atan2(zdy, zdx);
            }

            // Defeat condition: instant death on contact with living zombie
            if (zDist < p.radius + z.radius) {
              engine.isDead = true;
              engine.freezeTimer = 3.0; // Freeze for exactly 3 seconds
              soundManager.playDeathContact();
              soundManager.stopAmbient();
              onStateChange('FREEZE');
              break;
            }
          } else if (z.state === 'frozen') {
            // Frozen for 1.0 second
            z.stateTimer -= dt;
            if (z.stateTimer <= 0) {
              z.state = 'puddle';
              z.stateTimer = 1.0;
              z.puddleRadius = 6;
              soundManager.playPuddleForm();
            }
          } else if (z.state === 'puddle') {
            // Expanding puddle for 1.0 second
            z.stateTimer -= dt;
            z.puddleRadius = Math.min(22, z.puddleRadius + 18 * dt);

            // Bug01 fix: Once the puddle reaches full size after 1 sec,
            // we permanently stamp it onto the offscreen puddleCanvas!
            // This leaves the puddle on screen permanently with ZERO frame lag for 1000s of puddles!
            if (z.stateTimer <= 0) {
              if (engine.puddleCtx) {
                const pCtx = engine.puddleCtx;
                // Simple, highly performant dark green toxic puddle circle
                pCtx.fillStyle = 'rgba(20, 68, 30, 0.85)';
                pCtx.beginPath();
                pCtx.arc(z.x, z.y, z.puddleRadius, 0, Math.PI * 2);
                pCtx.fill();

                pCtx.fillStyle = 'rgba(74, 222, 128, 0.7)';
                pCtx.beginPath();
                pCtx.arc(z.x, z.y, z.puddleRadius * 0.45, 0, Math.PI * 2);
                pCtx.fill();
              }
              // Remove zombie from active objects array
              engine.zombies.splice(i, 1);
            }
          }
        }

        // Update Muzzle Flashes
        for (let i = engine.muzzleFlashes.length - 1; i >= 0; i--) {
          engine.muzzleFlashes[i].life -= dt;
          if (engine.muzzleFlashes[i].life <= 0) {
            engine.muzzleFlashes.splice(i, 1);
          }
        }

        // Update Floating Texts
        for (let i = engine.floatingTexts.length - 1; i >= 0; i--) {
          const ft = engine.floatingTexts[i];
          ft.life -= dt;
          ft.y -= 18 * dt;
          if (ft.life <= 0) {
            engine.floatingTexts.splice(i, 1);
          }
        }

        // Screen shake decay
        if (engine.screenShake > 0) {
          engine.screenShake = Math.max(0, engine.screenShake - 20 * dt);
        }

        // Sync reactive state with HUD
        setHudKills(engine.kills);
        setHudWave(engine.currentWave);
        setHudWaveProgress(engine.waveTimer / 5.0);
        setHudSurvivalTime(engine.survivalTime);
        setHudShotsFired(engine.shotsFired);
        setHudShotsHit(engine.shotsHit);
        setHudWeapon(getWeaponForKills(engine.kills));
      }

      // ==========================================
      // 2. FREEZE-FRAME LOGIC (EXACTLY 3 SECONDS)
      // ==========================================
      if (gameState === 'FREEZE' || (engine.isDead && engine.freezeTimer > 0)) {
        engine.freezeTimer -= dt;
        setFreezeCountdown(Math.max(0, engine.freezeTimer));

        if (engine.freezeTimer <= 0) {
          const finalStats: GameStats = {
            kills: engine.kills,
            shotsFired: engine.shotsFired,
            shotsHit: engine.shotsHit,
            currentWave: engine.currentWave,
            survivalTime: engine.survivalTime,
            finalKills: engine.kills,
            accuracy:
              engine.shotsFired > 0
                ? Math.min(100, Math.round((engine.shotsHit / engine.shotsFired) * 100))
                : 0,
          };
          onGameOver(finalStats);
        }
      }

      // ==========================================
      // 3. CANVAS RENDERING
      // ==========================================
      ctx.save();

      // Screen shake translation
      if (engine.screenShake > 0) {
        const sx = (Math.random() - 0.5) * engine.screenShake * 2;
        const sy = (Math.random() - 0.5) * engine.screenShake * 2;
        ctx.translate(sx, sy);
      }

      // 3.1 Earthy arena floor (CR10: warm soil tone between black and dark brown)
      ctx.fillStyle = '#221812';
      ctx.fillRect(0, 0, engine.width, engine.height);

      // Organic soil / arena grid
      ctx.strokeStyle = 'rgba(215, 175, 135, 0.045)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < engine.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, engine.height);
        ctx.stroke();
      }
      for (let y = 0; y < engine.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(engine.width, y);
        ctx.stroke();
      }

      // Arena boundary hazard border
      ctx.strokeStyle = 'rgba(225, 45, 60, 0.22)';
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, engine.width - 12, engine.height - 12);

      // 3.2 Bug01: Draw persistent puddles from offscreen canvas in ONE single ultra-fast blit call
      if (engine.puddleCanvas) {
        ctx.drawImage(engine.puddleCanvas, 0, 0);
      }

      // 3.3 Blood & Splats
      engine.bloodSplats.forEach((splat) => {
        ctx.save();
        ctx.fillStyle = splat.color;
        ctx.globalAlpha = splat.alpha;
        ctx.beginPath();
        ctx.arc(splat.x, splat.y, splat.radius, 0, Math.PI * 2);
        ctx.fill();
        splat.blobs.forEach((b) => {
          ctx.beginPath();
          ctx.arc(splat.x + b.dx, splat.y + b.dy, b.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      });

      // 3.4 Render Dying Zombies (Currently expanding puddles & Frozen zombies)
      engine.zombies.forEach((z) => {
        if (z.state === 'puddle') {
          // Simplified, fast, clean expanding puddle graphic
          ctx.save();
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(z.x, z.y, z.puddleRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#86efac';
          ctx.beginPath();
          ctx.arc(z.x, z.y, z.puddleRadius * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (z.state === 'frozen') {
          // Frozen zombie in shock/agony (1 second pause)
          ctx.save();
          ctx.translate(z.x, z.y);
          ctx.rotate(z.rot);

          // Stun outline
          ctx.strokeStyle = '#a3e635';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, z.radius + 2, 0, Math.PI * 2);
          ctx.stroke();

          // Frozen pale rotten head
          ctx.fillStyle = '#3f6212';
          ctx.beginPath();
          ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
          ctx.fill();

          // Crack
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-4, -6);
          ctx.lineTo(2, 2);
          ctx.stroke();

          ctx.restore();
        }
      });

      // 3.5 Render Living Zombies
      engine.zombies.forEach((z) => {
        if (z.state !== 'alive') return;

        ctx.save();
        ctx.translate(z.x, z.y);
        ctx.rotate(z.rot);

        // Rotten green head
        ctx.fillStyle = '#4d7c0f';
        ctx.beginPath();
        ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
        ctx.fill();

        // Dark decay patch
        ctx.fillStyle = '#1e3a12';
        ctx.beginPath();
        ctx.arc(-4, -3, 5, 0, Math.PI * 2);
        ctx.fill();

        // Blood wound
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(3, 4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Milky pale eyes
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(7, -5, 2.5, 0, Math.PI * 2);
        ctx.arc(7, 5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#450a0a';
        ctx.beginPath();
        ctx.arc(8, -5, 1, 0, Math.PI * 2);
        ctx.arc(8, 5, 1, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#14270c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      });

      // 3.6 Render Bullets
      engine.bullets.forEach((b) => {
        ctx.save();
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 3.7 Render Muzzle Flashes
      engine.muzzleFlashes.forEach((mf) => {
        ctx.save();
        ctx.translate(mf.x, mf.y);
        ctx.rotate(mf.angle);
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(16, 0);
        ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // 3.8 Render Player (вид строго сверху)
      const p = engine.player;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Weapon barrel
      ctx.fillStyle = '#171717';
      ctx.fillRect(8, -3.5, p.barrelLength - 8, 7);

      // Muzzle brake tip
      ctx.fillStyle = '#404040';
      ctx.fillRect(p.barrelLength - 3, -4.5, 4, 9);

      // Hands holding weapon
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(10, -7, 4.5, 0, Math.PI * 2);
      ctx.arc(10, 7, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Base shadow / rim
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Survivor Cap / Helmet dome
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.arc(-1, 0, p.radius - 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Hat visor pointing towards cursor
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(4, 0, 7, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      // Hat center strap
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-p.radius + 4, 0);
      ctx.lineTo(p.radius - 4, 0);
      ctx.stroke();

      ctx.restore();

      // 3.9 Render Floating Texts
      engine.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.font = `bold ${ft.size}px 'Cinzel', serif`;
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 8;
        ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // 3.10 Vignette / horror shadow
      const grad = ctx.createRadialGradient(
        engine.width / 2,
        engine.height / 2,
        Math.min(engine.width, engine.height) * 0.35,
        engine.width / 2,
        engine.height / 2,
        Math.max(engine.width, engine.height) * 0.75
      );
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(12, 7, 4, 0.72)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, engine.width, engine.height);

      // 3.12 Freeze-frame visual effect on death
      if (gameState === 'FREEZE' || engine.isDead) {
        ctx.fillStyle = 'rgba(153, 27, 27, 0.28)';
        ctx.fillRect(0, 0, engine.width, engine.height);

        ctx.save();
        ctx.font = "900 36px 'Cinzel', serif";
        ctx.fillStyle = '#f87171';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 15;
        ctx.fillText('СМЕРТЕЛЬНОЕ КАСАНИЕ', engine.width / 2, engine.height / 2 - 30);

        ctx.font = "600 16px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.fillText(
          `Момент гибели: переход через ${freezeCountdown.toFixed(1)}с`,
          engine.width / 2,
          engine.height / 2 + 10
        );
        ctx.restore();
      }

      ctx.restore();

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, onGameOver, onStateChange, spawnWave, tryShoot, freezeCountdown]);

  const handleToggleMute = () => {
    const nextMute = soundManager.toggleMute();
    setIsMuted(nextMute);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none cursor-crosshair">
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* In-game HUD */}
      {gameState === 'PLAYING' && (
        <HUD
          kills={hudKills}
          currentWave={hudWave}
          waveProgress={hudWaveProgress}
          survivalSeconds={hudSurvivalTime}
          currentWeapon={hudWeapon}
          shotsFired={hudShotsFired}
          shotsHit={hudShotsHit}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}
    </div>
  );
};
