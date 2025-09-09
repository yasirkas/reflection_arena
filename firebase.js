import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendEmailVerification, sendPasswordResetEmail, setPersistence, browserSessionPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, Timestamp, doc, getDoc, writeBatch, setDoc, increment } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { firebaseConfig } from './config.js';

  
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- AUTH & PROFILE FUNCTIONS ---
export function handleAuthStateChanged(callback) { onAuthStateChanged(auth, callback); }
export function getCurrentUser() { return auth.currentUser; }

export async function registerUser(username, email, password) {
    // --- YENİ SUNUCU TARAFI GÜVENLİK KONTROLLERİ ---
    const usernameRegex = /^[a-z0-9]+$/;
    if (username.length === 0 || username.length > 16 || !usernameRegex.test(username)) {
        // Geçersiz bir kullanıcı adı formatı gelirse, işlemi hiç başlatmadan hata fırlat.
        throw { code: "auth/invalid-username-format" };
    }
    // --- KONTROLLERİN SONU ---

    const usernameRef = doc(db, 'usernames', username);
    const usernameDoc = await getDoc(usernameRef);
    if (usernameDoc.exists()) { throw { code: "auth/username-already-in-use" }; }
    
     try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);
        const batch = writeBatch(db);
        const userProfileRef = doc(db, 'users', user.uid);
        
        batch.set(userProfileRef, { 
            username: username, 
            email: user.email, 
            createdAt: serverTimestamp(), 
            reflectionScore: 0,
            playerColor: '#00bcd4',
            projectileColor: '#00bcd4',
            
            controls: {
                fire: 'q',
                stop: 's'
            }
        });
        
        batch.set(usernameRef, { userId: user.uid, email: user.email }); 
        await batch.commit();
        return user; 
    } catch (error) {
        throw error;
    }
}

/**
 * Sadece kullanıcının mevcut şifresini doğrulayarak kimliğini yeniden doğrular.
 * @param {string} currentPassword - Kullanıcının girdiği mevcut şifre.
 */
export async function reauthenticateUser(currentPassword) {
    const user = auth.currentUser;
    if (!user) throw new Error("Oturum açık olmalı.");

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    try {
        await reauthenticateWithCredential(user, credential);
        // Eğer buraya kadar geldiyse, şifre doğrudur. Hiçbir şey döndürmesine gerek yok.
    } catch (reauthError) {
        // Eğer eski şifre yanlışsa, özel hata mesajımızı fırlatıyoruz.
        throw new Error("error_password_wrong");
    }
}

/**
 * Sadece yeni şifreyi günceller. Bu fonksiyonun çalıştırılmadan önce
 * kullanıcının kimliğinin doğrulanmış olduğu varsayılır.
 * @param {string} newPassword - Kullanıcının girdiği yeni şifre.
 */
export async function updateUserPassword(newPassword) {
    const user = auth.currentUser;
    if (!user) throw new Error("Oturum açık olmalı.");

    try {
        await updatePassword(user, newPassword);
    } catch (updateError) {
        if (updateError.code === 'auth/weak-password') {
            throw new Error("error_password_length_8"); // Firebase min 6 ister, biz 8 istiyoruz. UI'da kontrol ediyoruz ama bu bir sigorta.
        }
        throw new Error("error_generic");
    }
}

export async function updatePlayerColors(userId, playerColor, projectileColor) {
    if (!userId) return;
    const userProfileRef = doc(db, 'users', userId);
    try {
        const dataToUpdate = {};
        if (playerColor) dataToUpdate.playerColor = playerColor;
        if (projectileColor) dataToUpdate.projectileColor = projectileColor;
        
        await setDoc(userProfileRef, dataToUpdate, { merge: true });
    } catch (error) {
        console.error("Oyuncu renkleri güncellenirken hata:", error);
    }
}

export async function updateReflectionScore(userId, pointsToAdd) {
    if (!userId || pointsToAdd <= 0) return;
    const userProfileRef = doc(db, 'users', userId);
    
    try {
        // Fonksiyon sadece Firestore'daki değeri artırmakla sorumlu.
        await setDoc(userProfileRef, { 
            reflectionScore: increment(pointsToAdd) 
        }, { merge: true });

    } catch (error) {
        console.error("Efsane Yankısı güncellenirken hata:", error);
    }
}


export async function loginWithIdentifier(identifier, password) {
    let email = identifier.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
        const username = identifier.toLowerCase();
        const usernameRef = doc(db, "usernames", username);
        const usernameDoc = await getDoc(usernameRef);
        if (usernameDoc.exists()) {
            email = usernameDoc.data().email;
        } else {
            throw { code: "auth/user-not-found" };
        }
    }
    return signInWithEmailAndPassword(auth, email, password);
}

