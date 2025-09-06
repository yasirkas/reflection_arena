import { PROJECTILE_RADIUS } from '../constants.js';
import { getAngle } from '../utils.js';

export default class Projectile {
    constructor(startX, startY, targetX, targetY, color, owner, speed) {
        this.x = startX;
        this.y = startY;
        this.radius = PROJECTILE_RADIUS;
        this.color = color;
        this.owner = owner; // 'PLAYER', 'ENEMY', 'ENVIRONMENT'

        const angle = getAngle(startX, startY, targetX, targetY);
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}