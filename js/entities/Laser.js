// js/entities/Laser.js

import { LASER_CHARGE_DURATION, LASER_FIRE_DURATION, LASER_CHARGE_COLOR, LASER_FIRE_COLOR, LASER_SHADOW_COLOR, LASER_WARNING_WIDTH, LASER_BEAM_WIDTH, PLAYER_RADIUS } from '../constants.js';
import { getAngle, getDistance } from '../utils.js';

export default class Laser {
    constructor(x, y, targetX, targetY, startTime, soundId) {
        this.x = x;
        this.y = y;
        this.angle = getAngle(x, y, targetX, targetY);
        this.state = 'CHARGING';
        this.startTime = startTime;
        this.soundId = soundId; // YENİ: Sesin ID'sini sakla
    }

    update(timestamp) {
        const elapsedTime = timestamp - this.startTime;
        if (this.state === 'CHARGING' && elapsedTime > LASER_CHARGE_DURATION) {
            this.state = 'FIRING';
            this.startTime = timestamp; 
        }
    }

    draw(ctx) {
        const endX = this.x + Math.cos(this.angle) * 3000;
        const endY = this.y + Math.sin(this.angle) * 3000;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        
        if (this.state === 'CHARGING') {
            ctx.strokeStyle = LASER_CHARGE_COLOR;
            ctx.lineWidth = LASER_WARNING_WIDTH;
        } else if (this.state === 'FIRING') {
            ctx.strokeStyle = LASER_FIRE_COLOR;
            ctx.lineWidth = LASER_BEAM_WIDTH;
            ctx.shadowColor = LASER_SHADOW_COLOR;
            ctx.shadowBlur = 25;
        }
        
        ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    isFinished(timestamp) {
        return this.state === 'FIRING' && (timestamp - this.startTime > LASER_FIRE_DURATION);
    }

    checkCollision(player) {
        if (this.state !== 'FIRING') return false;
        
        const dist = Math.abs(
            Math.sin(this.angle - getAngle(this.x, this.y, player.x, player.y)) * 
            getDistance(this.x, this.y, player.x, player.y)
        );

        return dist < player.radius + LASER_BEAM_WIDTH / 2;
    }
}