export function logoutUser() { return signOut(auth); }

export async function getUserProfile(userId) {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return { uid: userId, ...docSnap.data() };
    } else {
        console.warn("Kullanıcı profili bulunamadı!");
        return null;
    }
}

export async function resendVerificationEmail() {
    const user = auth.currentUser;
    if (!user) throw new Error("E-posta göndermek için oturum açık olmalı.");
    try {
        await sendEmailVerification(user);
    } catch (error) {
        throw error;
    }
}

export async function sendPasswordReset(email) {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        if (error.code !== 'auth/user-not-found') {
            throw error;
        }
    }
}

export async function setAuthPersistence(rememberMe) {
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    try {
        await setPersistence(auth, persistenceType);
    } catch (error) {
        console.error("Oturum kalıcılığı ayarlanamadı:", error);
    }
}

// --- HIGHSCORE FUNCTIONS (Firestore) ---
export async function saveHighScore(mode, finalScore, userProfile, subCategory = null) {
    if (!userProfile || (finalScore <= 0 && subCategory === null)) return;

    // ===== ANA DEĞİŞİKLİK BURADA =====
    // Modun zaman bazlı olup olmadığını kontrol et.
    const isTimeBased = (
        mode === 'REFLECTION_BOSS' || 
        mode === 'KAOS' || 
        mode === 'DODGE_ONLY'
    );

    // Eğer mod zaman bazlı ise skoru 2 ondalık basamağa yuvarla.
    // Değilse (Kill bazlıysa), tam sayı olarak bırak.
    const scoreToSave = isTimeBased ? parseFloat(finalScore.toFixed(2)) : Math.floor(finalScore);
    // ===================================
    
    // Paradox modu için özel sorgu
    const scoresRef = collection(db, 'highscores');
    let q;
    if (mode === 'REFLECTION_BOSS') {
        q = query(scoresRef, 
            where("userId", "==", userProfile.uid), 
            where("mode", "==", mode),
            where("subCategory", "==", subCategory)
        );
    } else {
        q = query(scoresRef, where("userId", "==", userProfile.uid), where("mode", "==", mode));
    }
    
    try {
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        if (querySnapshot.empty) {
            // Yeni skor belgesi oluştur
            const newScoreRef = doc(scoresRef);
            const scoreData = {
                mode: mode,
                score: scoreToSave, // Artık doğru formatta
                userId: userProfile.uid,
                username: userProfile.username,
                timestamp: serverTimestamp()
            };
            if (subCategory) {
                scoreData.subCategory = subCategory;
            }
            batch.set(newScoreRef, scoreData);

        } else {
            // Mevcut skoru güncelle
            const existingDoc = querySnapshot.docs[0];
            const existingScore = existingDoc.data().score;
            
            let shouldUpdate = false;
            if (subCategory === 'victory') {
                // Zafer için: daha DÜŞÜK skor daha iyidir
                if (scoreToSave < existingScore) shouldUpdate = true;
            } else {
                // Diğer her şey için: daha YÜKSEK skor daha iyidir
                if (scoreToSave > existingScore) shouldUpdate = true;
            }

            if (shouldUpdate) {
                batch.update(existingDoc.ref, { score: scoreToSave, timestamp: serverTimestamp() });
            } else {
                return;
            }
        }
        await batch.commit();
    } catch (error) {
        console.error("Skor kaydedilirken hata:", error);
    }
}

