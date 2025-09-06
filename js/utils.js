// Ekranın kenarından rastgele bir başlangıç pozisyonu üretir
export function getRandomSpawnPosition(canvasWidth, canvasHeight, radius) {
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { x = Math.random() * canvasWidth; y = 0 - radius; } 
    else if (edge === 1) { x = canvasWidth + radius; y = Math.random() * canvasHeight; } 
    else if (edge === 2) { x = Math.random() * canvasWidth; y = canvasHeight + radius; } 
    else { x = 0 - radius; y = Math.random() * canvasHeight; }
    return { x, y };
}

// İki nokta arasındaki açıyı radyan cinsinden hesaplar
export function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// İki nokta arasındaki mesafeyi hesaplar
export function getDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

// Bir değerin belirli bir aralık içinde kalmasını sağlar (clamp)
export function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}