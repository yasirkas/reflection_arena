import Game from './game/Game.js';
import * as i18n from './i18n.js';
import { initMenuBackground } from './menu-background.js';
import * as firebase from '../firebase.js';

async function initializeApp() {
    
    firebase.triggerInvitationCleanup();
    await i18n.init();

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.dataset.i18n;
            element.textContent = i18n.t(key);
        });
    }

    // "Masaüstü Sitesi İste" tuzağına düşmeyen ve iOS'u da kapsayan, en güvenilir mobil tespit fonksiyonu
    function isMobileDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // 1. En güvenilir yöntem: Tarayıcı kimliğinde mobil anahtar kelimelerini ara
        // (iPhone, iPad, iPod, Android, BlackBerry, IEMobile, Opera Mini vb.)
        if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
            return true;
        }

        // 2. İkinci güvenilir yöntem: Dokunmatik ekran desteği
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            return true;
        }
        
        return false;
    }

    const isMobile = isMobileDevice();
    
    // Cihaz mobilse, <html> etiketine 'mobile' sınıfını ekle.
    if (isMobile) {
        document.documentElement.classList.add('mobile');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const hasInviteToken = urlParams.has('invite');

    if (isMobile && !hasInviteToken) {
        const mobileScreen = document.getElementById('mobile-screen');
        const authScreen = document.getElementById('auth-screen');
        
        if (authScreen) authScreen.style.display = 'none';
        if (mobileScreen) mobileScreen.classList.add('active');
        
        applyTranslations();
        initMenuBackground();
        
        return; 
    }
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = new Game(canvas, ctx);

    window.addEventListener('resize', () => {
        if (document.getElementById('game-area').classList.contains('active')) {
            game.resizeCanvas();
        }
    });
}

window.addEventListener('load', initializeApp);