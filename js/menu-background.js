// js/menu-background.js

class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = `rgba(224, 224, 224, ${Math.random() * 0.5 + 0.1})`;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > this.canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > this.canvas.height) this.speedY *= -1;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

let particles = [];
let animationFrameId;

function animate(canvas, ctx) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });
    animationFrameId = requestAnimationFrame(() => animate(canvas, ctx));
}

export function initMenuBackground() {
    const canvas = document.getElementById('menu-background-canvas');
    if (!canvas) return;
    
    canvas.style.display = 'block'; // Animasyon başladığında canvas'ı görünür yap

    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle(canvas));
    }
    
    if(animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animate(canvas, ctx);

    window.addEventListener('resize', () => {
        if(canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    });
}

export function stopMenuBackground() {
    const canvas = document.getElementById('menu-background-canvas');
    if(canvas) canvas.style.display = 'none'; // Animasyon durduğunda canvas'ı gizle

    if(animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}