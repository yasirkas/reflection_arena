// js/entities/Reflection.js

import { 
    PLAYER_RADIUS, 
    MOVEMENT_SPEED, 
    REFLECTION_FIRE_COOLDOWN, 
    REFLECTION_PROJECTILE_COLOR, 
    PROJECTILE_SPEED,
    MONSTER_IDEAL_DISTANCE, 
    MONSTER_BASE_ACCURACY,
    REFLECTION_COLOR

} from '../constants.js';
import { getAngle, getDistance, clamp } from '../utils.js';
import Projectile from './Projectile.js';

const INTENT = {
    PRESSURE: 'PRESSURE',
    KITE: 'KITE',
    HOLD: 'HOLD'
};

export default class Reflection {
    constructor(x, y, game) {
        this.game = game;
        this.player = game.player;
        this.x = x;
        this.y = y;
        this.radius = PLAYER_RADIUS;
        this.color = REFLECTION_COLOR;
        this.lastFireTime = 0;
        
        // Savaş mesafesi sabit bir değerden geliyor.
        const idealDistance = MONSTER_IDEAL_DISTANCE; // Örn: 275
        this.minDistance = idealDistance * 0.75;
        this.maxDistance = idealDistance * 1.25;
        
        this.target = { x: this.player.x, y: this.player.y };
        
        this.lastDecisionTime = 0;
        this.decisionCooldown = 120; // Karar verme sıklığı

        this.currentIntent = INTENT.HOLD;
        this.lastStrategicDecisionTime = 0;
        this.strategicDecisionCooldown = 1500;

        // İsabet oranı sabit ve yüksek bir değerden geliyor.
        this.baseAccuracy = MONSTER_BASE_ACCURACY; // Örn: 0.9 (Çok isabetli)
        
        this.decideStrategicIntent();

        // Açılış fazı için durum değişkenleri
        this.isOpeningPhase = true;
        this.openingPhaseDuration = 1500; // ms cinsinden (1.5 saniye)
    }


    calculatePredictedPosition() {
        const distanceToPlayer = getDistance(this.x, this.y, this.player.x, this.player.y);
        // Mermi hızı 0 olmasın diye küçük bir kontrol
        const speed = PROJECTILE_SPEED || 1;
        const travelTime = distanceToPlayer / speed;
        // Tahmin faktörü, canavarın ne kadar "zeki" öngörü yapacağını belirler.
        const predictionFactor = 0.95; 
        const predictedX = this.player.x + (this.player.velocityX * travelTime * predictionFactor);
        const predictedY = this.player.y + (this.player.velocityY * travelTime * predictionFactor);
        return { x: predictedX, y: predictedY };
    }

    calculateFocusLevel() {
        const focusVariance = 0.1; // Yüksek isabetli olduğu için sapma payı daha düşük
        const minFocus = Math.max(0, this.baseAccuracy - focusVariance);
        const maxFocus = Math.min(1, this.baseAccuracy + focusVariance);
        return minFocus + Math.random() * (maxFocus - minFocus);
    }
    
    fire() {
        const predictedPos = this.calculatePredictedPosition();
        const focusLevel = this.calculateFocusLevel();
        const finalTargetX = this.player.x + (predictedPos.x - this.player.x) * focusLevel;
        const finalTargetY = this.player.y + (predictedPos.y - this.player.y) * focusLevel;
        
        // İsabet oranını daha tutarlı hale getirmek için mermi dağılımını (spread) azaltıyoruz.
        const spreadAmount = 10; 
        const spreadX = (Math.random() - 0.5) * spreadAmount;
        const spreadY = (Math.random() - 0.5) * spreadAmount;
        
        const projectile = new Projectile(this.x, this.y, finalTargetX + spreadX, finalTargetY + spreadY, REFLECTION_PROJECTILE_COLOR, 'REFLECTION', PROJECTILE_SPEED);
        this.game.projectiles.push(projectile);
        this.game.audioManager.playSound('enemyShoot', { pitch: 0.1 });
    }

    update(timestamp) {
    // Açılış fazını kontrol et ve gerekirse bitir
    if (this.isOpeningPhase && timestamp - this.game.startTime > this.openingPhaseDuration) {
        this.isOpeningPhase = false;
    }

    // GÜNCELLENDİ: Karar verme sıklığını açılış fazında artır
    const currentDecisionCooldown = this.isOpeningPhase ? 30 : 120; // Başlangıçta 4 kat daha hızlı düşünür!
    
    if (timestamp > this.lastDecisionTime + currentDecisionCooldown) {
        this.decideNextMove();
        this.lastDecisionTime = timestamp;
    }
    
    // Stratejik niyetler sadece açılış fazı bittikten sonra devreye girer
    if (!this.isOpeningPhase && timestamp > this.lastStrategicDecisionTime + this.strategicDecisionCooldown) {
        this.decideStrategicIntent();
        this.lastStrategicDecisionTime = timestamp;
    }
    
    this.move();
    this.checkForFire(timestamp);
}

