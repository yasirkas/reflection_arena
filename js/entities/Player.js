// js/entities/Player.js

import { PLAYER_RADIUS, PLAYER_COLOR, MOVEMENT_SPEED } from '../constants.js';
import { getDistance, getAngle } from '../utils.js';

export default class Player {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = PLAYER_RADIUS;
        this.color = color || PLAYER_COLOR;
        this.target = { x: x, y: y };

        // Hız takibi için değişkenler
        this.velocityX = 0;
        this.velocityY = 0;
    }

    update(keysPressed, stopKey) {
    const lastX = this.x;
    const lastY = this.y;

    const dist = getDistance(this.x, this.y, this.target.x, this.target.y);
    if (!keysPressed[stopKey] && dist > MOVEMENT_SPEED) {
        const angle = getAngle(this.x, this.y, this.target.x, this.target.y);
        this.x += Math.cos(angle) * MOVEMENT_SPEED;
        this.y += Math.sin(angle) * MOVEMENT_SPEED;
    }

    this.velocityX = this.x - lastX;
    this.velocityY = this.y - lastY;
}

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    setTarget(x, y) {
        this.target.x = x;
        this.target.y = y;
    }

    stop() {
        this.target.x = this.x;
        this.target.y = this.y;
    }
}