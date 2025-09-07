import * as firebase from '../firebase.js';
import * as i18n from './i18n.js';
import { initMenuBackground, stopMenuBackground } from './menu-background.js';
import { PLAYER_COLOR, PLAYER_PROJECTILE_COLOR } from './constants.js';

const MODE_ICONS = {
    'SKILL_DODGE': 'assets/icons/skill-dodge.png',
    'KITE_ONLY': 'assets/icons/kite-only.png',
    'DODGE_ONLY': 'assets/icons/dodge-only.png',
    'KAOS': 'assets/icons/kaos.png',
    'REFLECTION_BOSS': 'assets/icons/reflection-arena.png',
    'REFLECTION_VICTORIES': 'assets/icons/reflection-fastest-victory.png', // Zafer için ana boss ikonu kalabilir
    'REFLECTION_SURVIVALS': 'assets/icons/reflection-longest-survival.png'      // Direniş için "kaçınma/hayatta kalma" ikonu
};

export class UI {
    constructor(game) {
        this.game = game;
        this.userProfile = null;
        this.currentControls = {};
        this.listeningFor = null;
        this.isRegistering = false;
        this.resendInterval = null;
        this.passwordResetInterval = null;
        this.currentScreenId = null;
        this.isMenuBackgroundActive = false;
        this.volumeBeforeMute = 0.35;

        this.elements = {
            languageSwitcherButton: document.getElementById('language-switcher-button'),
            languageDropdownMenu: document.getElementById('language-dropdown-menu'),
            currentLanguageDisplay: document.getElementById('current-language-display'),
            authScreen: document.getElementById('auth-screen'),
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            showLoginBtn: document.getElementById('show-login-btn'),
            showRegisterBtn: document.getElementById('show-register-btn'),
            showForgotPasswordBtn: document.getElementById('show-forgot-password-btn'),
            forgotPasswordScreen: document.getElementById('forgot-password-screen'),
            forgotPasswordForm: document.getElementById('forgot-password-form'),
            backToLoginFromForgotBtn: document.getElementById('back-to-login-from-forgot-btn'),
            forgotPasswordInfo: document.getElementById('forgot-password-info'),
            authError: document.getElementById('auth-error'),
            userInfo: document.getElementById('user-info'),
            userProfileAvatar: document.getElementById('user-profile-avatar'),
            userProfileDisplay: document.getElementById('user-profile-display'),
            logoutBtn: document.getElementById('logout-btn'),
            mainMenu: document.getElementById('main-menu'),
            playBtn: document.getElementById('play-btn'),
            highscoreBtn: document.getElementById('highscore-btn'),
            howToPlayBtn: document.getElementById('how-to-play-btn'),
            modeSelectScreen: document.getElementById('mode-select-screen'),
            modeSelector: document.getElementById('mode-selector'),
            highscoreScreen: document.getElementById('highscore-screen'),
            highscoreList: document.getElementById('highscore-list'),
            howToPlayScreen: document.getElementById('how-to-play-screen'),
            profileScreen: document.getElementById('profile-screen'),
            profileBox: document.getElementById('profile-box'),
            profilePageAvatar: document.getElementById('profile-page-avatar'),
            profilePageUsername: document.getElementById('profile-page-username'),
            profileScoresList: document.getElementById('profile-scores-list'),
            backToMenuFromProfileBtn: document.getElementById('back-to-menu-from-profile-btn'),
            gameArea: document.getElementById('game-area'),
            scoreDisplay: document.getElementById('score-display'),
            gameOverScreen: document.getElementById('game-over-screen'),
            finalScoreLabel: document.getElementById('final-score-label'),
            finalScoreValue: document.getElementById('final-score-value'),
            backToMenuBtn: document.getElementById('back-to-menu-btn'),
            replayBtn: document.getElementById('replay-btn'),
            pauseScreen: document.getElementById('pause-screen'),
            pauseBox: document.getElementById('pause-box'),
            countdownDisplay: document.getElementById('countdown-display'),
            resumeBtn: document.getElementById('resume-btn'),
            audioControls: document.getElementById('audio-controls'),
            muteBtn: document.getElementById('mute-btn'),
            volumeSlider: document.getElementById('volume-slider'),
            showDeleteAccountModalBtn: document.getElementById('show-delete-account-modal-btn'),
            deleteAccountModal: document.getElementById('delete-account-modal'),
            deleteAccountForm: document.getElementById('delete-account-form'),
            cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
            deleteError: document.getElementById('delete-error'),
            emailVerifyScreen: document.getElementById('email-verify-screen'),
            userEmailPlaceholder: document.getElementById('user-email-placeholder'),
            resendVerificationBtn: document.getElementById('resend-verification-btn'),
            backToLoginFromVerifyBtn: document.getElementById('back-to-login-from-verify-btn'),
            verifyInfo: document.getElementById('verify-info'),
            rememberMeCheckbox: document.getElementById('remember-me-checkbox'),
            reflectionModeBtn: document.getElementById('reflection-mode-btn'),
            reflectionProgressFill: document.getElementById('reflection-progress-fill'),
            reflectionProgressText: document.getElementById('reflection-progress-text'),
            reflectionProgressBar: document.getElementById('reflection-progress-bar'),
            rsEarnedDisplay: document.getElementById('rs-earned-display'),
            showStoryBtn: document.getElementById('show-story-btn'),
            storyScreen: document.getElementById('story-screen'),
            backToMenuFromStoryBtn: document.getElementById('back-to-menu-from-story-btn'),
            playerColorPicker: document.getElementById('player-color-picker'),
            projectileColorPicker: document.getElementById('projectile-color-picker'),
            profileSettingsBtn: document.getElementById('profile-settings-btn'),
            profileSettingsDropdown: document.getElementById('profile-settings-dropdown'),
            personalBestNotification: document.getElementById('personal-best-notification'),
            changePasswordModal: document.getElementById('change-password-modal'),
            changePasswordForm: document.getElementById('change-password-form'),
            showChangePasswordBtn: document.getElementById('show-change-password-btn'),
            cancelChangePasswordBtn: document.getElementById('cancel-change-password-btn'),
            changePasswordError: document.getElementById('change-password-error'),
            toastNotificationContainer: document.getElementById('toast-notification-container'),
            shareProfileBtn: document.getElementById('share-profile-btn'),
            shareContainer: document.querySelector('.share-container'),
            challengeScreen: document.getElementById('challenge-screen'),
            challengeTitle: document.getElementById('challenge-title'),
            challengeScoresList: document.getElementById('challenge-scores-list'),
            acceptChallengeBtn: document.getElementById('accept-challenge-btn'),
            challengeSubtitle: document.getElementById('challenge-subtitle'),
            showControlsSettingsBtn: document.getElementById('show-controls-settings-btn'),
            controlsSettingsModal: document.getElementById('controls-settings-modal'),
            remapFireBtn: document.getElementById('remap-fire-btn'),
            remapStopBtn: document.getElementById('remap-stop-btn'),
            closeControlsSettingsBtn: document.getElementById('close-controls-settings-btn'),
            showFeedbackBtn: document.getElementById('show-feedback-btn'),
            feedbackModal: document.getElementById('feedback-modal'),
            feedbackForm: document.getElementById('feedback-form'),
            cancelFeedbackBtn: document.getElementById('cancel-feedback-btn'),
            categorySelector: document.querySelector('.category-selector'),
            feedbackText: document.getElementById('feedback-text'),
            charCounter: document.getElementById('char-counter')
        };

        this.initializeUI();
    }