export async function getHighScores() {
    const allScores = {};
    const modes = ['SKILL_DODGE', 'KITE_ONLY', 'KAOS', 'DODGE_ONLY'];
    const modeUnits = { SKILL_DODGE: 'Kills', KITE_ONLY: 'Kills', KAOS: 's', DODGE_ONLY: 's' };

    for (const mode of modes) {
        const q = query(collection(db, 'highscores'), where('mode', '==', mode), orderBy('score', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        allScores[mode] = { scores: snapshot.docs.map(doc => doc.data()), unit: modeUnits[mode] };
    }

    // Paradox - Zaferler
    const vicQ = query(collection(db, 'highscores'), where('subCategory', '==', 'victory'), orderBy('score', 'asc'), limit(100));
    const vicSnap = await getDocs(vicQ);
    allScores['REFLECTION_VICTORIES'] = { scores: vicSnap.docs.map(doc => doc.data()), unit: 's' };

    // Paradox - Direniş
    const survQ = query(collection(db, 'highscores'), where('subCategory', '==', 'survival'), orderBy('score', 'desc'), limit(100));
    const survSnap = await getDocs(survQ);
    allScores['REFLECTION_SURVIVALS'] = { scores: survSnap.docs.map(doc => doc.data()), unit: 's' };

    return allScores;
}

export async function getUserHighScores(userId) {
    if (!userId) return {};
    const userScores = {};
    const q = query(collection(db, 'highscores'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.mode === 'REFLECTION_BOSS') {
            if (data.subCategory === 'victory') {
                userScores['REFLECTION_VICTORIES'] = data.score;
            } else if (data.subCategory === 'survival') {
                userScores['REFLECTION_SURVIVALS'] = data.score;
            }
        } else {
            userScores[data.mode] = data.score;
        }
    });
    return userScores;
}

/**
 * "Bize Ulaşın" formundan gelen geri bildirimi Firestore'a kaydeder.
 * @param {object} userProfile - Geri bildirimi gönderen kullanıcının profili.
 * @param {string} feedbackText - Kullanıcının yazdığı mesaj.
 * @param {string} category - Seçilen kategori ('Bug Report', 'Suggestion', 'General').
 */
export async function sendFeedback(userProfile, feedbackText, category) {
    if (!userProfile || !feedbackText || !category) return;
    const feedbackRef = collection(db, 'feedback');
    await addDoc(feedbackRef, {
        userId: userProfile.uid,
        username: userProfile.username,
        feedbackText: feedbackText,
        category: category,
        timestamp: serverTimestamp(),
        status: 'New'
    });
}

// --- ACCOUNT DELETION FUNCTION ---
export async function deleteUserAccount(password, feedback, userProfile) {
    const user = auth.currentUser;
    if (!user) throw new Error("Oturum açık olmalı.");
    
    // 1. Kullanıcının kimliğini, şifresini yeniden isteyerek doğrula
    const credential = EmailAuthProvider.credential(user.email, password);
    try {
        await reauthenticateWithCredential(user, credential);
    } catch (reauthError) {
        throw new Error("error_password_wrong");
    }

    // 2. Eğer kullanıcı bir geri bildirim yazdıysa, bunu 'feedback' koleksiyonuna kaydet
    if (feedback.trim() !== '') {
        try {
            // ESKİ: 'deletion_feedback' koleksiyonuna yazılıyordu.
            // YENİ: Artık genel 'feedback' koleksiyonuna yazılıyor.
            const feedbackRef = collection(db, 'feedback');
            await addDoc(feedbackRef, {
                userId: user.uid,
                username: userProfile.username,
                feedbackText: feedback,         // Alan adını standart hale getirdik ('feedback' -> 'feedbackText')
                category: 'Account Deletion',   // Bu geri bildirimin türünü belirtiyoruz
                timestamp: serverTimestamp(),
                status: 'New'                   // Tüm geri bildirimlerle tutarlı olması için status ekledik
            });
        } catch (e) { 
            console.warn("Hesap silme geri bildirimi kaydedilemedi:", e); 
        }
    }

    // 3. Kullanıcıya ait tüm verileri (profil, kullanıcı adı, skorlar) sil
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', user.uid));
    batch.delete(doc(db, 'usernames', userProfile.username.toLowerCase()));
    
    const scoresQuery = query(collection(db, 'highscores'), where('userId', '==', user.uid));
    const scoresSnapshot = await getDocs(scoresQuery);
    scoresSnapshot.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();

    // 4. Son olarak, Firebase Authentication'dan kullanıcıyı sil
    await deleteUser(user);
}

// generateSecureToken'ı dosyanın içinde tutuyoruz, export etmeye gerek kalmadı.
function generateSecureToken() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
           .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Kullanıcı için geçerli bir davet linki oluşturur veya mevcut olanı döndürür.
 * @param {object} userProfile - Daveti oluşturan kullanıcının profili.
 * @returns {Promise<string>} Kullanıcının geçerli davet token'ı.
 */
export async function getOrCreateInvitationToken(userProfile) {
    if (!userProfile || !userProfile.uid) throw new Error("Kullanıcı profili gerekli.");

    const invitationsRef = collection(db, 'invitations');
    const now = Timestamp.now();

    // 1. Bu kullanıcıya ait, süresi dolmamış bir davet var mı diye kontrol et
    const q = query(
        invitationsRef,
        where("userId", "==", userProfile.uid),
        where("expiresAt", ">", now),
        orderBy("expiresAt", "desc"), // En yeni daveti al
        limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // 2. Eğer geçerli bir davet bulunduysa, onun token'ını (yani belge ID'sini) döndür
        const existingInvitation = querySnapshot.docs[0];
        return existingInvitation.id;
    } else {
        // 3. Eğer geçerli bir davet yoksa, yeni bir tane oluştur
        const token = generateSecureToken();
        const newInvitationRef = doc(db, 'invitations', token);
        const expiration = new Timestamp(now.seconds + 86400, now.nanoseconds); // 24 saat

        await setDoc(newInvitationRef, {
            userId: userProfile.uid,
            username: userProfile.username,
            createdAt: now,
            expiresAt: expiration
        });

        return token;
    }
}

/**
 * Verilen bir davet token'ını doğrular ve detaylarını getirir.
 * @param {string} token - URL'den alınan davet token'ı.
 * @returns {Promise<object|null>} Davet geçerliyse {username, scores}, değilse null.
 */
export async function getInvitationDetails(token) {
    if (!token) return null;

    const invitationRef = doc(db, 'invitations', token);
    const invitationDoc = await getDoc(invitationRef);

    if (!invitationDoc.exists()) {
        console.error("Geçersiz davet token'ı.");
        return null;
    }

    const invitationData = invitationDoc.data();

    // Zaman aşımı kontrolü
    if (Timestamp.now() > invitationData.expiresAt) {
        console.error("Süresi dolmuş davet token'ı.");
        return null;
    }

    // Davet geçerliyse, ilgili kullanıcının skorlarını getir
    const scores = await getUserHighScores(invitationData.userId);

    return {
        username: invitationData.username,
        scores: scores || {} // Skor yoksa boş obje döndür
    };
}

/**
 * Bir kullanıcının kontrol ayarlarını Firestore'da günceller.
 * @param {string} userId - Güncellenecek kullanıcının ID'si.
 * @param {object} newControls - { fire: 'e', stop: 'w' } gibi yeni kontrol nesnesi.
 */
export async function updateUserControls(userId, newControls) {
    if (!userId || !newControls) return;

    const userProfileRef = doc(db, 'users', userId);
    try {
        // { merge: true } sayesinde sadece 'controls' alanı güncellenir,
        // profilin geri kalanına dokunulmaz.
        await setDoc(userProfileRef, { controls: newControls }, { merge: true });
    } catch (error) {
        console.error("Kullanıcı kontrolleri güncellenirken hata:", error);
        throw error; // Hatayı, UI'da göstermek için yukarıya fırlat
    }
}

/**
 * Süresi dolmuş tüm davet belgelerini veritabanından siler.
 * @returns {Promise<number>} Silinen belge sayısı.
 */
async function deleteExpiredInvitations() {
    const invitationsRef = collection(db, 'invitations');
    const now = Timestamp.now();

    // Süresi dolmuş davetleri bul
    const q = query(invitationsRef, where('expiresAt', '<=', now));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return 0; // Silinecek bir şey yok
    }

    // Bulunanları toplu halde sil
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`[Temizlik] ${snapshot.size} adet süresi dolmuş davet silindi.`);
    return snapshot.size;
}

