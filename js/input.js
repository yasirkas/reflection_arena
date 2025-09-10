// Artık sabit tuşları constants.js'den import etmiyoruz.

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

        // ===== YENİ VE GÜVENİLİR ODAK KONTROLÜ =====
        // Hem sekme değişikliğini ('visibilitychange') hem de pencere odak kaybını ('blur') dinle.
        // Her ikisi de aynı, tek bir fonksiyonu tetikleyecek.
        document.addEventListener('visibilitychange', () => this.handleFocusChange());
        window.addEventListener('blur', () => this.handleFocusChange());
        // ===========================================

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

        if (key === this.game.controls.stop && this.game.player) {
            this.game.player.stop();
        }

        if (key === this.game.controls.fire) {
            this.game.handlePlayerFire();
        }
    }

    handleKeyUp(e) {
        if (!e.key) return;
        const key = e.key.toLowerCase();
        this.keysPressed[key] = false;

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

    // 1. Oyuncunun hareket için hangi tuşu seçtiğini öğren ('left' veya 'right')
    // Varsayılan olarak 'right' kabul edelim.
    const moveMouseButtonValue = this.game.controls.move || 'right';
    const moveMouseButtonCode = moveMouseButtonValue === 'left' ? 0 : 2; // Sol tık = 0, Sağ tık = 2

    // 2. Sadece oyuncunun seçtiği tuşa basıldıysa devam et
    if (e.button === moveMouseButtonCode && this.game.player) {
        
        const rect = this.game.canvas.getBoundingClientRect();
        const targetX = (e.clientX - rect.left) * (this.game.canvas.width / rect.width);
        const targetY = (e.clientY - rect.top) * (this.game.canvas.height / rect.height);
        
        this.game.player.setTarget(targetX, targetY);
    }
}

    // ===== YENİ, BİRLEŞTİRİLMİŞ FONKSİYON =====
    // handleVisibilityChange'in yerini aldı.
    handleFocusChange() {
        // Duraklatma koşulu: Sayfa gizli VEYA pencere odakta değilse.
        const shouldPause = document.hidden || !document.hasFocus();

        // Eğer duraklatma gerekiyorsa ve oyun zaten bitmemiş veya duraklatılmamışsa...
        if (shouldPause && !this.game.isGameOver && !this.game.isPaused) {
            this.game.pause();
        }
    }
}