    async initializeUI() {
    try {
        await i18n.init();
        this.applyTranslations();
        this.initEventListeners();
        this.initAuthStateObserver();

        // BAŞLANGIÇ SENKRONİZASYONU ---
        // 1. Kayıtlı sesi oku, yoksa varsayılanı kullan.
        const savedVolume = parseFloat(localStorage.getItem('reflectionArenaVolume') || 0.35);

        // 2. Hem AudioManager'daki sesi HEM DE barın görselini bu değerle ayarla.
        this.game.audioManager.setMasterVolume(savedVolume);
        this.elements.volumeSlider.value = savedVolume;

        // 3. Mute butonunun görselini ayarla.
        if (savedVolume === 0) {
            this.elements.muteBtn.textContent = '🔇';
        } else {
            this.elements.muteBtn.textContent = '🔊';
            // Eğer ses sıfır değilse, bir sonraki mute işlemi için bu değeri sakla.
            this.volumeBeforeMute = savedVolume;
        }

    } catch (error) {
        console.error("UI başlatılırken kritik hata:", error);
    }
}

    async handleChallengeLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');

    if (inviteToken) {
        document.body.removeEventListener('click', this.unlockAndPlayMenuMusic, { once: true });
        document.body.removeEventListener('keydown', this.unlockAndPlayMenuMusic, { once: true });

        this.showScreen('challenge-screen');
        
        const subtitleElement = document.querySelector('#challenge-screen .menu-content p');
        if (subtitleElement) {
            const fullSubtitle = i18n.t('main_menu_subtitle');
            subtitleElement.innerHTML = fullSubtitle.replace(/\n/g, '<br>');
        }
        
        this.elements.challengeScoresList.innerHTML = `<p>${i18n.t('info_loading_scores')}</p>`;
        
        const invitationDetails = await firebase.getInvitationDetails(inviteToken);

        if (invitationDetails) {
            const { username, scores } = invitationDetails;

            // Başlığı doldur
            const titleText = i18n.t('challenge_title_text').replace('{username}', `<span class="challenger-name">${username}</span>`);
            this.elements.challengeTitle.innerHTML = titleText;
            
            // Alt başlığı doldur
            this.elements.challengeSubtitle.setAttribute('data-i18n', 'challenge_subtitle_text');
            this.elements.challengeSubtitle.textContent = i18n.t('challenge_subtitle_text');
            
            // Karmaşık forEach döngüsü yerine, tek satırlık, temiz bir çağrı
            const scoresHTML = this._createScoresHTML(scores);
            this.elements.challengeScoresList.innerHTML = scoresHTML;

        } else {
            // Davet geçersiz veya süresi dolmuşsa hata mesajlarını göster
            this.elements.challengeTitle.textContent = i18n.t('challenge_invalid_title');
            this.elements.challengeSubtitle.textContent = i18n.t('challenge_invalid_subtitle');
            this.elements.challengeScoresList.innerHTML = '';
            this.elements.acceptChallengeBtn.style.display = 'none';
        }
        return true; // Meydan okuma akışı işlendi
    }
    return false; // Normal akışa devam et
}

    /**
     * Verilen bir skor nesnesinden, modların listelendiği HTML'i oluşturur.
     * @param {object} scores - Kullanıcının skorlarını içeren nesne.
     * @returns {string} Oluşturulan HTML metni.
     * @private
     */
    _createScoresHTML(scores = {}) { // Skor yoksa boş obje varsay
        const modes = [
            { id: 'REFLECTION_VICTORIES', nameKey: 'profile_victories_title', unit: 's', isParadox: true },
            { id: 'REFLECTION_SURVIVALS', nameKey: 'profile_survivals_title', unit: 's', isParadox: true },
            { id: 'SKILL_DODGE', nameKey: 'mode_skill_dodge', unit: 'Kills' },
            { id: 'KITE_ONLY', nameKey: 'mode_kite_only', unit: 'Kills' },
            { id: 'KAOS', nameKey: 'mode_kaos', unit: 's' },
            { id: 'DODGE_ONLY', nameKey: 'mode_dodge_only', unit: 's' }
        ];
        
        let content = '';

        modes.forEach(mode => {
            const score = scores[mode.id];
            let scoreDisplay;

            if (score !== undefined) {
                const isTimeBased = mode.unit === 's';
                const unit = i18n.t(isTimeBased ? 'unit_seconds' : 'unit_kills');
                // Ondalıklı skorları formatla
                const formattedScore = isTimeBased ? parseFloat(score).toFixed(2) : score;
                scoreDisplay = `${formattedScore} <span style="font-size: 1.2rem;">${unit}</span>`;
            } else {
                scoreDisplay = `<span class="score-not-played">${i18n.t('profile_not_played')}</span>`;
            }

            const iconSrc = MODE_ICONS[mode.id] || '';
            let modeDisplayName;
            if (mode.isParadox) {
                const mainTitle = i18n.t('mode_reflection_arena') + ':';
                const subTitle = i18n.t(mode.nameKey);
                modeDisplayName = `<span class="paradox-main-title">${mainTitle}</span><span class="paradox-sub-title">${subTitle}</span>`;
            } else {
                modeDisplayName = i18n.t(mode.nameKey);
            }

            content += `<div class="stat-item">
                            <img src="${iconSrc}" alt="${mode.id} Icon" class="profile-mode-icon" draggable="false">
                            <div class="stat-text">
                                <div class="mode-name">${modeDisplayName}</div>
                                <span class="score-value">${scoreDisplay}</span>
                            </div>
                        </div>`;
        });

        return content;
    }

    initEventListeners() {
        this.elements.languageSwitcherButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.elements.languageDropdownMenu.classList.toggle('visible');
        });

        this.elements.languageDropdownMenu.addEventListener('click', async (e) => {
            const button = e.target.closest('.language-option');
            if (button) {
                const lang = button.dataset.lang;
                if (lang !== i18n.currentLang) {
                    await i18n.loadLanguage(lang);
                    this.applyTranslations();
                }
                this.elements.languageDropdownMenu.classList.remove('visible');
            }
        });

        window.addEventListener('click', () => {
            if (this.elements.languageDropdownMenu.classList.contains('visible')) {
                this.elements.languageDropdownMenu.classList.remove('visible');
            }
        });

        // RENK SEÇİCİ OLAY DİNLEYİCİLERİNİ GÜNCELLE:
        // "change" olayı, kullanıcı renk seçmeyi bitirip pencereyi kapattığında tetiklenir.
        // Bu, veritabanına sürekli istek göndermeyi engeller.
        this.elements.playerColorPicker.addEventListener('change', e => {
            const color = e.target.value; // Renk doğrudan .value'dan gelir
            firebase.updatePlayerColors(this.userProfile.uid, color, null);
            this.userProfile.playerColor = color;
        });

        this.elements.projectileColorPicker.addEventListener('change', e => {
            const color = e.target.value;
            firebase.updatePlayerColors(this.userProfile.uid, null, color);
            this.userProfile.projectileColor = color;
        });

        // "Şifre Değiştir" modalını açar
        this.elements.showChangePasswordBtn.addEventListener('click', () => {
            this.elements.changePasswordError.textContent = '';
            this.elements.changePasswordForm.reset();
            this.elements.changePasswordModal.classList.add('visible');
            // Açılır menüyü kapat
            this.elements.profileSettingsDropdown.classList.remove('visible');
        });

        // "Şifre Değiştir" modalını iptal butonuyla kapatır
        this.elements.cancelChangePasswordBtn.addEventListener('click', () => {
            this.elements.changePasswordModal.classList.remove('visible');
        });

        // Şifre değiştirme formunu yönetir
        this.elements.changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorP = this.elements.changePasswordError;
        const currentPassword = e.target.querySelector('#current-password').value;
        const newPassword = e.target.querySelector('#new-password').value;
        const confirmNewPassword = e.target.querySelector('#confirm-new-password').value;

        errorP.textContent = i18n.t('info_processing_request');
        errorP.style.color = '#e0e0e0';

        try {
            // 1. ADIM: MEVCUT ŞİFREYİ DOĞRULA
            await firebase.reauthenticateUser(currentPassword);

            // 2. ADIM: YENİ ŞİFRENİN ESKİSİYLE AYNI OLMADIĞINI KONTROL ET
            if (currentPassword === newPassword) {
                errorP.textContent = i18n.t('error_password_same_as_old');
                return; // Fonksiyonu durdur
            }

            // 3. ADIM: YENİ ŞİFRE FORMATINI KONTROL ET
            const hasLetter = /[a-zA-Z]/.test(newPassword);
            const hasNumber = /\d/.test(newPassword);

            if (newPassword.length < 8) {
                errorP.textContent = i18n.t('error_password_length_8');
                return;
            }
            if (!hasLetter || !hasNumber) {
                errorP.textContent = i18n.t('error_password_format');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                errorP.textContent = i18n.t('error_password_mismatch');
                return;
            }

            // 4. ADIM: TÜM KONTROLLER GEÇİLDİYSE ŞİFREYİ GÜNCELLE
            await firebase.updateUserPassword(newPassword);

            // 5. ADIM: BAŞARI MESAJINI GÖSTER
            errorP.textContent = i18n.t('info_password_changed');
            errorP.style.color = '#4CAF50';

            setTimeout(() => {
                this.elements.changePasswordModal.classList.remove('visible');
            }, 2000);

        } catch (error) {
            errorP.textContent = i18n.t(error.message);
            errorP.style.color = '#ff5252';
        }
    });

        // "Bize Ulaşın" modalını açar
        this.elements.showFeedbackBtn.addEventListener('click', () => {
            this.elements.feedbackForm.reset();
            this.elements.charCounter.textContent = '0 / 500';
            // Kategori butonlarını varsayılan hale getir
            this.elements.categorySelector.querySelector('.category-btn.active').classList.remove('active');
            this.elements.categorySelector.querySelector('[data-category="Bug Report"]').classList.add('active');
            
            this.elements.feedbackModal.classList.add('visible');
            this.elements.profileSettingsDropdown.classList.remove('visible');
        });

        // "Bize Ulaşın" modalını kapatır
        this.elements.cancelFeedbackBtn.addEventListener('click', () => {
            this.elements.feedbackModal.classList.remove('visible');
        });

        // Kategori butonlarının seçimini yönetir
        this.elements.categorySelector.addEventListener('click', e => {
            if (e.target.classList.contains('category-btn')) {
                this.elements.categorySelector.querySelector('.category-btn.active').classList.remove('active');
                e.target.classList.add('active');
            }
        });

        // Karakter sayacını günceller
        this.elements.feedbackText.addEventListener('input', e => {
            this.elements.charCounter.textContent = `${e.target.value.length} / 500`;
        });

        // Geri bildirim formunu yönetir
        this.elements.feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const feedbackText = this.elements.feedbackText.value;
            const selectedCategory = this.elements.categorySelector.querySelector('.category-btn.active').dataset.category;

            if (!feedbackText.trim()) return;

            try {
                await firebase.sendFeedback(this.userProfile, feedbackText, selectedCategory);
                this.showToast('feedback_success_toast');
                this.elements.feedbackModal.classList.remove('visible');
            } catch (error) {
                // İsteğe bağlı: Hata durumunda bir toast gösterilebilir.
                console.error("Geri bildirim gönderilemedi:", error);
            }
        });

        // "Kontrol Ayarları" modalını açar
        this.elements.showControlsSettingsBtn.addEventListener('click', () => {
            // Mevcut ayarları kopyala ve buton metinlerini güncelle
            this.currentControls = { ...this.game.userProfile.controls };
            this.updateRemapButtonsText();
            
            this.elements.controlsSettingsModal.classList.add('visible');
            this.elements.profileSettingsDropdown.classList.remove('visible');
        });

        // "Kontrol Ayarları" modalını kapatır
        this.elements.closeControlsSettingsBtn.addEventListener('click', () => {
            this.cancelListening(); // Dinleme modunu iptal et
            this.elements.controlsSettingsModal.classList.remove('visible');
        });

        // Ateş etme tuşunu yeniden atamak için dinlemeyi başlat
        this.elements.remapFireBtn.addEventListener('click', () => {
            this.startListening('fire');
        });

        // Durma tuşunu yeniden atamak için dinlemeyi başlat
        this.elements.remapStopBtn.addEventListener('click', () => {
            this.startListening('stop');
        });

        // Profil paylaşma butonu
        this.elements.shareContainer = document.querySelector('.share-container');

        this.elements.shareContainer.addEventListener('click', async () => {
            if (!this.userProfile || !this.userProfile.username) return;

            try {
                // Tek ve akıllı fonksiyonumuzu çağır. O, gerisini halledecek.
                const token = await firebase.getOrCreateInvitationToken(this.userProfile);
                
                // Gelen token ile URL'yi oluştur ve panoya kopyala
                const challengeUrl = `${window.location.origin}${window.location.pathname}?invite=${token}`;
                
                navigator.clipboard.writeText(challengeUrl).then(() => {
                    this.showToast('toast_challenge_link_copied');
                });

            } catch (error) {
                console.error("Davet linki oluşturulamadı veya alınamadı:", error);
            }
        });

        // Meydan okumayı kabul et butonu
        this.elements.acceptChallengeBtn.addEventListener('click', () => {
            // Kullanıcıyı ana sayfaya (giriş/kayıt ekranına) yönlendirir.
            // URL'den challenge parametresini temizleyerek.
            window.location.href = `${window.location.origin}${window.location.pathname}`;
        });

         // YENİ: Profil ayarları menüsünü aç/kapat
        this.elements.profileSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Tıklamanın pencereye yayılmasını engelle
            this.elements.profileSettingsDropdown.classList.toggle('visible');
        });

        // YENİ: Menü dışına tıklandığında menüyü kapat
        window.addEventListener('click', () => {
            if (this.elements.profileSettingsDropdown.classList.contains('visible')) {
                this.elements.profileSettingsDropdown.classList.remove('visible');
            }
        });

        // Fonksiyonu bir sınıf özelliği haline getiriyoruz ki dışarıdan erişebilelim
        this.unlockAndPlayMenuMusic = () => {
            if (!this.game.audioManager.isMusicPlaying('menu')) {
                this.game.audioManager.playMusic('menu');
            }
        };
        document.body.addEventListener('click', this.unlockAndPlayMenuMusic, { once: true });
        document.body.addEventListener('keydown', this.unlockAndPlayMenuMusic, { once: true });


        this.elements.muteBtn.addEventListener('click', () => {
        const currentVolume = parseFloat(this.elements.volumeSlider.value);
        
        if (currentVolume > 0) {
            // Ses açıksa, kapat.
            // Mevcut ses seviyesini hatırla.
            this.volumeBeforeMute = currentVolume;
            this.game.audioManager.setMasterVolume(0);
            this.elements.volumeSlider.value = 0;
            this.elements.muteBtn.textContent = '🔇';
        } else {
            // Ses kapalıysa, daha önce hatırladığın seviyeye geri dön.
            this.game.audioManager.setMasterVolume(this.volumeBeforeMute);
            this.elements.volumeSlider.value = this.volumeBeforeMute;
            this.elements.muteBtn.textContent = '🔊';
        }
    });

    this.elements.volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        this.game.audioManager.setMasterVolume(volume);

        if (volume === 0) {
            this.elements.muteBtn.textContent = '🔇';
        } else {
            this.elements.muteBtn.textContent = '🔊';
            // Sesi bar ile açarsak, bu yeni değeri bir sonraki mute için sakla.
            this.volumeBeforeMute = volume;
        }
    });

        document.body.addEventListener('click', (e) => {
            // Tıklama sesini çalarken de unlock'ı tetikleyebiliriz.
            if (e.target.closest('button')) {
                this.game.audioManager.playSound('click');
            }
        });
        
        this.elements.showLoginBtn.addEventListener('click', () => this.toggleAuthForms(true));
        this.elements.showRegisterBtn.addEventListener('click', () => this.toggleAuthForms(false));
        this.elements.showForgotPasswordBtn.addEventListener('click', () => {
            this.showScreen('forgot-password-screen');
        });
        this.elements.backToLoginFromForgotBtn.addEventListener('click', () => this.showScreen('auth-screen'));
        this.elements.forgotPasswordForm.addEventListener('submit', e => this.handlePasswordReset(e));
        
        this.elements.registerForm.addEventListener('submit', e => this.handleRegister(e));
        this.elements.loginForm.addEventListener('submit', e => this.handleLogin(e));

        this.elements.userInfo.addEventListener('click', () => {
            this.displayProfile();
        });
        this.elements.logoutBtn.addEventListener('click', () => {
            firebase.logoutUser();
        });

        this.elements.playBtn.addEventListener('click', () => this.showScreen('mode-select-screen'));
        this.elements.howToPlayBtn.addEventListener('click', () => this.showScreen('how-to-play-screen'));
        this.elements.highscoreBtn.addEventListener('click', () => this.displayHighScores());


        this.elements.showStoryBtn.addEventListener('click', () => this.showScreen('story-screen'));
        this.elements.backToMenuFromStoryBtn.addEventListener('click', () => this.showScreen('main-menu'));

        // Yüksek Skorlar ekranındaki sekmeler arası geçişi yönetir
        this.elements.highscoreList.addEventListener('click', (e) => {
            const tabButton = e.target.closest('.highscore-tab-btn');
            if (!tabButton) return; // Eğer bir sekme butonuna tıklanmadıysa hiçbir şey yapma

            const parentColumn = tabButton.closest('.highscore-column');
            const targetId = tabButton.dataset.target;

            // Önce o sütundaki tüm aktif sekmeleri ve içerikleri pasif hale getir
            parentColumn.querySelectorAll('.highscore-tab-btn').forEach(btn => btn.classList.remove('active'));
            parentColumn.querySelectorAll('.score-list-pane').forEach(pane => pane.classList.remove('active'));

            // Sonra tıklanan sekmeyi ve hedefini aktif hale getir
            tabButton.classList.add('active');
            parentColumn.querySelector(targetId).classList.add('active');
        });
        
        document.getElementById('back-to-menu-from-highscore-btn').addEventListener('click', () => this.showScreen('main-menu'));
        document.getElementById('back-to-menu-from-mode-btn').addEventListener('click', () => this.showScreen('main-menu'));
        document.getElementById('back-to-menu-from-how-to-play-btn').addEventListener('click', () => this.showScreen('main-menu'));
        this.elements.backToMenuFromProfileBtn.addEventListener('click', () => this.showScreen('main-menu'));

        this.elements.modeSelector.addEventListener('click', e => {
        const button = e.target.closest('.mode-btn');
        if (button && button.dataset.mode) {
            this.game.start(button.dataset.mode, this.userProfile); 
            this.showScreen('game-area');                          
        }
    });
        // "Ana Menüye Dön" butonu
        this.elements.backToMenuBtn.addEventListener('click', () => {
            if (this.game.canClickRestart) this.showScreen('main-menu');
        });

        // "Tekrar Oyna" butonu
        this.elements.replayBtn.addEventListener('click', () => {
            if (this.game.canClickRestart) {
                this.showScreen('game-area');
                this.game.start(this.game.currentGameMode, this.userProfile);
            }
        });

        // "Devam Et" butonu
        this.elements.resumeBtn.addEventListener('click', () => this.game.resume());

        this.elements.showDeleteAccountModalBtn.addEventListener('click', () => {
            this.elements.deleteError.textContent = '';
            this.elements.deleteAccountForm.reset();
            this.elements.deleteAccountModal.classList.add('visible');
        });

        this.elements.cancelDeleteBtn.addEventListener('click', () => {
            this.elements.deleteAccountModal.classList.remove('visible');
        });

        this.elements.deleteAccountForm.addEventListener('submit', (e) => this.handleAccountDeletion(e));

        this.elements.backToLoginFromVerifyBtn.addEventListener('click', () => {
            firebase.logoutUser();
        });
        
        this.elements.resendVerificationBtn.addEventListener('click', async () => {
            if (this.elements.resendVerificationBtn.disabled) return;
            try {
                await firebase.resendVerificationEmail();
                this.elements.verifyInfo.textContent = i18n.t('info_resending_email');
                this.elements.verifyInfo.style.color = '#4CAF50';
                this.startResendCountdown();
            } catch (error) {
                const errorMessageKey = firebase.getErrorMessageKey(error);
                this.elements.verifyInfo.textContent = i18n.t(errorMessageKey);
                this.elements.verifyInfo.style.color = '#ff5252';
            }
        });

        this.elements.reflectionModeBtn.addEventListener('click', async () => { // Fonksiyonu async yap
    if (this.elements.reflectionModeBtn.disabled || !this.userProfile) return;

    try {
        // SAVAŞTAN ÖNCE EN GÜNCEL VERİYİ ÇEK ---
        const latestProfile = await firebase.getUserProfile(this.userProfile.uid);
        
        if (latestProfile) {
            // Hem UI'daki hem de Game'deki yerel profil objelerini taze veriyle güncelle
            this.userProfile = latestProfile;
            this.game.userProfile = latestProfile;
        }

        this.showScreen('game-area');
        this.game.start('REFLECTION_BOSS', this.userProfile);

    } catch (error) {
        console.error("Yansıma modu başlatılırken profil güncellenemedi:", error);
        // Hata durumunda bile eski veriyle oyunu başlatmayı deneyebiliriz
        this.showScreen('game-area');
        this.game.start('REFLECTION_BOSS', this.userProfile);
    }
});
    }

    removeUnlockListeners() {
    // Oyun başladığında artık gereksiz olan bu "ilk tıklama/basma" dinleyicilerini kaldırır.
    document.body.removeEventListener('click', this.unlockAndPlayMenuMusic, { once: true });
    document.body.removeEventListener('keydown', this.unlockAndPlayMenuMusic, { once: true });
}

