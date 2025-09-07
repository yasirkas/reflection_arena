import Game from './game/Game.js';
// Çeviri, menü arka planı ve Firebase sistemlerini doğrudan main.js'e import ediyoruz
import * as i18n from './i18n.js';
import { initMenuBackground } from './menu-background.js';
import * as firebase from '../firebase.js';

async function initializeApp() {
    
    // 1. ADIM: Arka planda, beklemeden temizliği tetikle.
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

    // 4. ADIM: URL'yi ve ekran genişliğini kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const hasInviteToken = urlParams.has('invite');
    const MOBILE_BREAKPOINT = 768;
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

    // 5. ADIM: Duruma göre karar ver
    if (isMobile && !hasInviteToken) {
        // DURUM A: Cihaz mobil VE davet linki YOK.
        // Sadece mobil karşılama ekranını göster.
        
        const mobileScreen = document.getElementById('mobile-screen');
        const authScreen = document.getElementById('auth-screen');
        
        if (authScreen) authScreen.style.display = 'none';
        if (mobileScreen) mobileScreen.classList.add('active');
        
        // Gerekli çevirileri ve arka planı yükle
        applyTranslations();
        initMenuBackground();
        
        // Uygulamanın geri kalanını (oyun motoru vb.) yüklemeden çık.
        return; 
    }

    // DURUM B ve C: Cihaz masaüstü VEYA bir davet linki var.
    // Bu durumlarda, oyunun tam sürümünü yüklememiz gerekiyor, çünkü davet linki
    // hem mobilde (tek sütun) hem de masaüstünde (çift sütun) ui.js tarafından yönetilir.
    
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