// ==============================================
// GAME STATE
// ==============================================

const CONSTANTS = {
    interactionDistance: 110,
    elfMargin: 50,
    particlePoolSize: 24,
    floatingTextPoolSize: 16,
    particleColors: ['#ffd700', '#ff8c42', '#7ad7f0'],
    soundVolume: 0.4
};

const gameState = {
    timeLeft: 180, // 3 minutes in seconds
    level: 1,
    totalDeliveries: 0,
    currentLevelDeliveries: 0,
    orderQueue: [],
    maxOrdersInQueue: 2,
    elf: {
        x: 400,
        y: 300,
        speed: 280, // pixels per second (faster)
        carrying: null, // {type: 'resource', resource: 'wood'} or {type: 'crafted', toyName: 'train'}
        // 🔧 ELF HITBOX: Adjust width/height to change collision detection size
        // Should be smaller than visual sprite size for better feel
        width: 50,
        height: 60
    },
    stations: {}, // Will store station positions
    blockers: [], // Collision rectangles for stations
    difficulty: null,
    difficultySettings: {
        easy: {
            startOrders: 1,
            increaseEveryLevels: 2,
            singleQuantityChance: 0.7
        },
        medium: {
            startOrders: 1,
            increaseEveryLevels: 1,
            singleQuantityChance: 0.5
        },
        hard: {
            startOrders: 2,
            increaseEveryLevels: 1,
            singleQuantityChance: 0.4
        }
    },
    keys: {
        w: false,
        a: false,
        s: false,
        d: false,
        ArrowUp: false,
        ArrowLeft: false,
        ArrowDown: false,
        ArrowRight: false,
        e: false, // Interaction key (pickup/deposit/deliver)
        c: false, // Craft key
        Escape: false
    },
    lastFrameTime: Date.now(),
    timerInterval: null,
    isGameRunning: false,
    paused: false
};

// Simple event bus for decoupling
const events = {
    listeners: {},
    on(name, cb) {
        if (!this.listeners[name]) this.listeners[name] = [];
        this.listeners[name].push(cb);
    },
    emit(name, payload) {
        (this.listeners[name] || []).forEach(cb => cb(payload));
    }
};

// ==============================================
// TOY RECIPES
// Add new toy recipes here
// ==============================================

const toyRecipes = {
    train: {
        wood: 2,
        metal: 2
    },
    "christmas-tree": {
        wood: 3,
        fabric: 1
    },
    "gingerbread": {
        wood: 1,
        fabric: 1
    },
    teddy: {
        wood: 1,
        fabric: 3
    },
    nutcracker: {
        wood: 2,
        metal: 2,
        fabric: 1
    }
};

const resourceIcons = {
    wood: '🪵',
    metal: '🔩',
    fabric: '🧵'
};

const soundLibrary = {
    pickup: new Audio('pickup.mp3'),
    craft: new Audio('craft.mp3'),
    deliver: new Audio('deliver.mp3')
};
Object.values(soundLibrary).forEach(audio => {
    audio.volume = CONSTANTS.soundVolume;
});

// Pools for lightweight effects to avoid DOM churn
const floatingTextPool = [];
const particlePool = [];

// Level configuration - defines difficulty progression
const levelConfig = [
    { requiredDeliveries: 3, timeLimit: 180, availableToys: ['train'] },
    { requiredDeliveries: 4, timeLimit: 150, availableToys: ['train', 'christmas-tree'] },
    { requiredDeliveries: 5, timeLimit: 150, availableToys: ['train', 'christmas-tree', 'gingerbread'] },
    { requiredDeliveries: 6, timeLimit: 180, availableToys: ['train', 'christmas-tree', 'gingerbread', 'teddy'] },
    { requiredDeliveries: 7, timeLimit: 180, availableToys: ['train', 'christmas-tree', 'gingerbread', 'teddy', 'nutcracker'] }
];

// ==============================================
// TIMER FUNCTIONS
// ==============================================