updateSelectedColors() {
    if (!this.userProfile) return;

    // Oyuncunun rengini al. Eğer profilde kayıtlı bir renk yoksa, varsayılan MAVİ'yi kullan.
    const playerColor = this.userProfile.playerColor || PLAYER_COLOR;
    this.elements.playerColorPicker.value = playerColor;

    // Merminin rengini al. Eğer profilde kayıtlı bir renk yoksa, varsayılan MAVİ'yi kullan.
    const projectileColor = this.userProfile.projectileColor || PLAYER_PROJECTILE_COLOR;
    this.elements.projectileColorPicker.value = projectileColor;
}

    async initAuthStateObserver() {

        // ÖNCE MEYDAN OKUMA LİNKİNİ KONTROL ET
        const challengeHandled = await this.handleChallengeLink();
        if (challengeHandled) {
            // Eğer meydan okuma ekranı gösterildiyse, normal giriş akışını tamamen durdur.
            return; 
        }

        firebase.handleAuthStateChanged(async (user) => {
            if (this.isRegistering) return;
            const topRightContainer = document.querySelector('#top-right-container');
            const langSwitcher = document.getElementById('language-switcher-container');
    
            if (user) {
                await user.reload();
                if (user.emailVerified) {
                    try {
                        const profile = await firebase.getUserProfile(user.uid);
                        if (profile) {
                            this.userProfile = profile;
                            this.game.userProfile = this.userProfile;
                            this.elements.userProfileDisplay.textContent = this.userProfile.username;
                            this.elements.userProfileAvatar.textContent = this.userProfile.username.charAt(0).toUpperCase();
                            topRightContainer.style.display = 'flex';
                            langSwitcher.style.right = '200px'; 
                            this.showScreen('main-menu');

                            // YENİ: Profil yüklendiğinde Yansıma UI'ını güncelle
                            this.updateReflectionUI(this.userProfile);

                        } else { await firebase.logoutUser(); }
                    } catch (error) { await firebase.logoutUser(); }
                } else {
                    this.elements.userEmailPlaceholder.textContent = user.email;
                    this.showScreen('email-verify-screen');
                    topRightContainer.style.display = 'none';
                    langSwitcher.style.right = '30px'; 
                    this.startResendCountdown();
                }
            } else {
                this.userProfile = null;
                this.game.userProfile = null;
                topRightContainer.style.display = 'none';
                langSwitcher.style.right = '30px';
                this.showScreen('auth-screen');
            }
        });
    }
    
    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.dataset.i18n;
            element.textContent = i18n.t(key);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.dataset.i18nPlaceholder;
            element.placeholder = i18n.t(key);
        });
    
        const langName = this.elements.languageDropdownMenu.querySelector(`[data-lang="${i18n.currentLang}"]`)?.textContent.trim().split(' ').slice(1).join(' ') || 'Language';
        this.elements.currentLanguageDisplay.textContent = langName;
        
        this.elements.languageDropdownMenu.querySelectorAll('.language-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === i18n.currentLang);
        });
        
        const subtitleElement = document.querySelector('#main-menu .menu-content p');
        if (subtitleElement) {
            const fullSubtitle = i18n.t('main_menu_subtitle');
            // JSON'daki \n (yeni satır) karakterini, HTML'in anladığı <br> (satır atlama) etiketine çevir.
            subtitleElement.innerHTML = fullSubtitle.replace(/\n/g, '<br>');
        }
    }

    async displayProfile() {
    if (!this.userProfile) return;
    this.showScreen('profile-screen');
    this.elements.profilePageAvatar.textContent = this.userProfile.username.charAt(0).toUpperCase();
    this.elements.profilePageUsername.textContent = this.userProfile.username;
    this.elements.profileScoresList.innerHTML = `<p>${i18n.t('info_loading_scores')}</p>`;
    this.updateSelectedColors();

    try {
        const userScores = await firebase.getUserHighScores(this.userProfile.uid);
        // Karmaşık döngü yerine tek satırlık çağrı
        const scoresHTML = this._createScoresHTML(userScores);
        this.elements.profileScoresList.innerHTML = scoresHTML;
    } catch (error) {
        this.elements.profileScoresList.innerHTML = `<p style="color: #ff5252;">${i18n.t('error_loading_scores')}</p>`;
    }
}
    
    async displayHighScores() {
    this.showScreen('highscore-screen');
    this.elements.highscoreList.innerHTML = `<h3>${i18n.t('info_loading')}</h3>`;

    const modeNamesMap = {
        'SKILL_DODGE': i18n.t('mode_skill_dodge'),
        'KITE_ONLY': i18n.t('mode_kite_only'),
        'DODGE_ONLY': i18n.t('mode_dodge_only'),
        'KAOS': i18n.t('mode_kaos'),
        'REFLECTION_BOSS': i18n.t('mode_reflection_arena')
    };

    try {
        const allScores = await firebase.getHighScores();
        let content = '';

        const createScoreList = (scores, scoreKey, unit) => {
            if (scores.length === 0) {
                return `<li>${i18n.t('highscores_no_scores')}</li>`;
            }
            return scores.map((scoreData, index) => {
                const rankClasses = ['score-rank'];
                if (index === 0) rankClasses.push('rank-1');
                if (index === 1) rankClasses.push('rank-2');
                if (index === 2) rankClasses.push('rank-3');

                return `
                    <li>
                        <span class="${rankClasses.join(' ')}">${index + 1}.</span>
                        <span class="score-username">${scoreData.username || ''}</span>
                        <span class="score-value">${scoreData[scoreKey]} ${unit}</span>
                    </li>
                `;
            }).join('');
        };

        // --- SEKMELİ YANSIMA ARENASI SÜTUNU ---
        const victories = allScores['REFLECTION_VICTORIES'];
        const survivals = allScores['REFLECTION_SURVIVALS'];

        if (victories && survivals) {
            const unitSeconds = i18n.t('unit_seconds');
            content += `
            <div class="highscore-column wide">
                <div class="highscore-column-header">
                    <img src="${MODE_ICONS['REFLECTION_BOSS']}" alt="Reflection Boss Icon" class="header-mode-icon" draggable="false">
                    <h3>${modeNamesMap['REFLECTION_BOSS']}</h3>
                </div>
                <div class="highscore-tabs">
                    <button class="highscore-tab-btn active" data-target="#reflection-victories-list">${i18n.t('highscore_victories_title')}</button>
                    <button class="highscore-tab-btn" data-target="#reflection-survivals-list">${i18n.t('highscore_survivals_title')}</button>
                </div>
                <div class="highscore-content">
                    <ul id="reflection-victories-list" class="score-list-pane active">${createScoreList(victories.scores, 'score', unitSeconds)}</ul>
                    <ul id="reflection-survivals-list" class="score-list-pane">${createScoreList(survivals.scores, 'score', unitSeconds)}</ul>
                </div>
            </div>`;
        }
        
        // --- DİĞER OYUN MODLARI ---
        const otherModes = ['SKILL_DODGE', 'KITE_ONLY', 'DODGE_ONLY', 'KAOS'];
        for (const modeId of otherModes) {
        if (!allScores[modeId]) continue;
            const modeData = allScores[modeId];
            const unit = i18n.t(modeData.unit === 'Kills' ? 'unit_kills' : 'unit_seconds');
            
            // YENİ: Diğer modlar için de tutarlı bir yapı kullanıyoruz.
            content += `
            <div class="highscore-column">
                <div class="highscore-column-header">
                    <img src="${MODE_ICONS[modeId]}" alt="${modeNamesMap[modeId]} Icon" class="header-mode-icon" draggable="false">
                    <h3>${modeNamesMap[modeId]}</h3>
                </div>
                <!-- PARADOX İLE AYNI HTML YAPISI -->
                <div class="highscore-content">
                    <ul>${createScoreList(modeData.scores, 'score', unit)}</ul>
                </div>
            </div>`;
        }

        this.elements.highscoreList.innerHTML = content;
    } catch (error) {
        console.error("Yüksek skorlar yüklenirken hata:", error);
        this.elements.highscoreList.innerHTML = `<h3 style="color: #ff5252;">${i18n.t('error_loading_scores')}</h3>`;
    }
}

    showScreen(screenId) {
    // --- BÖLÜM 1: Arka Plan Yönetimi ---
    const screensWithBackground = [
        'main-menu',
        'mode-select-screen',
        'highscore-screen',
        'how-to-play-screen',
        'story-screen',
        'profile-screen',
        'challenge-screen'
    ];
    const shouldHaveBackground = screensWithBackground.includes(screenId);
    if (shouldHaveBackground && !this.isMenuBackgroundActive) {
        initMenuBackground();
        this.isMenuBackgroundActive = true;
    } else if (!shouldHaveBackground && this.isMenuBackgroundActive) {
        this.isMenuBackgroundActive = false;
        stopMenuBackground();
    }
    
    // --- BÖLÜM 2: Ekran Geçişleri ---
    if (screenId === 'email-verify-screen') {
        this.elements.verifyInfo.textContent = '';
        if (this.resendInterval) {
            clearInterval(this.resendInterval);
            this.resendInterval = null;
        }
        this.elements.resendVerificationBtn.disabled = false;
        this.elements.resendVerificationBtn.textContent = i18n.t('resend_email_button');
    }
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    const activeScreen = document.getElementById(screenId);
    if (activeScreen) {
        activeScreen.classList.add('active');
    }
    this.elements.gameOverScreen.classList.remove('visible');
    this.elements.pauseScreen.classList.remove('visible');
    
    // --- BÖLÜM 3: SES KONTROLLERİ VE MÜZİK YÖNETİMİ ---
    const screensWithAudioControls = [
        'auth-screen',
        'forgot-password-screen',
        'email-verify-screen',
        'main-menu', 
        'profile-screen', 
        'highscore-screen', 
        'how-to-play-screen', 
        'mode-select-screen', 
        'story-screen'
    ];
    if (screensWithAudioControls.includes(screenId)) {
        this.elements.audioControls.classList.add('visible');
    } else {
        this.elements.audioControls.classList.remove('visible');
    }

    const menuScreens = ['main-menu', 'profile-screen', 'highscore-screen', 'how-to-play-screen', 'mode-select-screen', 'story-screen'];
    if (menuScreens.includes(screenId)) {
        if (!this.game.audioManager.isMusicPlaying('menu')) {
            this.game.audioManager.playMusic('menu');
        }
    } else if (screenId === 'challenge-screen') {
        this.game.audioManager.stopMusic();
    }
    
    // --- BÖLÜM 4: Form Temizleme ve Diğer Arayüz Durumları ---
    if (screenId === 'auth-screen' || screenId === 'forgot-password-screen') {
        this.elements.authError.textContent = '';
        this.elements.loginForm.reset();
        this.elements.registerForm.reset();
        if(screenId === 'forgot-password-screen') this.elements.forgotPasswordForm.reset();
    }
    
    if (this.elements.profileSettingsDropdown.classList.contains('visible')) {
        this.elements.profileSettingsDropdown.classList.remove('visible');
    }

    this.currentScreenId = screenId;
}

    toggleAuthForms(showLogin) {
        this.elements.loginForm.classList.toggle('active', showLogin);
        this.elements.registerForm.classList.toggle('active', !showLogin);
        this.elements.showLoginBtn.classList.toggle('active', !showLogin);
        this.elements.showRegisterBtn.classList.toggle('active', showLogin);
        this.elements.showForgotPasswordBtn.classList.toggle('active', showLogin);
        this.elements.authError.textContent = '';
    }
    
    showAuthError(messageKey) {
        this.elements.authError.textContent = i18n.t(messageKey);
        this.elements.authError.style.color = '#ff5252';
    }
    
    showAuthError(messageKey) {
        this.elements.authError.textContent = i18n.t(messageKey);
        this.elements.authError.style.color = '#ff5252';
    }
    
    async handleRegister(e) {
    e.preventDefault();
    const username = e.target.querySelector('#register-username').value;
    const email = e.target.querySelector('#register-email').value;
    const password = e.target.querySelector('#register-password').value;
    const confirmPassword = e.target.querySelector('#register-password-confirm').value;

    const usernameRegex = /^[a-z0-9]+$/;

    if (username.length > 16) { 
        this.showAuthError("Kullanıcı adı en fazla 16 karakter olabilir."); 
        return; 
    }
    if (!usernameRegex.test(username)) {
        this.showAuthError("error_username_format");
        return;
    }
    
    // GÜÇLENDİRİLMİŞ ŞİFRE KONTROLLERİ =====
    const hasLetter = /[a-zA-Z]/.test(password); // Şifrede harf var mı?
    const hasNumber = /\d/.test(password);      // Şifrede rakam var mı?

    if (password.length < 8) {
        this.showAuthError("error_password_length_8"); 
        return; 
    }
    if (!hasLetter || !hasNumber) {
        this.showAuthError("error_password_format");
        return;
    }
    // =======================================================

    if (password !== confirmPassword) { 
        this.showAuthError("error_password_mismatch"); 
        return; 
    }
    
    this.elements.authError.textContent = i18n.t('info_registering');
    this.elements.authError.style.color = '#4CAF50';
    
    try {
        await firebase.registerUser(username, email, password);
    } catch (error) { 
        this.showAuthError(firebase.getErrorMessageKey(error)); 
    }
}

    async handleLogin(e) {
    e.preventDefault();
    const identifier = e.target.querySelector('#login-identifier').value;
    const password = e.target.querySelector('#login-password').value;
    const rememberMe = this.elements.rememberMeCheckbox.checked;
    
    this.elements.authError.textContent = i18n.t('info_logging_in');
    this.elements.authError.style.color = '#4CAF50';
    
    try {
        await firebase.setAuthPersistence(rememberMe);
        await firebase.loginWithIdentifier(identifier, password);
    } catch (error) { 
        this.showAuthError('error_login_failed'); 
    }
}

    async handlePasswordReset(e) {
        e.preventDefault();
        const email = e.target.querySelector('#forgot-email').value;
        const info = this.elements.forgotPasswordInfo;
        info.textContent = i18n.t('info_processing_request');
        info.style.color = '#e0e0e0';
        try {
            await firebase.sendPasswordReset(email);
            info.textContent = i18n.t('info_password_reset_sent');
            info.style.color = '#4CAF50';
            this.startPasswordResetCountdown();
        } catch (error) {
            info.textContent = i18n.t(firebase.getErrorMessageKey(error));
            info.style.color = '#ff5252';
        }
    }
    
    updateScoreDisplay(score, mode, elapsedTime = 0) {
    const isTimeBased = (
        mode === 'DODGE_ONLY' || 
        mode === 'KAOS' || 
        mode === 'REFLECTION_BOSS'
    );
    
    const label = isTimeBased ? i18n.t('game_time_label') : i18n.t('game_kills_label');
    
    // Oyun sırasında SADECE tam sayı göster
    const displayedValue = Math.floor(isTimeBased ? elapsedTime : score);

    let unitDisplay = '';
    if (isTimeBased) {
        unitDisplay = ` ${i18n.t('unit_seconds')}`;
    } else {
        unitDisplay = ` ${i18n.t('unit_kills')}`;
    }
    
    this.elements.scoreDisplay.textContent = `${label}: ${displayedValue}${unitDisplay}`;
}
    
    showGameOver(finalScore, mode, userProfile, pointsEarned = 0, victory = false, scoreDetails = {}, isNewRecord = false, oldBestScore = null) {
    const gameOverBox = this.elements.gameOverScreen.querySelector('#game-over-box');
    const title = gameOverBox.querySelector('h1');
    const rsDisplay = this.elements.rsEarnedDisplay;
    const pbNotification = this.elements.personalBestNotification;

    // Her seferinde dinamik alanları temizle
    rsDisplay.textContent = '';
    pbNotification.innerHTML = '';

    if (pointsEarned > 0) {
        rsDisplay.textContent = i18n.t('earned_echoes_text').replace('{points}', pointsEarned);
    }

    if (isNewRecord) {
        const isTimeBased = mode === 'DODGE_ONLY' || mode === 'KAOS' || mode === 'REFLECTION_BOSS';
        const oldUnitDisplay = isTimeBased ? ` ${i18n.t('unit_seconds')}` : ` ${i18n.t('unit_kills')}`;
        
        let notificationText = '';
        if (oldBestScore !== null) {
            notificationText = `🏆 Kişisel Rekorunu Kırdın! 🏆<br><span class="old-score">Eski Rekorun: ${oldBestScore}${oldUnitDisplay}</span>`;
        } else {
            notificationText = '🏆 İlk Rekorunu Kaydettin! 🏆';
        }
        pbNotification.innerHTML = notificationText;
    }

    if (mode === 'REFLECTION_BOSS') {
        const finalTime = parseFloat(scoreDetails.finalTime).toFixed(2); // Her zaman 2 ondalıklı olsun
        if (victory) {
            title.textContent = "Zafer!";
            this.elements.finalScoreLabel.textContent = "Süren";
            this.elements.finalScoreValue.textContent = `${finalTime} s`;
        } else {
            title.textContent = "Yenildin";
            this.elements.finalScoreLabel.textContent = "Dayanma Süren";
            this.elements.finalScoreValue.textContent = `${finalTime} s`;
        }
    } else {
        title.textContent = i18n.t('game_over_title');
        const isTimeBased = mode === 'DODGE_ONLY' || mode === 'KAOS';
        this.elements.finalScoreLabel.textContent = i18n.t(isTimeBased ? 'game_over_time_label' : 'game_over_score_label');

        const unit = isTimeBased ? i18n.t('unit_seconds') : i18n.t('unit_kills');
        
        const scoreToDisplay = isTimeBased ? finalScore.toFixed(2) : Math.floor(finalScore);
        
        this.elements.finalScoreValue.textContent = `${scoreToDisplay} ${unit}`;
    }

    this.elements.gameOverScreen.classList.add('visible');
}
    
    showPauseScreen(isPaused) {
        this.elements.pauseScreen.classList.toggle('visible', isPaused);
        if (isPaused) {
            this.elements.pauseBox.querySelector('h1').textContent = i18n.t('pause_title');
            this.elements.countdownDisplay.textContent = '';
            this.elements.resumeBtn.style.display = 'block';
        }
    }

    startResumeCountdown(callback) {
        this.elements.resumeBtn.style.display = 'none';
        this.elements.pauseBox.querySelector('h1').textContent = i18n.t('pause_countdown_start');
        
        let countdown = 3;
        this.elements.countdownDisplay.textContent = countdown;
        
        const intervalId = setInterval(() => {
            if (document.hidden) {
                clearInterval(intervalId);
                this.showPauseScreen(true);
                return;
            }

            countdown--;
            this.elements.countdownDisplay.textContent = countdown > 0 ? countdown : i18n.t('pause_countdown_fight');
            
            if (countdown <= 0) {
                clearInterval(intervalId);
                this.showPauseScreen(false);
                callback();
            }
        }, 1000);
    }

    async handleAccountDeletion(e) {
    e.preventDefault();
    if (!this.userProfile) return;

    const password = e.target.querySelector('#delete-password').value;
    const feedback = e.target.querySelector('#delete-feedback').value;

    this.elements.deleteError.textContent = i18n.t('info_processing_request');
    this.elements.deleteError.style.color = '#e0e0e0';

    try {
        await firebase.deleteUserAccount(password, feedback, this.userProfile);
        
        // İşlem başarılı olursa, modalı hemen kapatmaya GEREK YOK.
        // Zaten auth state observer tetiklenip kullanıcıyı giriş ekranına atacak.
        this.elements.deleteAccountModal.classList.remove('visible');

        // BAŞARI BİLDİRİMİNİ GÖSTER =====
        this.showToast('account_deleted_toast');
        
    } catch (error) {
        const errorMessageKey = error.message;
        this.elements.deleteError.textContent = i18n.t(errorMessageKey);
        this.elements.deleteError.style.color = '#ff5252';
    }
}

    startResendCountdown() {
        if (this.resendInterval) { clearInterval(this.resendInterval); }
        this.elements.resendVerificationBtn.disabled = true;
        let countdown = 60;
        const baseText = i18n.t('resend_email_button_countdown');
        this.elements.resendVerificationBtn.textContent = `${baseText} (${countdown})`;
        this.resendInterval = setInterval(() => {
            countdown--;
            this.elements.resendVerificationBtn.textContent = `${baseText} (${countdown})`;
            if (countdown <= 0) {
                clearInterval(this.resendInterval);
                this.elements.resendVerificationBtn.disabled = false;
                this.elements.resendVerificationBtn.textContent = i18n.t('resend_email_button');
            }
        }, 1000);
    }

    startPasswordResetCountdown() {
        if (this.passwordResetInterval) { clearInterval(this.passwordResetInterval); }
        const button = this.elements.forgotPasswordForm.querySelector('button[type="submit"]');
        button.disabled = true;
        let countdown = 60;
        const baseText = i18n.t('resend_email_button_countdown');
        button.textContent = `${baseText} (${countdown})`;
        this.passwordResetInterval = setInterval(() => {
            countdown--;
            button.textContent = `${baseText} (${countdown})`;
            if (countdown <= 0) {
                clearInterval(this.passwordResetInterval);
                button.disabled = false;
                button.textContent = i18n.t('forgot_password_button');
            }
        }, 1000);
    }


    // Game.js tarafından çağrılacak yeni fonksiyon
    addReflectionScore(pointsToAdd) {
    if (!this.userProfile || pointsToAdd <= 0) return;
    
    const MAX_RS = 1000;
    const scoreBeforeUpdate = this.userProfile.reflectionScore || 0;

    // Firebase'e güncelleme isteğini gönder
    firebase.updateReflectionScore(this.userProfile.uid, pointsToAdd);
    
    // Yerel kullanıcı profilini anında güncelle
    this.userProfile.reflectionScore = scoreBeforeUpdate + pointsToAdd;
    
    // Arayüzü yeni skorla güncelle
    this.updateReflectionUI(this.userProfile);

    // KİLİT AÇILMA ANINI KONTROL ET
    // Eğer eski skor 1000'in altındayken, yeni skor 1000 veya üzerine çıktıysa...
    if (scoreBeforeUpdate < MAX_RS && this.userProfile.reflectionScore >= MAX_RS) {
        // ...bildirimi göster!
        this.showToast('paradox_unlocked_toast');
    }
}

    // Arayüzdeki ilerleme çubuğunu ve butonu güncelleyen ana fonksiyon
    updateReflectionUI(userProfile) {
    const MAX_RS = 1000;
    const currentScore = userProfile.reflectionScore || 0;
    
    const button = this.elements.reflectionModeBtn;
    const progressBar = this.elements.reflectionProgressBar;

    if (currentScore >= MAX_RS) {
        // HEDEFE ULAŞILDIYSA:
        progressBar.style.display = 'none';
        button.disabled = false;
        button.classList.remove('locked');
        
        // YENİ ADIM: Parlama efektini etkinleştir
        button.classList.add('paradox-btn-unlocked');
        
    } else {
        // HEDEFE HENÜZ ULAŞILMADIYSA:
        progressBar.style.display = 'block';
        const percentage = Math.min(100, (currentScore / MAX_RS) * 100);
        this.elements.reflectionProgressFill.style.width = `${percentage}%`;
        this.elements.reflectionProgressText.textContent = i18n.t('reflection_progress_text').replace('{score}', currentScore);
        button.disabled = true;
        button.classList.add('locked');
        
        // YENİ ADIM: Parlama efektinin olmadığından emin ol
        button.classList.remove('paradox-btn-unlocked');
    }
}

    /* Kontrol ayarları penceresindeki butonların metinlerini günceller.*/
    updateRemapButtonsText() {
        this.elements.remapFireBtn.textContent = this.currentControls.fire || '?';
        this.elements.remapStopBtn.textContent = this.currentControls.stop || '?';
    }

    /**
     * Belirli bir eylem için yeni bir tuş ataması dinlemeye başlar.
     * @param {string} action - Dinlenecek eylem ('fire' veya 'stop').
     */
    startListening(action) {
        this.listeningFor = action;
        const button = (action === 'fire') ? this.elements.remapFireBtn : this.elements.remapStopBtn;
        
        // Diğer butonu normal haline getir
        this.cancelListening(action === 'fire' ? 'stop' : 'fire');
        
        button.textContent = i18n.t('listening_for_key');
        button.classList.add('listening');

        // Yeni bir tuşa basılmasını bekleyen olay dinleyicisi
        const keydownHandler = (e) => {
            e.preventDefault();
            const newKey = e.key.toLowerCase();

            // Atanmaması gereken tuşları kontrol et
            if (e.key === 'Escape') {
                this.cancelListening();
                window.removeEventListener('keydown', keydownHandler, true);
                return;
            }
            
            // Yeni tuşu ata ve veritabanını güncelle
            this.setNewKey(this.listeningFor, newKey);
            
            // Dinlemeyi bitir
            this.cancelListening();
            window.removeEventListener('keydown', keydownHandler, true);
        };
        
        // Olayı yakalamak için 'capture' modunu kullanıyoruz
        window.addEventListener('keydown', keydownHandler, { capture: true, once: true });
    }

    /**
     * Yeni bir tuş atar, UI'ı ve veritabanını günceller.
     * @param {string} action - Güncellenecek eylem.
     * @param {string} newKey - Atanacak yeni tuş.
     */
    setNewKey(action, newKey) {
        // Eğer yeni tuş zaten başka bir eyleme atanmışsa, yer değiştir
        if (newKey === this.currentControls.fire) {
            this.currentControls.fire = this.currentControls[action];
        }
        if (newKey === this.currentControls.stop) {
            this.currentControls.stop = this.currentControls[action];
        }

        this.currentControls[action] = newKey;
        this.updateRemapButtonsText();
        
        // Hem yerel game state'i hem de kullanıcı profilini anında güncelle
        this.game.controls = { ...this.currentControls };
        this.game.userProfile.controls = { ...this.currentControls };
        
        // Değişiklikleri veritabanına kaydet
        firebase.updateUserControls(this.game.userProfile.uid, this.currentControls);
    }

    /**
     * Tuş dinleme modunu iptal eder ve butonları normal haline getirir.
     * @param {string} actionToCancel - Sadece iptal edilecek eylem. Boş bırakılırsa hepsi iptal olur.
     */
    cancelListening(actionToCancel = null) {
        if (!actionToCancel || actionToCancel === 'fire') {
            this.elements.remapFireBtn.classList.remove('listening');
        }
        if (!actionToCancel || actionToCancel === 'stop') {
            this.elements.remapStopBtn.classList.remove('listening');
        }

        if (!actionToCancel) {
            this.listeningFor = null;
        }
        
        this.updateRemapButtonsText();
    }

/**
 * Ekranda geçici bir bildirim (toast) gösterir.
 * @param {string} messageKey - Gösterilecek metnin i18n anahtarı.
 */
showToast(messageKey) {
    const message = i18n.t(messageKey);
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // Mevcut bildirimleri temizle (isteğe bağlı, ama daha temiz)
    this.elements.toastNotificationContainer.innerHTML = '';
    this.elements.toastNotificationContainer.appendChild(toast);

    // Animasyon bittiğinde elementi DOM'dan kaldır
    setTimeout(() => {
        toast.remove();
    }, 4000); // Animasyon süresiyle (4s) eşleşmeli
}

}