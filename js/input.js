
export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keysPressed = {};
        this.mousePos = { x: 0, y: 0 };

        // Normal olay dinleyicileri
        window.addEventListener('keydown', e => this.handleKeyDown(e));
        window.addEventListener('keyup', e => this.handleKeyUp(e));
        
        this.game.canvas.addEventListener('mousemove', e => this.handleMouseMove(e));
        this.game.canvas.addEventListener('mousedown', e => this.handleMouseDown(e));

        window.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        // Fare tekerleği ile zoom'u engelle
        window.addEventListener('wheel', e => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    handleKeyDown(e) {
        // Klavyeyle zoom engellemeyi buraya entegre ettik
        if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '0'].includes(e.key)) {
            e.preventDefault();
        }
        
        if (!e.key) return;
        const key = e.key.toLowerCase();
        this.keysPressed[key] = true;

        // ===== DEĞİŞİKLİK BURADA: Sabit yerine dinamik kontrol kullanılıyor =====
        if (key === this.game.controls.stop && this.game.player) {
            this.game.player.stop();
        }

        // ===== DEĞİŞİKLİK BURADA: Sabit yerine dinamik kontrol kullanılıyor =====
        if (key === this.game.controls.fire) {
            this.game.handlePlayerFire();
        }
    }

    handleKeyUp(e) {
        if (!e.key) return;
        const key = e.key.toLowerCase();
        this.keysPressed[key] = false;

        // ===== DEĞİŞİKLİK BURADA: Sabit yerine dinamik kontrol kullanılıyor =====
        if (key === this.game.controls.fire) {
            this.game.canFire = true;
        }
    }

    handleMouseMove(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        // Mouse koordinatlarını ölçekleme mantığı
        this.mousePos.x = (e.clientX - rect.left) * (this.game.canvas.width / rect.width);
        this.mousePos.y = (e.clientY - rect.top) * (this.game.canvas.height / rect.height);
    }

    handleMouseDown(e) {
    if (this.game.isGameOver || this.game.isPaused) return;

    if (e.button === 2 && this.game.player) { // Sağ Tık
        // 'this.keysPressed' dizisini değiştiren satırı sildik.
        
        const rect = this.game.canvas.getBoundingClientRect();
        const targetX = (e.clientX - rect.left) * (this.game.canvas.width / rect.width);
        const targetY = (e.clientY - rect.top) * (this.game.canvas.height / rect.height);
        
        // Hareket edip etmeme kararı, 'S' tuşunun basılı olup olmadığına
        // bağlı olarak Player.update() içinde verilecek.
        this.game.player.setTarget(targetX, targetY);
    }
}

    handleVisibilityChange() {
        if (document.hidden && !this.game.isGameOver && !this.game.isPaused) {
            this.game.pause();
        }
    }
}