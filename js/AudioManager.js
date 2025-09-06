export class AudioManager {
    constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sounds = {};
    this.musicBuffers = {};

    const savedVolume = localStorage.getItem('reflectionArenaVolume');
    const initialVolume = savedVolume !== null ? parseFloat(savedVolume) : 0.35;

    // --- SES KONTROL DÜĞÜMLERİ ---
    // 1. Her şeyin sonunda bağlandığı ana vana
    this.masterGain = this.audioContext.createGain();
    
    // 2. Kendi türlerine özel ara vanalar
    this.musicGain = this.audioContext.createGain();
    this.shootGain = this.audioContext.createGain();
    this.hitGain = this.audioContext.createGain();
    this.laserGain = this.audioContext.createGain();
    this.enemyShootGain = this.audioContext.createGain();
    this.clickGain = this.audioContext.createGain();
    this.gameOverGain = this.audioContext.createGain();
    
    this.hitEQ = this.audioContext.createBiquadFilter();

    // --- DOĞRU DÜĞÜM BAĞLANTILARI ---
    // Ara vanaları ana vanaya (masterGain) bağlıyoruz
    this.musicGain.connect(this.masterGain);
    this.shootGain.connect(this.masterGain);
    this.hitGain.connect(this.masterGain);
    this.laserGain.connect(this.masterGain);
    this.enemyShootGain.connect(this.masterGain);
    this.clickGain.connect(this.masterGain);
    this.gameOverGain.connect(this.masterGain);
    
    // Ana vanayı hoparlörlere bağlıyoruz
    this.masterGain.connect(this.audioContext.destination);

    // Hit sesini özel olarak önce EQ'dan geçirip kendi vanasına bağlıyoruz
    this.hitEQ.connect(this.hitGain);
    
    // ===== SES SEVİYESİ AYAR MERKEZİ (Bireysel Ayarlar) =====
    // Bu değerler, seslerin BİRBİRLERİNE GÖRE olan dengesini ayarlar.
    this.musicGain.gain.value = 0.6;          // Müzik
    this.shootGain.gain.value = 0.4;          // Oyuncu ateş sesi
    this.hitGain.gain.value = 0.8;          // Vuruş sesi
    this.laserGain.gain.value = 0.3;          // Lazer sesi (en kısık)
    this.enemyShootGain.gain.value = 0.35;    // Düşman ateş sesi
    this.clickGain.gain.value = 0.5;          // Arayüz tıklama sesi
    this.gameOverGain.gain.value = 0.7;       // Oyun bitti sesi
    // ==========================================================

    // --- DURUM DEĞİŞKENLERİ ---
    this.activeMusicSource = null;
    this.activeMusicName = null;
    this.activeSfx = new Map();
    this.nextSfxId = 0;
    this.musicStartTime = 0;
    this.musicPauseOffset = 0;
    
    // Ana ses seviyesini ayarla (Bu, masterGain'i kontrol eder)
    this.setMasterVolume(initialVolume);

    // Hit EQ başlangıç ayarları
    this.hitEQ.type = 'peaking';
    this.hitEQ.frequency.value = 3500;
    this.hitEQ.gain.value = 7;
    this.hitEQ.Q.value = 1.5;

    // --- SESLERİ YÜKLE ---
    this.loadSound('shoot', '../../assets/audio/shoot.mp3');
    this.loadSound('hit', '../../assets/audio/hit.mp3');
    this.loadSound('gameOver', '../../assets/audio/game-over.mp3');
    this.loadSound('click', '../../assets/audio/ui-click.mp3');
    this.loadSound('laser', '../../assets/audio/laser.mp3');
    this.loadSound('enemyShoot', '../../assets/audio/enemy-shoot.mp3');
    this.loadMusic('menu', '../../assets/audio/menu-music.mp3');
    this.loadMusic('gameplay', '../../assets/audio/gameplay-music.mp3');
    this.loadMusic('paradox', '../../assets/audio/paradox-music.mp3');
}

    setMasterVolume(volume) {
    const newVolume = parseFloat(volume);
    if (isNaN(newVolume)) return;

    this.masterGain.gain.setTargetAtTime(newVolume, this.audioContext.currentTime, 0.01);
    localStorage.setItem('reflectionArenaVolume', newVolume.toString());
}

    unlockAudio() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    async loadSound(name, path) {
        try {
            const response = await fetch(path);
            const arrayBuffer = await response.arrayBuffer();
            this.sounds[name] = await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (e) { console.error(`Ses yüklenemedi: ${name}`, e); }
    }

    async loadMusic(name, path) {
        try {
            const response = await fetch(path);
            const arrayBuffer = await response.arrayBuffer();
            this.musicBuffers[name] = await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (e) { console.error(`Müzik yüklenemedi: ${name}`, e); }
    }
    
    isMusicPlaying(name) {
        return this.activeMusicName === name && this.activeMusicSource;
    }

    playMusic(name, { loop = true, offset = 0 } = {}) {
    this.unlockAudio();
    if (this.activeMusicSource) {
        this.activeMusicSource.stop(0);
    }

    if (!this.musicBuffers[name]) return;
    

    this.activeMusicSource = this.audioContext.createBufferSource();
    this.activeMusicSource.buffer = this.musicBuffers[name];
    this.activeMusicSource.loop = loop;
    
    // Müzik kaynağını DOĞRUDAN (ve doğru ses seviyesine sahip olan) musicGain'e bağla.
    this.activeMusicSource.connect(this.musicGain);
    
    const effectiveOffset = offset % this.activeMusicSource.buffer.duration;
    this.activeMusicSource.start(0, effectiveOffset);
    
    this.activeMusicName = name;
    this.musicStartTime = this.audioContext.currentTime - effectiveOffset;
}

    stopMusic() {
        if (this.activeMusicSource) {
            this.activeMusicSource.stop(0);
            this.activeMusicSource.disconnect();
            this.activeMusicSource = null;
            this.activeMusicName = null;
            this.musicPauseOffset = 0;
        }
    }

    playSound(name, options = {}) {
    this.unlockAudio();
    if (!this.sounds[name]) return;
    
    const source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[name];

    if (options.pitch) {
        source.playbackRate.value = 1.0 + (Math.random() - 0.5) * options.pitch;
    }

    // HANGİ SES, HANGİ VANAYA GİDECEK?
    switch (name) {
        case 'shoot':
            source.connect(this.shootGain);
            break;
        case 'hit':
            source.connect(this.hitEQ); // Hit sesi özel olarak önce EQ'ya gider
            break;
        case 'enemyShoot':
            source.connect(this.enemyShootGain);
            break;
        case 'click':
            source.connect(this.clickGain);
            break;
        case 'gameOver':
            source.connect(this.gameOverGain);
            break;
        default:
            // Eğer listede olmayan bir ses varsa, doğrudan master'a gitsin (veya bir defaultGain oluşturulabilir)
            source.connect(this.masterGain); 
            break;
    }

    source.start(0);
}
    
    playTrackedSound(name, loop = false) {
    this.unlockAudio();
    if (!this.sounds[name]) return null;

    const source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[name];
    source.loop = loop;

    // ===== DOĞRU YÖNLENDİRME MANTIĞI =====
    // Tıpkı playSound'daki gibi, her sesi kendi özel vanasına yönlendir.
    switch (name) {
        case 'laser':
            source.connect(this.laserGain);
            break;
        case 'shoot':
            source.connect(this.shootGain);
            break;
        case 'hit':
            source.connect(this.hitEQ);
            break;
        case 'enemyShoot':
            source.connect(this.enemyShootGain);
            break;
        case 'click':
            source.connect(this.clickGain);
            break;
        case 'gameOver':
            source.connect(this.gameOverGain);
            break;
        default:
            // Eğer gelecekte bu listeye dahil olmayan yeni bir 'tracked sound' eklersek,
            // bir sigorta olarak onu en azından masterGain'e bağlayalım.
            // Ama ideal olan, her yeni ses için buraya bir 'case' eklemektir.
            source.connect(this.masterGain);
            break;
    }
    // ===================================
    
    source.start(0);

    const id = this.nextSfxId++;
    this.activeSfx.set(id, source);

    source.onended = () => {
        this.activeSfx.delete(id);
    };

    return id;
}

    stopTrackedSound(id) {
        if (this.activeSfx.has(id)) {
            const source = this.activeSfx.get(id);
            try { source.stop(0); source.disconnect(); } catch(e) {}
            this.activeSfx.delete(id);
        }
    }
    
    stopAllSfx() {
        this.activeSfx.forEach(source => {
            try { source.stop(0); source.disconnect(); } catch(e) {}
        });
        this.activeSfx.clear();
    }
    
    duckMusic(duration = 0.5, duckTo = 0.2) {
        if (!this.activeMusicSource) return;
        const targetVolume = (this.activeMusicName === 'menu') ? 0.6 : 1.0;
        const now = this.audioContext.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setTargetAtTime(targetVolume * duckTo, now, 0.05);
        this.musicGain.gain.setTargetAtTime(targetVolume, now + duration, 0.1);
    }
    
    makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i ) {
            const x = i * 2 / n_samples - 1;
            curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
        }
        return curve;
    }

    pauseGameplayAudio() {
    // YENİ KONTROL: Eğer çalan müzik menü müziği DEĞİLSE ve bir kaynak varsa...
    if (this.activeMusicName !== 'menu' && this.activeMusicSource) {
        this.musicPauseOffset = (this.audioContext.currentTime - this.musicStartTime) % this.activeMusicSource.buffer.duration;
        this.activeMusicSource.stop(0);
        this.activeMusicSource = null;
    }
    this.stopAllSfx();
}

    resumeGameplayAudio() {
    this.unlockAudio();
    if (this.activeMusicName && this.activeMusicName !== 'menu') {
        this.playMusic(this.activeMusicName, { offset: this.musicPauseOffset });
    }
}
    
}