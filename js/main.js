import Game from './game/Game.js';
// Çeviri, menü arka planı ve Firebase sistemlerini doğrudan main.js'e import ediyoruz
import * as i18n from './i18n.js';
import { initMenuBackground } from './menu-background.js';
import * as firebase from '../firebase.js';

async function initializeApp() {
    
    // 1. ADIM: Arka planda, beklemeden temizliği tetikle.
    // Bu, uygulamanın geri kalanının yüklenmesini veya çalışmasını engellemez.
    firebase.triggerInvitationCleanup();

    // 2. ADIM: Her şeyden önce çeviri sistemini başlat
    await i18n.init();

    // 3. ADIM: Çevirileri uygulayacak bir fonksiyon tanımla
    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.dataset.i18n;
            element.textContent = i18n.t(key);
        });
        // Diğer çeviriler de buraya eklenebilir.
    }

    // 4. ADIM: Ekran genişliğini kontrol et
    const MOBILE_BREAKPOINT = 768;
    if (window.innerWidth < MOBILE_BREAKPOINT) {
        // EĞER EKRAN DARSA (MOBİLSE):
        
        const mobileScreen = document.getElementById('mobile-screen');
        const authScreen = document.getElementById('auth-screen');
        
        if (authScreen) authScreen.style.display = 'none';
        if (mobileScreen) mobileScreen.classList.add('active');
        
        // Çevirileri mobil ekran için uygula
        applyTranslations();
        
        // Arka plan animasyonunu başlat
        initMenuBackground();
        
        // Oyun motorunu yüklemeden fonksiyonu bitir.
        return; 
    }

    // 5. ADIM: EĞER EKRAN GENİŞSE (MASAÜSTÜYSE):
    // Normal oyun yükleme sürecini başlat.
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const game = new Game(canvas, ctx);

    window.addEventListener('resize', () => {
        if (document.getElementById('game-area').classList.contains('active')) {
            game.resizeCanvas();
        }
    });
}

// Sayfa tamamen yüklendiğinde uygulamayı başlat.
window.addEventListener('load', initializeApp);