function updateTimer() {
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    document.getElementById('timer-value').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ==============================================
// DELIVERY COUNTER
// ==============================================

function updateDeliveryCounter() {
    // Show the number of orders currently on the scroll
    document.getElementById('delivery-count').textContent = gameState.orderQueue.length;
}

function completeDelivery() {
    gameState.currentLevelDeliveries++;
    gameState.totalDeliveries++;
    updateDeliveryCounter();
    
    const currentConfig = levelConfig[gameState.level - 1];
    if (gameState.currentLevelDeliveries >= currentConfig.requiredDeliveries) {
        levelComplete();
    } else {
        // Do not spawn a replacement order; leave the scroll list shrinking as orders are completed
    }
}

function getSingleQuantityChance() {
    const d = gameState.difficulty || 'medium';
    return gameState.difficultySettings[d].singleQuantityChance;
}

// ==============================================
// LEVEL SYSTEM
// ==============================================

function levelComplete() {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    
    if (gameState.level >= levelConfig.length) {
        gameWon();
        return;
    }
    
    // Advance to next level, carry over remaining time
    gameState.level++;
    gameState.currentLevelDeliveries = 0;
    const nextConfig = levelConfig[gameState.level - 1];
    gameState.timeLeft += nextConfig.timeLimit;
    
    // Progress difficulty-based number of simultaneous orders
    const settings = gameState.difficultySettings[gameState.difficulty || 'medium'];
    if ((gameState.level - 1) % settings.increaseEveryLevels === 0) {
        gameState.maxOrdersInQueue = Math.min(4, gameState.maxOrdersInQueue + 1);
    }

    // Clear current orders and generate new ones
    gameState.orderQueue = [];
    generateInitialOrders();
    
    updateDeliveryCounter();
    updateTimer();
    updateLevelDisplay();
    
    alert(`Level ${gameState.level - 1} Complete! Starting Level ${gameState.level}\nTime Bonus: +${nextConfig.timeLimit} seconds`);
    
    startTimer();
}

function updateLevelDisplay() {
    document.getElementById('level-value').textContent = gameState.level;
}

function generateNewOrder() {
    const currentConfig = levelConfig[gameState.level - 1];
    const remainingNeeded = currentConfig.requiredDeliveries - gameState.currentLevelDeliveries - gameState.orderQueue.length;

    // Guard: do not exceed maxOrdersInQueue or the remaining deliveries required for this level
    if (gameState.orderQueue.length >= gameState.maxOrdersInQueue || remainingNeeded <= 0) {
        return;
    }
    const availableToys = currentConfig.availableToys.slice();
    // Prefer toys not already present to reduce duplicates
    const inQueueNames = new Set(gameState.orderQueue.map(o => o.toyName));
    const notInQueue = availableToys.filter(t => !inQueueNames.has(t));
    const pool = notInQueue.length > 0 ? notInQueue : availableToys;
    const randomToy = pool[Math.floor(Math.random() * pool.length)];

    const order = {
        toyName: randomToy,
        recipe: toyRecipes[randomToy],
        id: Date.now()
    };
    gameState.orderQueue.push(order);
    updateOrderDisplay();
    updateCraftingProgress();
    updateDeliveryCounter();
}

function generateInitialOrders() {
    const currentConfig = levelConfig[gameState.level - 1];
    const initialCount = Math.min(gameState.maxOrdersInQueue, currentConfig.requiredDeliveries);
    for (let i = 0; i < initialCount; i++) {
        generateNewOrder();
    }
    updateDeliveryCounter();
}

function updateOrderDisplay() {
    const recipeScroll = document.querySelector('.recipe-scroll');
    recipeScroll.innerHTML = '';
    
    gameState.orderQueue.forEach(order => {
        const recipeItem = document.createElement('div');
        recipeItem.className = `recipe-item toy-${order.toyName}`;
        recipeItem.dataset.orderId = order.id;
        
        const itemName = document.createElement('div');
        itemName.className = 'recipe-item-name';
        itemName.textContent = `Item: ${order.toyName}`;
        
        const materials = document.createElement('div');
        materials.className = 'materials';
        
        for (const [resource, amount] of Object.entries(order.recipe)) {
            const materialDiv = document.createElement('div');
            materialDiv.textContent = `${amount}x ${resource}`;
            materials.appendChild(materialDiv);
        }
        
        recipeItem.appendChild(itemName);
        recipeItem.appendChild(materials);
        recipeScroll.appendChild(recipeItem);
    });

    markCraftableOrders();
}

function canCraftOrder(order) {
    for (const [resource, needed] of Object.entries(order.recipe)) {
        if (!craftingTable[resource] || craftingTable[resource] < needed) {
            return false;
        }
    }
    return true;
}

function markCraftableOrders() {
    const scroll = document.querySelector('.recipe-scroll');
    if (!scroll) return;
    scroll.querySelectorAll('.recipe-item').forEach(item => {
        const orderId = item.dataset.orderId;
        const order = gameState.orderQueue.find(o => o.id.toString() === orderId);
        if (order && canCraftOrder(order)) {
            item.classList.add('craftable');
        } else {
            item.classList.remove('craftable');
        }
    });
}

function updateCraftingProgress() {
    const bar = document.querySelector('.crafting-progress-bar');
    const needsLabel = document.getElementById('crafting-needs');
    if (!bar || !needsLabel) return;
    if (gameState.orderQueue.length === 0) {
        bar.style.width = '0%';
        needsLabel.textContent = 'Needs: waiting for orders';
        return;
    }
    const order = gameState.orderQueue[0];
    let have = 0;
    let need = 0;
    const missingList = [];
    for (const [res, qty] of Object.entries(order.recipe)) {
        need += qty;
        const haveQty = craftingTable[res] || 0;
        have += Math.min(haveQty, qty);
        if (haveQty < qty) missingList.push(`${resourceIcons[res] || res} x${qty - haveQty}`);
    }
    const pct = need === 0 ? 0 : Math.min(100, (have / need) * 100);
    bar.style.width = `${pct}%`;
    bar.parentElement.setAttribute('aria-valuenow', Math.round(pct));
    needsLabel.textContent = missingList.length === 0 ? 'Ready to craft!' : `Needs: ${missingList.join(', ')}`;
}

function playSound(name) {
    const snd = soundLibrary[name];
    if (!snd) return;
    try {
        snd.currentTime = 0;
        snd.play();
    } catch (e) {
        // ignore autoplay issues
    }
}

function ensureEffectPools() {
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

function spawnFloatingText(text, x, y) {
    ensureEffectPools();
    const el = floatingTextPool.find(n => n.style.display === 'none') || floatingTextPool[0];
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.display = 'block';
    el.classList.remove('animating');
    void el.offsetWidth; // restart animation
    el.classList.add('animating');
    setTimeout(() => { el.style.display = 'none'; }, 800);
}

function spawnParticles(x, y) {
    ensureEffectPools();
    for (let i = 0; i < 4; i++) {
        const el = particlePool.find(n => n.style.display === 'none') || particlePool[0];
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.background = CONSTANTS.particleColors[i % CONSTANTS.particleColors.length];
        el.style.display = 'block';
        el.classList.remove('animating');
        void el.offsetWidth;
        el.classList.add('animating');
        setTimeout(() => { el.style.display = 'none'; }, 500);
    }
}

// ==============================================
// ELF MOVEMENT & CONTROLS
// ==============================================

function updateElfPosition(deltaTime) {
    const elf = gameState.elf;
    let dx = 0;
    let dy = 0;
    
    // WASD-only movement
    if (gameState.keys.w) dy -= 1;
    if (gameState.keys.s) dy += 1;
    if (gameState.keys.a) dx -= 1;
    if (gameState.keys.d) dx += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }
    
    // Apply movement with collision resolution
    const prevX = elf.x;
    const prevY = elf.y;
    elf.x += dx * elf.speed * deltaTime;
    elf.y += dy * elf.speed * deltaTime;
    
    // Clamp to screen bounds
    const margin = CONSTANTS.elfMargin;
    elf.x = Math.max(margin, Math.min(window.innerWidth - margin - elf.width, elf.x));
    elf.y = Math.max(margin, Math.min(window.innerHeight - margin - elf.height, elf.y));

    resolveCollisions(prevX, prevY);
    
    // Update visual position
    const elfElement = document.querySelector('.elf');
    elfElement.style.left = `${elf.x}px`;
    elfElement.style.top = `${elf.y}px`;

    // Update animation state and facing
    const moving = (dx !== 0 || dy !== 0);
    if (!gameState.elf.facing) gameState.elf.facing = 'down';

    if (moving) {
        elfElement.classList.add('is-walking');
        elfElement.classList.remove('is-idle');
        if (gameState.keys.w && !gameState.keys.s) gameState.elf.facing = 'up';
        if (gameState.keys.s && !gameState.keys.w) gameState.elf.facing = 'down';
        if (gameState.keys.a && !gameState.keys.d) gameState.elf.facing = 'left';
        if (gameState.keys.d && !gameState.keys.a) gameState.elf.facing = 'right';
    } else {
        elfElement.classList.remove('is-walking');
        elfElement.classList.add('is-idle');
    }

    ['is-up','is-down','is-left','is-right'].forEach(c => elfElement.classList.remove(c));
    elfElement.classList.add(`is-${gameState.elf.facing}`);
}

function resolveCollisions(prevX, prevY) {
    const elf = gameState.elf;
    const elfRect = {
        x: elf.x,
        y: elf.y,
        w: elf.width,
        h: elf.height
    };
    for (const block of gameState.blockers) {
        if (rectIntersect(elfRect, block)) {
            // Resolve on the smallest overlap axis
            const overlapX = Math.min(elfRect.x + elfRect.w - block.x, block.x + block.w - elfRect.x);
            const overlapY = Math.min(elfRect.y + elfRect.h - block.y, block.y + block.h - elfRect.y);
            if (overlapX < overlapY) {
                if (elfRect.x < block.x) {
                    elf.x -= overlapX;
                } else {
                    elf.x += overlapX;
                }
            } else {
                if (elfRect.y < block.y) {
                    elf.y -= overlapY;
                } else {
                    elf.y += overlapY;
                }
            }
            elfRect.x = elf.x;
            elfRect.y = elf.y;
        }
    }
    // Update position after resolution
    const elfElement = document.querySelector('.elf');
    elfElement.style.left = `${elf.x}px`;
    elfElement.style.top = `${elf.y}px`;
}

function rectIntersect(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}


function checkStationProximity() {
    const elf = gameState.elf;
    const interactionDistance = CONSTANTS.interactionDistance;
    
    for (const [stationId, stationPos] of Object.entries(gameState.stations)) {
        const dx = (elf.x + elf.width / 2) - stationPos.x;
        const dy = (elf.y + elf.height / 2) - stationPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const stationElement = document.getElementById(stationId);
        if (distance < interactionDistance) {
            stationElement.classList.add('in-range');
            return { id: stationId, resource: stationPos.resource, element: stationElement };
        } else {
            stationElement.classList.remove('in-range');
        }
    }
    
    // Check put area
    const putArea = document.querySelector('.put-area');
    const putAreaRect = putArea.getBoundingClientRect();
    const putAreaCenterX = putAreaRect.left + putAreaRect.width / 2;
    const putAreaCenterY = putAreaRect.top + putAreaRect.height / 2;
    
    const dx = elf.x - putAreaCenterX;
    const dy = elf.y - putAreaCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < interactionDistance) {
        putArea.classList.add('in-range');
        return { id: 'put-area', resource: 'delivery', element: putArea };
    } else {
        putArea.classList.remove('in-range');
    }
    
    return null;
}

