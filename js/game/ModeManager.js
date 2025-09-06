// js/game/ModeManager.js

import * as C from '../constants.js';
import { getRandomSpawnPosition } from '../utils.js';
import Enemy from '../entities/Enemy.js';
import Projectile from '../entities/Projectile.js';
import Laser from '../entities/Laser.js';
import Reflection from '../entities/Reflection.js';

export default class ModeManager {
    constructor(game) {
        this.game = game; // Ana Game sınıfına referans
        this.lastEnemySpawnTime = 0;
        this.lastBotLikeProjectileTime = 0;
        this.lastRandomProjectileTime = 0;
        this.lastLaserSpawnTime = 0;
        this.enemyGlobalLastFireTime = 0;
    }

    reset(startTime) {
        this.lastEnemySpawnTime = startTime;
        this.lastBotLikeProjectileTime = startTime;
        this.lastRandomProjectileTime = startTime;
        this.lastLaserSpawnTime = startTime;
        this.enemyGlobalLastFireTime = startTime;
    }

    update(timestamp, elapsedTime) {
        const { currentGameMode, player, enemies } = this.game;

        switch (currentGameMode) {
            case 'SKILL_DODGE':
                this.updateSkillDodge(timestamp, elapsedTime);
                break;
            case 'KITE_ONLY':
                this.updateKiteOnly(timestamp, elapsedTime);
                break;
            case 'DODGE_ONLY':
                this.updateDodgeOnly(timestamp, elapsedTime);
                break;
            case 'KAOS':
                this.updateKaos(timestamp, elapsedTime);
                break;
            case 'REFLECTION_BOSS':
                this.updateReflectionArena(timestamp, elapsedTime);
                break;  
        }
        
        enemies.forEach(e => e.update(player));
    }

    adjustTimersForPause(pauseDuration) {
    // Bu, ModeManager'ın kendi içindeki tüm zamanlayıcıları
    // duraklatma süresi kadar ileri alır.
    this.lastEnemySpawnTime += pauseDuration;
    this.lastBotLikeProjectileTime += pauseDuration;
    this.lastRandomProjectileTime += pauseDuration;
    this.lastLaserSpawnTime += pauseDuration;
    this.enemyGlobalLastFireTime += pauseDuration; // <-- EN ÖNEMLİ SATIR BU
}
    
    // --- MOD GÜNCELLEME FONKSİYONLARI ---

    updateSkillDodge(timestamp, elapsedTime) {
        const skillScaling = Math.min(1, this.game.score / C.KILLS_TO_MAX_DIFFICULTY);
        const currentSpawnInterval = C.SKILL_DODGE_SPAWN_INTERVAL_START - (C.SKILL_DODGE_SPAWN_INTERVAL_START - C.SKILL_DODGE_SPAWN_INTERVAL_END) * skillScaling;
        const maxEnemies = Math.floor(1 + (C.ABSOLUTE_MAX_ENEMIES - 1) * skillScaling);
        const currentFireInterval = C.SKILL_DODGE_FIRE_INTERVAL_START - (C.SKILL_DODGE_FIRE_INTERVAL_START - C.SKILL_DODGE_FIRE_INTERVAL_END) * skillScaling;

        if (timestamp - this.lastEnemySpawnTime > currentSpawnInterval && this.game.enemies.length < maxEnemies) {
            this.spawnEnemy('SHOOTER');
            this.lastEnemySpawnTime = timestamp;
        }

        if (timestamp - this.enemyGlobalLastFireTime > currentFireInterval && this.game.enemies.length > 0) {
            const closestEnemy = this.findClosestEnemy(C.SHOOTER_ENEMY_FIRE_RANGE);
            if (closestEnemy) {
                this.spawnProjectile(closestEnemy, this.game.player, 'ENEMY');
                this.game.audioManager.playSound('enemyShoot', { pitch: 0.2 });
                this.enemyGlobalLastFireTime = timestamp;
            }
        }
    }

    updateKiteOnly(timestamp, elapsedTime) {
         const kiteScaling = Math.min(1, this.game.score / 20);
         const currentSpawnInterval = C.KITE_ONLY_SPAWN_INTERVAL_START - (C.KITE_ONLY_SPAWN_INTERVAL_START - C.KITE_ONLY_SPAWN_INTERVAL_END) * kiteScaling;
         const maxEnemies = Math.floor(1 + (C.ABSOLUTE_MAX_ENEMIES - 1) * kiteScaling);

         if (timestamp - this.lastEnemySpawnTime > currentSpawnInterval && this.game.enemies.length < maxEnemies) {
            this.spawnEnemy('RUSHER');
            this.lastEnemySpawnTime = timestamp;
        }
    }
    
