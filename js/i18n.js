// Bu modül, dil dosyalarını yüklemek, dili değiştirmek ve metinleri çevirmekle sorumludur.

// Çevirileri tutacak olan nesne.
let translations = {};
// Mevcut aktif dil.
let currentLang = 'tr';

/**
 * Belirtilen dil için JSON dosyasını yükler ve çevirileri günceller.
 * @param {string} lang - Yüklenecek dilin kodu (örn: 'tr', 'en').
 */
async function loadLanguage(lang) {
    try {
        // Dil dosyasını fetch ile çekiyoruz.
        const response = await fetch(`assets/locales/${lang}.json`);
        
        // Eğer dosya bulunamazsa (404 hatası gibi) hata fırlat.
        if (!response.ok) {
            throw new Error(`Dil dosyası yüklenemedi: ${lang}`);
        }
        
        // Gelen cevabı JSON olarak parse et ve `translations` nesnesine ata.
        translations = await response.json();
        
        // Mevcut dili güncelle.
        currentLang = lang;
        
        // Kullanıcının tercihini tarayıcının hafızasına kaydet.
        localStorage.setItem('preferredLanguage', lang);
        
        // HTML etiketinin lang attribute'unu güncelleyerek erişilebilirliği artır.
        document.documentElement.lang = lang;

    } catch (error) {
        console.error(error);
        // Eğer istenen dil yüklenemezse, varsayılan olarak İngilizce'ye dönmeyi dene.
        // Bu, uygulamanın çökmesini engeller.
        if (lang !== 'en') {
            console.warn(`'${lang}' dil dosyası bulunamadı. Varsayılan dile (en) dönülüyor...`);
            await loadLanguage('en');
        }
    }
}

/**
 * Verilen bir anahtarın (key) mevcut dildeki karşılığını döndürür.
 * @param {string} key - Çeviri dosyasındaki anahtar.
 * @returns {string} Çevrilmiş metin veya bulunamazsa anahtarın kendisi.
 */
function t(key) {
    // Eğer çeviri varsa onu döndür, yoksa `[anahtar]` formatında bir uyarı metni döndür.
    // Bu, hangi çevirinin eksik olduğunu kolayca görmemizi sağlar.
    return translations[key] || `[${key}]`;
}

/**
 * Uygulama ilk başladığında çalışacak olan ana başlangıç fonksiyonu.
 * Tarayıcı hafızasındaki dili veya varsayılan dili yükler.
 */
async function init() {
    // Tarayıcı hafızasında kayıtlı bir dil tercihi var mı diye kontrol et.
    const savedLang = localStorage.getItem('preferredLanguage') || 'tr'; // Yoksa varsayılan 'tr' olsun.
    await loadLanguage(savedLang);
}

// Bu modülden dışarıya hangi fonksiyonların kullanılabilir olacağını belirtiyoruz.
export { init, loadLanguage, t, currentLang };