function handleInteraction() {
    const nearbyStation = checkStationProximity();
    
    if (!nearbyStation) {
        return;
    }
    
    if (nearbyStation.resource === 'delivery') {
        // Deliver crafted toy
        if (gameState.elf.carrying && gameState.elf.carrying.type === 'crafted') {
            deliverToy(gameState.elf.carrying.toyName);
        }
    } else if (nearbyStation.resource === 'crafting') {
        // Crafting station interaction
        if (gameState.elf.carrying && gameState.elf.carrying.type !== 'crafted') {
            // Deposit material for crafting
            depositMaterialForCrafting(gameState.elf.carrying.resource);
        }
    } else {
        // Resource gathering station
        if (!gameState.elf.carrying) {
            gatherResource(nearbyStation.resource);
        }
    }
}

function handleCraftKey() {
    const nearbyStation = checkStationProximity();
    if (!nearbyStation) return;
    if (nearbyStation.resource === 'crafting') {
        attemptCrafting();
    }
}

// ==============================================
// KEYBOARD INPUT
// ==============================================

function handleKeyDown(event) {
    if (event.key in gameState.keys) {
        gameState.keys[event.key] = true;
        
        if (event.key === 'e') {
            handleInteraction();
        } else if (event.key === 'c') {
            handleCraftKey();
        } else if (event.key === 'Escape') {
            togglePause();
        }
    }
}

