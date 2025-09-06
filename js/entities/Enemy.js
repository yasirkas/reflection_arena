import { ENEMY_RADIUS, ENEMY_RUSHER_COLOR, ENEMY_SHOOTER_COLOR, MOVEMENT_SPEED, KITE_ENEMY_MIN_DISTANCE } from '../constants.js';
import { getDistance, getAngle } from '../utils.js';

export default class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.radius = ENEMY_RADIUS;
        this.type = type; // 'RUSHER', 'SHOOTER', 'KAOS_RUSHER'
        this.color = this.getColor();
    }

    getColor() {
        switch (this.type) {
            case 'SHOOTER': return ENEMY_SHOOTER_COLOR;
            case 'RUSHER':
            case 'KAOS_RUSHER':
            default: return ENEMY_RUSHER_COLOR;
        }
    }

    update(player) {
        const dist = getDistance(this.x, this.y, player.x, player.y);
        const angle = getAngle(this.x, this.y, player.x, player.y);

        let speed = MOVEMENT_SPEED;
        
        // Farklı düşman tipleri için farklı hareket mantıkları
        if (this.type === 'SHOOTER') {
            // Nişancı düşman, oyuncuya belirli bir mesafede kalmaya çalışır
            if (dist > KITE_ENEMY_MIN_DISTANCE) {
                 this.x += Math.cos(angle) * speed;
                 this.y += Math.sin(angle) * speed;
            }
        } else { // RUSHER ve KAOS_RUSHER
            this.x += Math.cos(angle) * speed;
            this.y += Math.sin(angle) * speed;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}