    decideStrategicIntent() {
        const distToPlayer = getDistance(this.x, this.y, this.player.x, this.player.y);
        if (distToPlayer < this.minDistance * 0.9) {
            this.currentIntent = INTENT.KITE;
        } else if (distToPlayer > this.maxDistance * 1.1) {
            this.currentIntent = INTENT.PRESSURE;
        } else {
            this.currentIntent = INTENT.HOLD;
        }
    }

    decideNextMove() {
        const bestVector = this.findBestVector();
        this.target = {
            x: this.x + bestVector.x * 100,
            y: this.y + bestVector.y * 100
        };
    }
    
    findBestVector() {
        let bestVector = { x: 0, y: 0 }; 
        let maxScore = this.calculateScoreAtPoint({ x: this.x, y: this.y });

        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * 2 * Math.PI;
            const vector = { x: Math.cos(angle), y: Math.sin(angle) };
            
            const samplePoint = {
                x: this.x + vector.x * MOVEMENT_SPEED * 15,
                y: this.y + vector.y * MOVEMENT_SPEED * 15
            };

            if (samplePoint.x < 0 || samplePoint.x > this.game.canvas.width || samplePoint.y < 0 || samplePoint.y > this.game.canvas.height) {
                continue;
            }

            const currentScore = this.calculateScoreAtPoint(samplePoint);

            if (currentScore > maxScore) {
                maxScore = currentScore;
                bestVector = vector;
            }
        }
        return bestVector;
    }

    calculateScoreAtPoint(point) {
        const desireScore = this.calculateDesireAtPoint(point);
        const threatScore = this.calculateThreatAtPoint(point);
        return desireScore - threatScore;
    }

    calculateThreatAtPoint(point) {
        let threat = 0;
        const distToPlayerBody = getDistance(point.x, point.y, this.player.x, this.player.y);
        if (distToPlayerBody < this.radius + this.player.radius + 10) {
            threat += 500000;
        }
        this.game.projectiles.forEach(p => {
            if (p.owner === 'PLAYER' || p.owner === 'ENVIRONMENT') {
                const distToPath = this.getDistanceToLineSegment(point, p);
                if (distToPath < this.radius * 2.0) threat += 100000;
                threat += 1500 / (distToPath + 20);
            }
        });
        this.game.lasers.forEach(l => {
            const distToLaser = Math.abs(Math.sin(l.angle - getAngle(l.x, l.y, point.x, point.y)) * getDistance(l.x, l.y, point.x, point.y));
            if (distToLaser < this.radius * 2.0) threat += 200000;
            if (l.state === 'CHARGING') threat += 3000 / (distToLaser + 20);
            else if (l.state === 'FIRING') threat += 50000 / (distToLaser + 5);
        });
        threat += ((1/(point.x+5)) + (1/(this.game.canvas.width-point.x+5)) + (1/(point.y+5)) + (1/(this.game.canvas.height-point.y+5))) * 1000;
        return threat;
    }

    calculateDesireAtPoint(point) {
        let desire = 0;
        const distToPlayer = getDistance(point.x, point.y, this.player.x, this.player.y);
        switch (this.currentIntent) {
            case INTENT.PRESSURE:
                desire -= Math.abs(distToPlayer - this.minDistance);
                break;
            case INTENT.KITE:
                if (distToPlayer > this.maxDistance) desire += 150;
                else desire -= (this.maxDistance - distToPlayer);
                break;
            case INTENT.HOLD:
                if (distToPlayer > this.minDistance && distToPlayer < this.maxDistance) desire += 200;
                else desire -= Math.min(Math.abs(distToPlayer - this.minDistance), Math.abs(distToPlayer - this.maxDistance));
                break;
        }
        if (point.x === this.x && point.y === this.y) {
            desire += 20; 
        }
        return desire;
    }

    getDistanceToLineSegment(point, projectile) {
        const p = point;
        const v = { x: projectile.x, y: projectile.y };
        const w = { x: projectile.x + projectile.velocity.x * 20, y: projectile.y + projectile.velocity.y * 20 };
        const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
        if (l2 === 0) return getDistance(p.x, p.y, v.x, v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projection = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
        return getDistance(p.x, p.y, projection.x, projection.y);
    }
    
    move() {
        const padding = this.radius;
        if (!this.target) return;
        this.target.x = clamp(this.target.x, padding, this.game.canvas.width - padding);
        this.target.y = clamp(this.target.y, padding, this.game.canvas.height - padding);
        const dist = getDistance(this.x, this.y, this.target.x, this.target.y);
        if (dist > MOVEMENT_SPEED) {
            const angle = getAngle(this.x, this.y, this.target.x, this.target.y);
            this.x += Math.cos(angle) * MOVEMENT_SPEED;
            this.y += Math.sin(angle) * MOVEMENT_SPEED;
        }
    }
    
    checkForFire(timestamp) {
        // Açılış fazındaysa ateş etme
        if (this.isOpeningPhase) return;
        const dist = getDistance(this.x, this.y, this.player.x, this.player.y);
        if (dist <= this.maxDistance * 1.2) {
            if (timestamp > this.lastFireTime + REFLECTION_FIRE_COOLDOWN) {
                this.fire();
                this.lastFireTime = timestamp;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}