function handleKeyUp(event) {
    if (event.key in gameState.keys) {
        gameState.keys[event.key] = false;
    }
}

// ==============================================
// RESOURCE GATHERING
// ==============================================

function gatherResource(resource) {
    if (!gameState.elf.carrying) {
        gameState.elf.carrying = { type: 'resource', resource: resource };
        updateCarryingDisplay();
        showResourceFeedback(resource);
    }
}

function showResourceFeedback(resource) {
    console.log(`Picked up ${resource}!`);
    spawnFloatingText(`+1 ${resource}`, gameState.elf.x, gameState.elf.y - 10);
    spawnParticles(gameState.elf.x, gameState.elf.y);
    playSound('pickup');
    announce(`Picked up ${resource}`);
}

// ==============================================
// CRAFTING SYSTEM
// ==============================================

// Temporary storage for materials being deposited at crafting station
const craftingTable = {};

function depositMaterialForCrafting(resource) {
    if (!craftingTable[resource]) {
        craftingTable[resource] = 0;
    }
    craftingTable[resource]++;
    gameState.elf.carrying = null;
    updateCarryingDisplay();
    updateCraftingTableDisplay();
    updateCraftingProgress();
    markCraftableOrders();
    console.log(`Deposited ${resource} at crafting table. Current table:`, craftingTable);
}

