// Shared game state and utilities
export const CONSTANTS = {
    interactionDistance: 110,
    elfMargin: 50,
    particlePoolSize: 24,
    floatingTextPoolSize: 16,
    particleColors: ['#ffd700', '#ff8c42', '#7ad7f0'],
    soundVolume: 0.4,
    streakWindowMs: 4500,
    streakSpeedBonus: 60,
    streakMaxBonus: 3
};

export const gameState = {
    timeLeft: 180,
    level: 1,
    totalDeliveries: 0,
    currentLevelDeliveries: 0,
    orderQueue: [],
    maxOrdersInQueue: 2,
    elf: {
        x: 400,
        y: 300,
        speed: 280,
        baseSpeed: 280,
        carrying: null,
        width: 60,
        height: 80
    },
    stations: {},
    blockers: [],
    difficulty: null,
    difficultySettings: {
        easy: { startOrders: 1, increaseEveryLevels: 2, singleQuantityChance: 0.7 },
        medium: { startOrders: 1, increaseEveryLevels: 1, singleQuantityChance: 0.5 },
        hard: { startOrders: 2, increaseEveryLevels: 1, singleQuantityChance: 0.4 }
    },
    keys: { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, e: false, c: false, Escape: false },
    lastFrameTime: Date.now(),
    timerInterval: null,
    isGameRunning: false,
    paused: false,
    streak: { count: 0, lastDelivery: 0, multiplier: 1 }
};

export const toyRecipes = {
    train: { wood: 2, metal: 2 },
    'christmas-tree': { wood: 3, fabric: 1 },
    gingerbread: { wood: 1, fabric: 1 },
    teddy: { wood: 1, fabric: 3 },
    nutcracker: { wood: 2, metal: 2, fabric: 1 }
};

export const levelConfig = [
    { requiredDeliveries: 3, timeLimit: 180, availableToys: ['train'] },
    { requiredDeliveries: 4, timeLimit: 150, availableToys: ['train', 'christmas-tree'] },
    { requiredDeliveries: 5, timeLimit: 150, availableToys: ['train', 'christmas-tree', 'gingerbread'] },
    { requiredDeliveries: 6, timeLimit: 180, availableToys: ['train', 'christmas-tree', 'gingerbread', 'teddy'] },
    { requiredDeliveries: 7, timeLimit: 180, availableToys: ['train', 'christmas-tree', 'gingerbread', 'teddy', 'nutcracker'] }
];

export const resourceIcons = { wood: '🪵', metal: '🔩', fabric: '🧵' };

export const soundLibrary = {
    pickup: new Audio('pickup.mp3'),
    craft: new Audio('craft.mp3'),
    deliver: new Audio('deliver.mp3')
};
Object.values(soundLibrary).forEach(a => (a.volume = CONSTANTS.soundVolume));

export const craftingTable = {};
export const floatingTextPool = [];
export const particlePool = [];

export const events = {
    listeners: {},
    on(name, cb) {
        if (!this.listeners[name]) this.listeners[name] = [];
        this.listeners[name].push(cb);
    },
    emit(name, payload) {
        (this.listeners[name] || []).forEach(cb => cb(payload));
    }
};

export function ensureEffectPools() {
    while (floatingTextPool.length < CONSTANTS.floatingTextPoolSize) {
        const el = document.createElement('div');
        el.className = 'floating-text';
        el.style.display = 'none';
        document.body.appendChild(el);
        floatingTextPool.push(el);
    }
    while (particlePool.length < CONSTANTS.particlePoolSize) {
        const el = document.createElement('div');
        el.className = 'particle';
        el.style.display = 'none';
        document.body.appendChild(el);
        particlePool.push(el);
    }
}

export function playSound(name) {
    const snd = soundLibrary[name];
    if (!snd) return;
    try {
        snd.currentTime = 0;
        snd.play();
    } catch (_) {}
}

export function spawnFloatingText(text, x, y) {
    ensureEffectPools();
    const el = floatingTextPool.find(n => n.style.display === 'none') || floatingTextPool[0];
    if (!el) return;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.display = 'block';
    el.classList.remove('animating');
    void el.offsetWidth;
    el.classList.add('animating');
    setTimeout(() => (el.style.display = 'none'), 820);
}

export function spawnParticles(x, y) {
    ensureEffectPools();
    for (let i = 0; i < 4; i++) {
        const el = particlePool.find(n => n.style.display === 'none') || particlePool[0];
        if (!el) continue;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.background = CONSTANTS.particleColors[i % CONSTANTS.particleColors.length];
        el.style.display = 'block';
        el.classList.remove('animating');
        void el.offsetWidth;
        el.classList.add('animating');
        setTimeout(() => (el.style.display = 'none'), 520);
    }
}

export function announce(message) {
    const live = document.getElementById('aria-live');
    if (live) live.textContent = message;
}

export function scheduleIdle(fn) {
    if (window.requestIdleCallback) {
        window.requestIdleCallback(fn, { timeout: 150 });
    } else {
        setTimeout(fn, 0);
    }
}