    updateDodgeOnly(timestamp, elapsedTime) {
        this.game.score = elapsedTime;
        const timeScaling = Math.min(1, elapsedTime / C.SCALING_DURATION);
        
        const botInterval = C.DODGE_ONLY_BOT_PROJECTILE_INTERVAL_START - (C.DODGE_ONLY_BOT_PROJECTILE_INTERVAL_START - C.DODGE_ONLY_BOT_PROJECTILE_INTERVAL_END) * timeScaling;
        const randomInterval = C.DODGE_ONLY_RANDOM_PROJECTILE_INTERVAL_START - (C.DODGE_ONLY_RANDOM_PROJECTILE_INTERVAL_START - C.DODGE_ONLY_RANDOM_PROJECTILE_INTERVAL_END) * timeScaling;
        const laserInterval = C.DODGE_ONLY_LASER_INTERVAL_START - (C.DODGE_ONLY_LASER_INTERVAL_START - C.DODGE_ONLY_LASER_INTERVAL_END) * timeScaling;
        
        if (timestamp - this.lastBotLikeProjectileTime > botInterval) {
            this.spawnOffscreenProjectile(this.game.player.x, this.game.player.y, 'ENEMY');
            this.lastBotLikeProjectileTime = timestamp;
        }
        if (timestamp - this.lastRandomProjectileTime > randomInterval) {
            this.spawnOffscreenProjectile(Math.random() * this.game.canvas.width, Math.random() * this.game.canvas.height, 'ENVIRONMENT');
            this.lastRandomProjectileTime = timestamp;
        }
        if (timestamp - this.lastLaserSpawnTime > laserInterval) {
            this.spawnLaser(timestamp, 1 + Math.floor(timeScaling * 2.5));
            this.lastLaserSpawnTime = timestamp;
        }
    }
    
    updateKaos(timestamp, elapsedTime) {
        this.game.score = elapsedTime;
        const timeScaling = Math.min(1, elapsedTime / C.SCALING_DURATION);
        const maxTotalEnemies = Math.floor(1 + (C.ABSOLUTE_MAX_ENEMIES - 1) * timeScaling);

        const spawnInterval = C.KAOS_SPAWN_INTERVAL_START - (C.KAOS_SPAWN_INTERVAL_START - C.KAOS_SPAWN_INTERVAL_END) * timeScaling;
        if (timestamp - this.lastEnemySpawnTime > spawnInterval && this.game.enemies.length < maxTotalEnemies) {
            this.spawnEnemy('KAOS_RUSHER');
            this.lastEnemySpawnTime = timestamp;
        }

        const projectileInterval = C.KAOS_RANDOM_PROJECTILE_INTERVAL_START - (C.KAOS_RANDOM_PROJECTILE_INTERVAL_START - C.KAOS_RANDOM_PROJECTILE_INTERVAL_END) * timeScaling;
        if (timestamp - this.lastRandomProjectileTime > projectileInterval) {
             if(Math.random() < 0.5) {
                this.spawnOffscreenProjectile(this.game.player.x, this.game.player.y, 'ENEMY');
             } else {
                this.spawnOffscreenProjectile(Math.random() * this.game.canvas.width, Math.random() * this.game.canvas.height, 'ENVIRONMENT');
             }
             this.lastRandomProjectileTime = timestamp;
        }
        
        const laserInterval = C.KAOS_LASER_INTERVAL_START - (C.KAOS_LASER_INTERVAL_START - C.KAOS_LASER_INTERVAL_END) * timeScaling;
        if (timestamp - this.lastLaserSpawnTime > laserInterval) {
             this.spawnLaser(timestamp, 1 + Math.floor(timeScaling * 2));
             this.lastLaserSpawnTime = timestamp;
        }
    }
    
    // --- YARDIMCI METOTLAR ---

    spawnEnemy(type) {
        const { x, y } = getRandomSpawnPosition(this.game.canvas.width, this.game.canvas.height, C.ENEMY_RADIUS);
        this.game.enemies.push(new Enemy(x, y, type));
    }
    
    findClosestEnemy(maxRange) {
        let closestEnemy = null;
        let minDistance = maxRange;
        this.game.enemies.forEach(e => {
            const dist = Math.hypot(this.game.player.x - e.x, this.game.player.y - e.y);
            if (dist < minDistance) {
                minDistance = dist;
                closestEnemy = e;
            }
        });
        return closestEnemy;
    }