function attemptCrafting() {
    if (gameState.orderQueue.length === 0) {
        console.log('No orders to craft!');
        return;
    }
    
    // Check if any order can be crafted with current materials
    for (const order of gameState.orderQueue) {
        let canCraft = true;
        
        for (const [resource, needed] of Object.entries(order.recipe)) {
            if (!craftingTable[resource] || craftingTable[resource] < needed) {
                canCraft = false;
                break;
            }
        }
        
        if (canCraft && !gameState.elf.carrying) {
            // Deduct resources from crafting table
            for (const [resource, needed] of Object.entries(order.recipe)) {
                craftingTable[resource] -= needed;
            }
            
            // Give crafted item to elf
            gameState.elf.carrying = { type: 'crafted', toyName: order.toyName };
            updateCarryingDisplay();
            updateCraftingTableDisplay();
            updateCraftingProgress();
            markCraftableOrders();
            spawnFloatingText('Crafted!', gameState.elf.x, gameState.elf.y - 10);
            spawnParticles(gameState.elf.x, gameState.elf.y);
            playSound('craft');
            announce(`Crafted ${order.toyName}`);
            
            console.log(`Crafted ${order.toyName}!`);
            return;
        }
    }
    
    console.log('Cannot craft any current order with available materials');
}

function autoDepositIfCraftingNearby() {
    if (!gameState.elf.carrying || gameState.elf.carrying.type !== 'resource') return;
    const craftStation = gameState.stations['crafting-station'];
    if (!craftStation) return;
    const dx = (gameState.elf.x + gameState.elf.width / 2) - craftStation.x;
    const dy = (gameState.elf.y + gameState.elf.height / 2) - craftStation.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < CONSTANTS.interactionDistance * 0.9) {
        depositMaterialForCrafting(gameState.elf.carrying.resource);
    }
}

function updateCraftingTableDisplay() {
    const box = document.querySelector('.crafting-contents');
    if (!box) return;
    const entries = Object.entries(craftingTable).filter(([, amt]) => amt > 0);
    if (entries.length === 0) {
        box.textContent = '(empty)';
        return;
    }
    box.innerHTML = entries
        .map(([res, amt]) => `${resourceIcons[res] || res} ${amt}x ${res}`)
        .join('<br>');
    updateCraftingProgress();
    markCraftableOrders();
}