/**
 * Gerekliyse (son temizlikten bu yana 24 saatten fazla geçtiyse)
 * süresi dolmuş davetleri temizler.
 */
export async function triggerInvitationCleanup() {
    const metadataRef = doc(db, 'metadata', 'cleanup');
    const metadataDoc = await getDoc(metadataRef);

    const now = Timestamp.now();
    const TWENTY_FOUR_HOURS_IN_SECONDS = 86400;

    if (metadataDoc.exists()) {
        const lastCleanup = metadataDoc.data().lastInvitationCleanup;
        if (lastCleanup && (now.seconds - lastCleanup.seconds < TWENTY_FOUR_HOURS_IN_SECONDS)) {
            // Henüz 24 saat geçmemiş, bir şey yapma.
            return;
        }
    }

    // 24 saat geçtiyse veya hiç temizlik yapılmadıysa:
    try {
        await deleteExpiredInvitations();
        // Temizlik bittiğinde, son temizlik zamanını güncelle.
        await setDoc(metadataRef, { lastInvitationCleanup: now });
    } catch (error) {
        console.error("[Temizlik] Süresi dolmuş davetler temizlenirken hata oluştu:", error);
    }
}


// --- ERROR MESSAGE HELPER ---
export function getErrorMessageKey(error) {
    if (!error || !error.code) return "error_generic";
    switch (error.code) {
        case "auth/username-already-in-use":
            return "error_username_taken";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "error_login_failed";
        case "auth/email-already-in-use":
            return "error_email_in_use";
        case "auth/invalid-email":
            return "error_login_failed";
        case "auth/weak-password":
            return "error_password_length";
        case "auth/too-many-requests":
            return "error_resend_too_many";
        case "auth/network-request-failed":
            return "error_generic";
        default:
            console.error("Bilinmeyen Firebase Hatası:", error);
            return "error_generic";
    }
}