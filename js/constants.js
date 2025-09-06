// OYUN AYARLARI
export const MOVEMENT_SPEED = 2.2;
export const PROJECTILE_SPEED = 5;
export const DODGE_PROJECTILE_SPEED = 3.5;
export const PLAYER_FIRE_COOLDOWN = 500; // ms

// VARLIK BOYUTLARI
export const PLAYER_RADIUS = 15;
export const PROJECTILE_RADIUS = 7;
export const ENEMY_RADIUS = 16;
export const LASER_WARNING_WIDTH = 10;
export const LASER_BEAM_WIDTH = 25;

// RENKLER
export const PLAYER_COLOR = '#00bcd4';
export const ENEMY_SHOOTER_COLOR = 'orange';
export const ENEMY_RUSHER_COLOR = '#ff5252';
export const PLAYER_PROJECTILE_COLOR = '#00bcd4';
export const ENEMY_PROJECTILE_COLOR = '#ff5252';
export const ENV_PROJECTILE_COLOR = '#f9a825';
export const LASER_CHARGE_COLOR = 'rgba(255, 82, 82, 0.4)';
export const LASER_FIRE_COLOR = 'white';
export const LASER_SHADOW_COLOR = 'red';

// ZORLUK AYARLARI & OYUN DENGESİ
export const SCALING_DURATION = 60; // saniye
export const KILLS_TO_MAX_DIFFICULTY = 25;
export const ABSOLUTE_MAX_ENEMIES = 10;
export const KITE_ENEMY_MIN_DISTANCE = 200;
export const SHOOTER_ENEMY_FIRE_RANGE = 700;
export const PROJECTILE_BUFFER = 50; // Mermilerin ekran dışına ne kadar çıkabileceği

// LAZER AYARLARI
export const LASER_CHARGE_DURATION = 1000; // ms
export const LASER_FIRE_DURATION = 200; // ms

// SKILL_DODGE MODU AYARLARI
export const SKILL_DODGE_SPAWN_INTERVAL_START = 3000;
export const SKILL_DODGE_SPAWN_INTERVAL_END = 800;
export const SKILL_DODGE_FIRE_INTERVAL_START = 1500;
export const SKILL_DODGE_FIRE_INTERVAL_END = 750;

// KITE_ONLY MODU AYARLARI
export const KITE_ONLY_SPAWN_INTERVAL_START = 3000;
export const KITE_ONLY_SPAWN_INTERVAL_END = 400;

// DODGE_ONLY MODU AYARLARI
export const DODGE_ONLY_BOT_PROJECTILE_INTERVAL_START = 1000;
export const DODGE_ONLY_BOT_PROJECTILE_INTERVAL_END = 300;
export const DODGE_ONLY_RANDOM_PROJECTILE_INTERVAL_START = 1200;
export const DODGE_ONLY_RANDOM_PROJECTILE_INTERVAL_END = 400;
export const DODGE_ONLY_LASER_INTERVAL_START = 7000;
export const DODGE_ONLY_LASER_INTERVAL_END = 2000;

// KAOS MODU AYARLARI
export const KAOS_SPAWN_INTERVAL_START = 4000;
export const KAOS_SPAWN_INTERVAL_END = 600;
export const KAOS_RANDOM_PROJECTILE_INTERVAL_START = 2500;
export const KAOS_RANDOM_PROJECTILE_INTERVAL_END = 800;
export const KAOS_LASER_INTERVAL_START = 12000;
export const KAOS_LASER_INTERVAL_END = 4000;

// YANSIMA MODU AYARLARI
export const REFLECTION_FIRE_COOLDOWN = 1000;
export const REFLECTION_PROJECTILE_COLOR = '#E34234';
export const REFLECTION_COLOR = '#ff3838';

// YENİ: STANDART CANAVAR AYARLARI
export const MONSTER_IDEAL_DISTANCE = 275; // Canavarın oyuncuyla korumak isteyeceği ideal mesafe
export const MONSTER_BASE_ACCURACY = 0.75;  // Canavarın temel isabet oranı (0.0 - 1.0 arası)

// YANSIMA MODU SKORLAMA SİSTEMİ
export const REFLECTION_BASE_VICTORY_SCORE = 100;   // Zafer için alınacak minimum taban puan
export const REFLECTION_SPEED_BONUS_POOL = 5000;    

// YENİ EKLENEN MESAFE KONTROLÜ AYARLARI
export const REFLECTION_MIN_DISTANCE = 150; // Bu mesafeden daha yakınsa geri çekil
export const REFLECTION_MAX_DISTANCE = 300; // Bu mesafeden daha uzaksa yaklaş

// YENİ KARARLILIK SÜRESİ
export const REFLECTION_DODGE_COMMITMENT_MS = 400;