// ==============================================
// DELIVERY SYSTEM
// ==============================================

function deliverToy(toyName) {
    // Find one matching order
    const orderIndex = gameState.orderQueue.findIndex(order => order.toyName === toyName);
    
    if (orderIndex !== -1) {
        // Remove only one entry (orders are single-unit)
        gameState.orderQueue.splice(orderIndex, 1);
        gameState.elf.carrying = null;
        updateCarryingDisplay();
        updateOrderDisplay();
        updateCraftingProgress();
        updateDeliveryCounter();
        completeDelivery();
        spawnFloatingText('Delivered!', gameState.elf.x, gameState.elf.y - 10);
        spawnParticles(gameState.elf.x, gameState.elf.y);
        playSound('deliver');
        announce(`Delivered ${toyName}`);
        console.log(`Delivered: ${toyName}`);
    } else {
        console.log(`No order for ${toyName}!`);
    }
}

function updateCarryingDisplay() {
    const carryingDisplay = document.getElementById('carrying-display');
    if (gameState.elf.carrying) {
        if (gameState.elf.carrying.type === 'resource') {
            carryingDisplay.textContent = `Carrying: ${gameState.elf.carrying.resource}`;
        } else if (gameState.elf.carrying.type === 'crafted') {
            carryingDisplay.textContent = `Carrying: ${gameState.elf.carrying.toyName}`;
        }
        carryingDisplay.style.display = 'block';
    } else {
        carryingDisplay.style.display = 'none';
    }
}

// ==============================================
// GAME LOOP
// ==============================================

function gameLoop() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - gameState.lastFrameTime) / 1000; // Convert to seconds
    gameState.lastFrameTime = currentTime;
    
    if (gameState.isGameRunning) {
        updateElfPosition(deltaTime);
        autoDepositIfCraftingNearby();
        checkStationProximity();
        requestAnimationFrame(gameLoop);
    }
}

function startTimer() {
    if (gameState.timerInterval) return;
    gameState.timerInterval = setInterval(() => {
        // Timer always counts down regardless of list state
        if (gameState.timeLeft > 0) {
            gameState.timeLeft--;
            updateTimer();
        } else {
            gameOver();
        }
    }, 1000);
}

function pauseGame() {
    if (gameState.paused) return;
    gameState.paused = true;
    gameState.isGameRunning = false;
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.setAttribute('aria-hidden', 'false');
}

function resumeGame() {
    if (!gameState.paused) return;
    gameState.paused = false;
    gameState.isGameRunning = true;
    gameState.lastFrameTime = Date.now();
    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.setAttribute('aria-hidden', 'true');
    requestAnimationFrame(gameLoop);
    startTimer();
}

