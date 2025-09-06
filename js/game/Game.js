import * as firebase from '../../firebase.js';
import Player from '../entities/Player.js';
import Projectile from '../entities/Projectile.js';
import ModeManager from './ModeManager.js';
import { UI } from '../ui.js';
import { InputHandler } from '../input.js';
import { AudioManager } from '../AudioManager.js';
import { getDistance } from '../utils.js';
import * as C from '../constants.js';

export default class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        this.audioManager = new AudioManager(); 
        this.input = new InputHandler(this); 
        this.ui = new UI(this);

        this.modeManager = new ModeManager(this);
        this.animationFrameId = null;
        this.userProfile = null;
        this.reset();
    }
    
    reset() {
        this.player = null;
        this.reflection = null;
        this.projectiles = [];
        this.enemies = [];
        this.lasers = [];
        this.score = 0;
        this.startTime = 0;
        this.lastTimestamp = 0;
        this.isGameOver = false;
        this.victory = false;
        this.isPaused = false;
        this.lastFireTime = 0;
        this.canFire = true;
        this.canClickRestart = false;
        this.currentGameMode = null;
        this.personalBests = {};
        this.controls = { fire: 'q', stop: 's' };
        
    }

    start(mode, userProfile) {
    this.ui.removeUnlockListeners();
    this.reset();
    this.isGameOver = false;
    this.currentGameMode = mode;
    this.userProfile = userProfile;

    // KONTROL YÜKLEME MANTIĞI =====
    // Eğer kullanıcı profili varsa ve içinde kontrol ayarları kayıtlıysa,
    // oyunun kontrollerini bu ayarlarla güncelle.
    if (this.userProfile && this.userProfile.controls) {
        this.controls = this.userProfile.controls;
    }    

    // Rekorları arka planda, oyunu bekletmeden çekiyoruz.
    if (this.userProfile) {
        firebase.getUserHighScores(this.userProfile.uid)
            .then(scores => {
                // Veritabanından cevap geldiğinde, oyun zaten çalışıyor olacak.
                // Gelen skorları sessizce ilgili değişkene atıyoruz.
                this.personalBests = scores;
            })
            .catch(e => {
                // Bir hata olursa, konsola yazdırıp rekorları boş bırakıyoruz.
                console.error("Kişisel rekorlar arka planda çekilirken bir hata oluştu:", e);
                this.personalBests = {};
            });
    }
    
    // Bu kodlar artık veritabanını BEKLEMEZ ve anında çalışır.
    this.resizeCanvas();
    this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, this.userProfile?.playerColor);
    this.startTime = performance.now();
    this.lastFireTime = 0;
    this.modeManager.reset(this.startTime);

    if (this.currentGameMode === 'REFLECTION_BOSS') {
        this.modeManager.spawnReflection();
    }

    this.ui.updateScoreDisplay(this.score, this.currentGameMode, 0);

    if (this.currentGameMode === 'REFLECTION_BOSS') {
        // Eğer mod Paradox ise, yeni müziği çal
        this.audioManager.playMusic('paradox');
    } else {
        // Diğer tüm modlar için standart oyun müziğini çal
        this.audioManager.playMusic('gameplay');
    }

    if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
    }

    this.gameLoop(this.startTime);
}
    
    gameLoop(timestamp) {
        if (this.isGameOver) { this.endGame(); return; }
        if (this.isPaused) return;
        this.lastTimestamp = timestamp;
        const elapsedTime = (timestamp - this.startTime) / 1000;
        this.update(timestamp, elapsedTime);
        this.draw();
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(timestamp, elapsedTime) {
        if (this.player) {
            this.player.update(this.input.keysPressed, this.controls.stop);
        }
        this.modeManager.update(timestamp, elapsedTime);
        this.projectiles.forEach(p => p.update());
        this.lasers.forEach(l => l.update(timestamp));
        this.handleCollisions();
        this.cleanupEntities();

        if (this.currentGameMode === 'DODGE_ONLY' || this.currentGameMode === 'KAOS' || this.currentGameMode === 'REFLECTION_BOSS') {
            this.ui.updateScoreDisplay(this.score, this.currentGameMode, elapsedTime);
        }

    }


    handleCollisions() {
    // 1. Oyuncunun mermileri düşmanlarla veya Paradox ile çarpışıyor mu?
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        if (!p) continue;

        // a) OYUNCU mermileri için hedefler
        if (p.owner === 'PLAYER') {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (getDistance(p.x, p.y, e.x, e.y) < p.radius + e.radius) {
                    // Bu blok, bir düşmanın öldüğü yerdir
                    this.enemies.splice(j, 1);
                    this.projectiles.splice(i, 1);
                    this.audioManager.playSound('hit');
                    this.score++;
                    this.ui.updateScoreDisplay(this.score, this.currentGameMode);
                    
                    // Bir düşmanı öldürdüğün anda, ateş etme bekleme süresini sıfırla.
                    this.lastFireTime = 0; 
                    
                    break;
                }
            }
            if (!this.projectiles[i]) continue;

            if (this.reflection && getDistance(p.x, p.y, this.reflection.x, this.reflection.y) < p.radius + this.reflection.radius) {
                this.isGameOver = true;
                this.victory = true;
                this.projectiles.splice(i, 1);
            }
            if (!this.projectiles[i]) continue;
        }

        // b) DİĞER mermiler için hedefler
        if (p.owner === 'ENEMY' || p.owner === 'ENVIRONMENT' || p.owner === 'REFLECTION') {
            if (this.player && getDistance(p.x, p.y, this.player.x, this.player.y) < p.radius + this.player.radius) {
                this.isGameOver = true;
                this.projectiles.splice(i, 1);
            }
            if (!this.projectiles[i]) continue;
        }

        // c) ÇEVRE mermileri Paradox ile
        if (p.owner === 'ENVIRONMENT') {
            if (this.reflection && getDistance(p.x, p.y, this.reflection.x, this.reflection.y) < p.radius + this.reflection.radius) {
                this.isGameOver = true;
                this.victory = true;
                this.projectiles.splice(i, 1);
            }
            if (!this.projectiles[i]) continue;
        }
    }
    
    // 2. Normal düşmanlar oyuncuyla temas ediyor mu?
    this.enemies.forEach(e => {
        if (this.player && getDistance(e.x, e.y, this.player.x, this.player.y) < e.radius + this.player.radius) {
            this.isGameOver = true;
        }
    });

    // 3. Lazerler oyuncu veya Paradox ile çarpışıyor mu?
    this.lasers.forEach(l => {
        if (this.player && l.checkCollision(this.player)) {
            this.isGameOver = true;
        }
        if (this.reflection && l.checkCollision(this.reflection)) {
            this.isGameOver = true;
            this.victory = true;
        }
    });

    // 4. Paradox oyuncuyla fiziksel olarak temas ediyor mu?
    if (this.reflection && this.player && getDistance(this.reflection.x, this.reflection.y, this.player.x, this.player.y) < this.reflection.radius + this.player.radius) {
        this.isGameOver = true;
    }
}

    cleanupEntities() {
        const buffer = C.PROJECTILE_BUFFER;
        this.projectiles = this.projectiles.filter(p => p.x > -buffer && p.x < this.canvas.width + buffer && p.y > -buffer && p.y < this.canvas.height + buffer);
        
        this.lasers.forEach(laser => {
            if (laser.isFinished(this.lastTimestamp)) {
                this.audioManager.stopTrackedSound(laser.soundId);
            }
        });
        this.lasers = this.lasers.filter(l => !l.isFinished(this.lastTimestamp));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.lasers.forEach(l => l.draw(this.ctx));

        if (this.reflection) {
            this.reflection.draw(this.ctx);
        }
        
        if (this.player) {
            this.player.draw(this.ctx);
        }
    }

    endGame() {
    if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; }
    this.audioManager.stopMusic();
    this.audioManager.stopAllSfx();
    this.audioManager.playSound('gameOver');

    const elapsedTime = (this.lastTimestamp - this.startTime) / 1000;
    let pointsToAdd = 0;
    let scoreDetails = {};

    const finalScore = (this.currentGameMode === 'KAOS' || this.currentGameMode === 'DODGE_ONLY')
                       ? elapsedTime
                       : this.score;

    // ===== YENİ: ANTI-HİLE SAĞDUYU KONTROLÜ =====
    let isScoreValid = true;
    if (elapsedTime > 1) { // Çok kısa oyunları kontrol etmeye gerek yok
        const maxScorePerSecond = {
            // Saniyede 2 düşman öldürmek bile çok zor. Cömert bir sınır koyalım.
            'SKILL_DODGE': 6, 
            'KITE_ONLY': 6,
            // Zaman bazlı modlarda skorun saniyeye oranı 1 olmalı. Küçük bir pay bırakalım.
            'KAOS': 1.1,
            'DODGE_ONLY': 1.1 
        };

        if (maxScorePerSecond[this.currentGameMode]) {
            const scoreRate = finalScore / elapsedTime;
            if (scoreRate > maxScorePerSecond[this.currentGameMode]) {
                console.warn(`[Anti-Hile] Geçersiz skor tespit edildi! Oran: ${scoreRate.toFixed(2)}, Mod: ${this.currentGameMode}`);
                isScoreValid = false;
            }
        }
    }

    let isNewRecord = false;
    let oldBestScore = null;
    const currentModeKey = this.currentGameMode === 'REFLECTION_BOSS' 
        ? (this.victory ? 'REFLECTION_VICTORIES' : 'REFLECTION_SURVIVALS') 
        : this.currentGameMode;
    const previousBest = this.personalBests[currentModeKey];

    if (this.userProfile && isScoreValid) { // Sadece skor geçerliyse rekoru kontrol et
        const currentScoreForRecord = (this.currentGameMode === 'REFLECTION_BOSS')
            ? parseFloat(elapsedTime.toFixed(2))
            : finalScore;

        if (previousBest !== undefined) {
            oldBestScore = previousBest;
            const isVictoryMode = currentModeKey === 'REFLECTION_VICTORIES';
            if (isVictoryMode) {
                if (currentScoreForRecord < previousBest) isNewRecord = true;
            } else {
                if (currentScoreForRecord > previousBest) isNewRecord = true;
            }
        } else if (currentScoreForRecord > 0) {
            isNewRecord = true;
            oldBestScore = null;
        }
    }

    if (this.currentGameMode === 'REFLECTION_BOSS') {
        const finalTimeToSave = parseFloat(elapsedTime.toFixed(2));
        scoreDetails = { finalTime: finalTimeToSave };

        if (this.userProfile) { // Paradox için hile kontrolü yapmıyoruz
            if (this.victory) {
                firebase.saveHighScore(this.currentGameMode, finalTimeToSave, this.userProfile, 'victory');
            } else {
                firebase.saveHighScore(this.currentGameMode, finalTimeToSave, this.userProfile, 'survival');
            }
        }
    } else {
        // SADECE SKOR GEÇERLİYSE KAYDET
        if (this.userProfile && isScoreValid) {
            firebase.saveHighScore(this.currentGameMode, finalScore, this.userProfile);
        }
        
        const currentEchoes = this.userProfile ? (this.userProfile.reflectionScore || 0) : 0;
        if (currentEchoes < 1000 && isScoreValid) { // Sadece skor geçerliyse yankı ekle
            let calculatedPoints = 0;
            switch (this.currentGameMode) {
                case 'KAOS':
                    calculatedPoints = Math.floor(elapsedTime * 1.5); 
                    break;
                case 'SKILL_DODGE': 
                    calculatedPoints = Math.floor(finalScore * 5); 
                    break;
                case 'KITE_ONLY': 
                    calculatedPoints = Math.floor(finalScore * 3); 
                    break;
                case 'DODGE_ONLY':
                    calculatedPoints = Math.floor(elapsedTime / 2); 
                    break;
            }
            const pointsThatCanBeAdded = 1000 - currentEchoes;
            pointsToAdd = Math.min(calculatedPoints, pointsThatCanBeAdded);
        }
    }

    if (pointsToAdd > 0) {
        this.ui.addReflectionScore(pointsToAdd);
    }
    
    // Eğer skor geçersizse, rekor kırılmış gibi gösterme
    this.ui.showGameOver(finalScore, this.currentGameMode, this.userProfile, pointsToAdd, this.victory, scoreDetails, (isNewRecord && isScoreValid), oldBestScore);
    setTimeout(() => { this.canClickRestart = true; }, 1000);
}
    
    pause() {
        if (this.isGameOver || this.isPaused) return;
        this.isPaused = true;
        
        this.audioManager.pauseGameplayAudio(); 
        
        cancelAnimationFrame(this.animationFrameId);
        this.ui.showPauseScreen(true);
    }
    
    resume() {
    if (this.isGameOver || !this.isPaused) return;
    
    this.ui.startResumeCountdown(() => {
        this.isPaused = false;
        const pauseDuration = performance.now() - this.lastTimestamp;

        // 1. Oyunun genel zamanlayıcılarını güncelle.
        this.startTime += pauseDuration;
        this.lastFireTime += pauseDuration; // Oyuncunun ateş etme zamanlayıcısı

        // 2. ModeManager'a kendi zamanlayıcılarını güncellemesini söyle.
        this.modeManager.adjustTimersForPause(pauseDuration);

        // 3. Paradox'un zamanlayıcılarını güncelle (eğer oyundaysa).
        if(this.reflection) {
            this.reflection.lastFireTime += pauseDuration;
            this.reflection.lastDecisionTime += pauseDuration;
            this.reflection.lastStrategicDecisionTime += pauseDuration;
        }

        // 4. Sesleri ve oyun döngüsünü devam ettir.
        this.audioManager.resumeGameplayAudio();
        requestAnimationFrame(this.gameLoop.bind(this));
    });
}

    handlePlayerFire() {
        if (this.isPaused || this.isGameOver || !this.canFire) return;
        if (this.currentGameMode === 'DODGE_ONLY') return;

        
        const now = performance.now();
        if (now - this.lastFireTime > C.PLAYER_FIRE_COOLDOWN) {
        const projectileColor = this.userProfile?.projectileColor || C.PLAYER_PROJECTILE_COLOR;
        this.projectiles.push(new Projectile(
            this.player.x, this.player.y,
            this.input.mousePos.x, this.input.mousePos.y,
            projectileColor, 'PLAYER', C.PROJECTILE_SPEED
        ));
            this.lastFireTime = now;
            this.canFire = false;
            this.audioManager.playSound('shoot');
        }
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}