    spawnProjectile(source, target, owner) {
        const isDodgeMode = this.game.currentGameMode === 'DODGE_ONLY' || (owner === 'ENEMY' && this.game.currentGameMode === 'KAOS');
        const speed = isDodgeMode ? C.DODGE_PROJECTILE_SPEED : C.PROJECTILE_SPEED;
        const color = owner === 'ENEMY' ? C.ENEMY_PROJECTILE_COLOR : C.ENV_PROJECTILE_COLOR;
        this.game.projectiles.push(new Projectile(source.x, source.y, target.x, target.y, color, owner, speed));
    }

    spawnOffscreenProjectile(targetX, targetY, owner) {
        const { x, y } = getRandomSpawnPosition(this.game.canvas.width, this.game.canvas.height, C.PROJECTILE_RADIUS);
        this.spawnProjectile({x, y}, {x: targetX, y: targetY}, owner);
    }
    
    // GÜNCELLENMİŞ FONKSİYON
    spawnLaser(timestamp, count) {
    for (let i = 0; i < count; i++) {
       setTimeout(() => {
           if (this.game.isGameOver) return; // Oyun bittiyse yeni lazer yaratma

           // --- OYUNCU İÇİN LAZER YARATMA ---
           if (this.game.player) {
               // Oyuncu için rastgele bir başlangıç noktası bul
               const playerLaserPos = getRandomSpawnPosition(this.game.canvas.width, this.game.canvas.height, 20);
               const playerLaserSoundId = this.game.audioManager.playTrackedSound('laser');
               
               // Oyuncuyu hedef alan lazeri oluştur
               this.game.lasers.push(
                   new Laser(
                       playerLaserPos.x, playerLaserPos.y, 
                       this.game.player.x, this.game.player.y, 
                       timestamp, playerLaserSoundId
                   )
               );
           }

           // --- YANSIMA İÇİN LAZER YARATMA (Sadece Yansıma Arenası'nda) ---
           if (this.game.currentGameMode === 'REFLECTION_BOSS' && this.game.reflection) {
               // Yansıma için TAMAMEN BAĞIMSIZ ve rastgele bir başlangıç noktası bul
               const reflectionLaserPos = getRandomSpawnPosition(this.game.canvas.width, this.game.canvas.height, 20);
               const reflectionLaserSoundId = this.game.audioManager.playTrackedSound('laser');

               // Yansıma'yı hedef alan lazeri oluştur
               this.game.lasers.push(
                   new Laser(
                       reflectionLaserPos.x, reflectionLaserPos.y,
                       this.game.reflection.x, this.game.reflection.y,
                       timestamp, reflectionLaserSoundId
                   )
               );
           }
           
       }, i * 150); // Lazerlerin aynı anda belirmemesi için küçük gecikme
   }
}

    spawnReflection() {
    const canvas = this.game.canvas;
    const player = this.game.player;
    const padding = 100;
    let spawnX;

    if (player.x < canvas.width / 2) {
        spawnX = canvas.width - padding;
    } else {
        spawnX = padding;
    }
    const spawnY = player.y;

    this.game.reflection = new Reflection(spawnX, spawnY, this.game);
}

    updateReflectionArena(timestamp, elapsedTime) {
        // Bu mod, iki şey yapar:
        // 1. Dodge Only modundaki gibi çevresel tehlikeler yaratır.
        const timeScaling = Math.min(1, elapsedTime / C.SCALING_DURATION);
        
        const randomInterval = C.DODGE_ONLY_RANDOM_PROJECTILE_INTERVAL_START - (C.DODGE_ONLY_RANDOM_PROJECTILE_INTERVAL_START - C.DODGE_ONLY_RANDOM_PROJECTILE_INTERVAL_END) * timeScaling;
        if (timestamp - this.lastRandomProjectileTime > randomInterval) {
            this.spawnOffscreenProjectile(Math.random() * this.game.canvas.width, Math.random() * this.game.canvas.height, 'ENVIRONMENT');
            this.lastRandomProjectileTime = timestamp;
        }
        
        const laserInterval = C.DODGE_ONLY_LASER_INTERVAL_START - (C.DODGE_ONLY_LASER_INTERVAL_START - C.DODGE_ONLY_LASER_INTERVAL_END) * timeScaling;
        if (timestamp - this.lastLaserSpawnTime > laserInterval) {
            this.spawnLaser(timestamp, 1 + Math.floor(timeScaling * 2));
            this.lastLaserSpawnTime = timestamp;
        }
        
        // 2. Yansıma'nın kendi AI'ını günceller (başka düşman yaratmaz).
        if (this.game.reflection) {
            this.game.reflection.update(timestamp);
        }
    }

}