function togglePause() {
    if (gameState.paused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// ==============================================
// GAME OVER / WIN CONDITIONS
// ==============================================

function gameOver() {
    gameState.isGameRunning = false;
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    console.log('Game Over - Time\'s up!');
    alert(`Game Over! You completed ${gameState.totalDeliveries} deliveries across ${gameState.level} level(s)!`);
}

function gameWon() {
    gameState.isGameRunning = false;
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    console.log('You Win! All levels completed!');
    alert(`Congratulations! You completed all ${levelConfig.length} levels with ${gameState.totalDeliveries} total deliveries!`);
}

// ==============================================
// INITIALIZATION
// ==============================================

function initStationPositions() {
    const stations = document.querySelectorAll('.station');
    gameState.blockers = [];
    stations.forEach(station => {
        const icon = station.querySelector('.station-icon') || station;
        const rect = icon.getBoundingClientRect();
        const stationId = station.id;
        const resource = station.dataset.resource;
        station.classList.add('tooltip');
        station.setAttribute('data-tip', resource === 'crafting' ? 'Craft here (E or C)' : `Pick up ${resource}`);
        
        gameState.stations[stationId] = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            resource: resource,
            w: rect.width,
            h: rect.height
        };

        // 🔧 COLLISION HITBOX CONFIGURATION
        // Higher percentage = smaller hitbox (easier to get close)
        // Lower percentage = larger hitbox (harder to get close)
        
        let inset;
        let yOffset = 0;
        let xOffset = 0;
        let heightExtension = 0;
        if (stationId === 'crafting-station') {
            // 🔧 WORKBENCH HITBOX: Adjust this value to change workbench collision size
            // Current: 50% inset (smaller hitbox width)
            inset = Math.min(rect.width, rect.height) * 0.50;
            // 🔧 WORKBENCH VERTICAL OFFSET: Negative value moves hitbox UP, positive moves DOWN
            yOffset = rect.height * -0.30; // Move hitbox up 30% to align with blueprint/work surface
            // 🔧 WORKBENCH HORIZONTAL OFFSET: Negative value moves hitbox LEFT, positive moves RIGHT
            xOffset = rect.width * -0.10; // Adjust to move left/right
            // 🔧 WORKBENCH HEIGHT EXTENSION: Positive value makes hitbox taller downwards
            heightExtension = rect.height * 0.60; // Extend hitbox downward 60%
        } else {
            // Resource benches: 30% inset for tighter fit
            inset = Math.min(rect.width, rect.height) * 0.30;
        }
        
        gameState.blockers.push({
            x: rect.left + inset + xOffset,
            y: rect.top + inset + yOffset,
            w: rect.width - inset * 2,
            h: rect.height - inset * 2 + heightExtension
        });
    });
    
    // 🔧 SANTA'S SACK COLLISION HITBOX
    const putArea = document.querySelector('.put-area');
    if (putArea) {
        const putRect = putArea.getBoundingClientRect();
        // Adjust inset to match the actual sack sprite shape (0.35 = 35% inset)
        const inset = Math.min(putRect.width, putRect.height) * 0.35;
        gameState.blockers.push({
            x: putRect.left + inset,
            y: putRect.top + inset,
            w: putRect.width - inset * 2,
            h: putRect.height - inset * 2
        });
    }

    // 🔧 WALL COLLISIONS (Stone boundaries - bottom, left, right)
    // 🔧 WALL EXPANSION: Adjust these values to make walls thicker/extend further inward
    const wallExpansion = {
        bottom: 50,   // Pixels to extend bottom wall upward (positive = thicker)
        left: 0,     // Pixels to extend left wall rightward
        right: 0,    // Pixels to extend right wall leftward
        top: 0       // Pixels to extend top edge downward
    };
    
    const walls = document.querySelectorAll('.wall-edge');
    walls.forEach(wall => {
        const wallRect = wall.getBoundingClientRect();
        let expansion = 0;
        
        if (wall.classList.contains('bottom')) expansion = wallExpansion.bottom;
        else if (wall.classList.contains('left')) expansion = wallExpansion.left;
        else if (wall.classList.contains('right')) expansion = wallExpansion.right;
        
        gameState.blockers.push({
            x: wallRect.left - (wall.classList.contains('left') ? expansion : 0),
            y: wallRect.top - (wall.classList.contains('bottom') ? expansion : 0),
            w: wallRect.width + (wall.classList.contains('left') || wall.classList.contains('right') ? expansion : 0),
            h: wallRect.height + (wall.classList.contains('bottom') ? expansion : 0)
        });
    });

    // 🔧 SCREEN EDGE BOUNDARIES (Prevent going outside viewport)
    // 🔧 EDGE INSET: Adjust this value to create padding from screen edges
    const edgeInset = 0; // Pixels inward from screen edge (0 = at edge, 50 = 50px from edge)
    
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        const containerRect = gameContainer.getBoundingClientRect();
        // Add invisible walls at screen edges with configurable inset
        gameState.blockers.push(
            // Top edge
            { x: edgeInset, y: edgeInset, w: window.innerWidth - edgeInset * 2, h: 1 },
            // Bottom edge
            { x: edgeInset, y: window.innerHeight - edgeInset - 1, w: window.innerWidth - edgeInset * 2, h: 1 },
            // Left edge
            { x: edgeInset, y: edgeInset, w: 1, h: window.innerHeight - edgeInset * 2 },
            // Right edge
            { x: window.innerWidth - edgeInset - 1, y: edgeInset, w: 1, h: window.innerHeight - edgeInset * 2 }
        );
    }
}

function initGame() {
    console.log('Initializing game...');
    
    // Initialize station positions
    initStationPositions();
    ensureEffectPools();
    
    // Initialize elf position (start near center)
    gameState.elf.x = window.innerWidth / 2;
    gameState.elf.y = window.innerHeight / 2;
    const elfElement = document.querySelector('.elf');
    elfElement.style.left = `${gameState.elf.x}px`;
    elfElement.style.top = `${gameState.elf.y}px`;
    elfElement.classList.add('is-idle', 'is-down');
    
    // Defer orders until difficulty selected
    
    // Update UI
    updateTimer();
    updateDeliveryCounter();
    updateLevelDisplay();
    updateCarryingDisplay();
    
    // Add keyboard listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Don't start until difficulty chosen
    
    console.log('Game initialized!');
    console.log('Controls: WASD or Arrow Keys to move, E to interact');
    console.log('Initial state:', gameState);
}
// Rules overlay: proceed to difficulty on Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const rules = document.getElementById('rules-overlay');
        if (rules && rules.style.display !== 'none') {
            rules.style.display = 'none';
            rules.setAttribute('aria-hidden', 'true');
            const startOverlay = document.getElementById('start-overlay');
            if (startOverlay) {
                startOverlay.style.display = 'flex';
                startOverlay.setAttribute('aria-hidden', 'false');
            }
        }
    }
});

// Toggle recipe card open/closed
document.addEventListener('click', (e) => {
    if (e.target.id === 'recipe-title') {
        const card = document.getElementById('recipe-card');
        const expanded = card.getAttribute('aria-expanded') === 'true';
        card.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        card.classList.toggle('closed', expanded);
        const isClosed = expanded; // if it was expanded, we just closed it
        document.body.classList.toggle('orders-closed', isClosed);
    }
});

function announce(message) {
    const live = document.getElementById('aria-live');
    if (live) {
        live.textContent = message;
    }
}

document.addEventListener('click', (e) => {
    if (e.target.id === 'pause-toggle') {
        togglePause();
    }
    if (e.target.id === 'resume-btn') {
        resumeGame();
    }
    if (e.target.id === 'restart-btn') {
        window.location.reload();
    }
});

// ==============================================
// START GAME WHEN PAGE LOADS
// ==============================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Difficulty selection handlers
function startGameWithDifficulty(diff) {
    gameState.difficulty = diff;
    const settings = gameState.difficultySettings[diff];
    gameState.maxOrdersInQueue = settings.startOrders;
    document.getElementById('level-value').textContent = gameState.level;
    updateDeliveryCounter();
    generateInitialOrders();
    updateTimer();
    updateOrderDisplay();
    updateCraftingTableDisplay();
    updateCraftingProgress();
    
    // Hide overlay
    const overlay = document.getElementById('start-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
    }
    
    // Start loop and timer
    gameState.isGameRunning = true;
    gameState.lastFrameTime = Date.now();
    requestAnimationFrame(gameLoop);
    startTimer();
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn[data-difficulty]');
    if (btn) {
        const diff = btn.getAttribute('data-difficulty');
        startGameWithDifficulty(diff);
    }
});

// ==============================================
// HELPER FUNCTIONS
// ==============================================

// Recalculate station positions on window resize
window.addEventListener('resize', () => {
    initStationPositions();
});

// ==============================================
// INSTRUCTIONS:
// 
// CONTROLS:
// - WASD or Arrow Keys: Move the elf
// - E: Interact with nearby stations/delivery area
//
// GAMEPLAY:
// 1. Pick up resources from stations (wood, metal, fabric)
// 2. Bring them to the crafting station (E to deposit)
// 3. Once you have all materials for an order, press E at crafting to craft
// 4. Carry the crafted toy to the PUT AREA and press E to deliver
// 5. Complete all deliveries before time runs out
// 6. Extra time carries over to next level!
//
// TO ADD NEW FEATURES:
// 1. NEW RESOURCE: Add station in HTML with data-resource="resourcename"
// 2. NEW TOY: Add to toyRecipes object with required materials
// 3. NEW LEVEL: Add to levelConfig array
// ==============================================