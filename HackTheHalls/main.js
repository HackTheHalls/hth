import { CONSTANTS, gameState, toyRecipes, levelConfig, ensureEffectPools, scheduleIdle, craftingTable } from './state.js';
import { updateTimer, updateDeliveryCounter, updateLevelDisplay, updateOrderDisplay, updateCarryingDisplay, updateCraftingProgress } from './ui.js';
import { gatherResource, depositMaterialForCrafting, attemptCrafting, deliverToy, autoDepositIfCraftingNearby, updateCraftingTableDisplay } from './crafting.js';
import { updateElfPosition, checkStationProximity, handleInteraction, handleCraftKey, handleKeyDown, handleKeyUp } from './movement.js';

// Expose some callbacks for cross-module use
window.Game = {
    togglePause,
    completeDelivery
};

function getSingleQuantityChance() {
    const d = gameState.difficulty || 'medium';
    return gameState.difficultySettings[d].singleQuantityChance;
}

function updateGhostIndicators() {
    // removed ghost feature; placeholder
}

function updateArrowIndicator() {
    if (gameState.difficulty !== 'easy') {
        document.querySelectorAll('.station').forEach(s => s.classList.remove('arrow-indicator'));
        return;
    }
    const order = gameState.orderQueue[0];
    if (!order) return;
    let targetRes = null;
    for (const [res, qty] of Object.entries(order.recipe)) {
        const have = (craftingTable[res] || 0) + (gameState.elf.carrying?.resource === res ? 1 : 0);
        if (have < qty) {
            targetRes = res;
            break;
        }
    }
    document.querySelectorAll('.station').forEach(s => s.classList.remove('arrow-indicator'));
    if (targetRes) {
        const targetStation = document.querySelector(`[data-resource="${targetRes}"]`);
        if (targetStation) targetStation.classList.add('arrow-indicator');
    }
}

function generateNewOrder() {
    if (gameState.orderQueue.length >= gameState.maxOrdersInQueue) return;
    const currentConfig = levelConfig[gameState.level - 1];
    const availableToys = currentConfig.availableToys.slice();
    const inQueueNames = new Set(gameState.orderQueue.map(o => o.toyName));
    const notInQueue = availableToys.filter(t => !inQueueNames.has(t));
    const pool = notInQueue.length > 0 ? notInQueue : availableToys;
    const randomToy = pool[Math.floor(Math.random() * pool.length)];
    const order = { toyName: randomToy, recipe: toyRecipes[randomToy], id: Date.now() };
    gameState.orderQueue.push(order);
    updateOrderDisplay();
    scheduleIdle(updateCraftingProgress);
    updateArrowIndicator();
}

function generateInitialOrders() {
    for (let i = 0; i < gameState.maxOrdersInQueue; i++) {
        generateNewOrder();
    }
}

function levelComplete() {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    if (gameState.level >= levelConfig.length) {
        gameWon();
        return;
    }
    gameState.level++;
    gameState.currentLevelDeliveries = 0;
    const nextConfig = levelConfig[gameState.level - 1];
    gameState.timeLeft += nextConfig.timeLimit;
    const settings = gameState.difficultySettings[gameState.difficulty || 'medium'];
    if ((gameState.level - 1) % settings.increaseEveryLevels === 0) {
        gameState.maxOrdersInQueue = Math.min(4, gameState.maxOrdersInQueue + 1);
    }
    gameState.orderQueue = [];
    generateInitialOrders();
    updateDeliveryCounter();
    updateTimer();
    updateLevelDisplay();
    alert(`Level ${gameState.level - 1} Complete! Starting Level ${gameState.level}\nTime Bonus: +${nextConfig.timeLimit} seconds`);
    startTimer();
}

function completeDelivery() {
    const now = Date.now();
    if (now - gameState.streak.lastDelivery <= CONSTANTS.streakWindowMs) {
        gameState.streak.count = Math.min(CONSTANTS.streakMaxBonus, gameState.streak.count + 1);
    } else {
        gameState.streak.count = 1;
    }
    gameState.streak.lastDelivery = now;
    gameState.streak.multiplier = 1 + (gameState.streak.count - 1) * 0.25;
    gameState.elf.speed = gameState.elf.baseSpeed + (gameState.streak.count - 1) * CONSTANTS.streakSpeedBonus;
    setTimeout(() => (gameState.elf.speed = gameState.elf.baseSpeed), CONSTANTS.streakWindowMs);

    gameState.currentLevelDeliveries++;
    gameState.totalDeliveries++;
    updateDeliveryCounter();
    updateArrowIndicator();
    const currentConfig = levelConfig[gameState.level - 1];
    if (gameState.currentLevelDeliveries >= currentConfig.requiredDeliveries) {
        levelComplete();
    } else {
        generateNewOrder();
    }
}

function updateGhostRemoved() {}

function gameLoop() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    if (gameState.isGameRunning) {
        updateElfPosition(deltaTime);
        checkStationProximity();
        requestAnimationFrame(gameLoop);
    }
}

function startTimer() {
    if (gameState.timerInterval) return;
    gameState.timerInterval = setInterval(() => {
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
    if (gameState.paused) resumeGame();
    else pauseGame();
}

function gameOver() {
    gameState.isGameRunning = false;
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    alert(`Game Over! You completed ${gameState.totalDeliveries} deliveries across ${gameState.level} level(s)!`);
}

function gameWon() {
    gameState.isGameRunning = false;
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    alert(`Congratulations! You completed all ${levelConfig.length} levels with ${gameState.totalDeliveries} total deliveries!`);
}

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
        gameState.stations[stationId] = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, resource, w: rect.width, h: rect.height };
        const inset = Math.min(rect.width, rect.height) * 0.25;
        gameState.blockers.push({ x: rect.left + inset, y: rect.top + inset, w: rect.width - inset * 2, h: rect.height - inset * 2 });
    });
}

function initGame() {
    initStationPositions();
    gameState.elf.x = window.innerWidth / 2;
    gameState.elf.y = window.innerHeight / 2;
    const elfElement = document.querySelector('.elf');
    elfElement.style.transform = `translate(${gameState.elf.x}px, ${gameState.elf.y}px)`;
    ensureEffectPools();
    updateTimer();
    updateDeliveryCounter();
    updateLevelDisplay();
    updateCarryingDisplay();
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
        // Improve keyboard focus for file:// usage
        document.body.setAttribute('tabindex', '-1');
        document.body.focus();
    // Ensure key events are captured even if focus is on overlays
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
}

function startGameWithDifficulty(diff) {
    gameState.difficulty = diff;
    const settings = gameState.difficultySettings[diff];
    gameState.maxOrdersInQueue = settings.startOrders;
    updateDeliveryCounter();
    generateInitialOrders();
    updateTimer();
    updateOrderDisplay();
    updateCraftingProgress();
    updateArrowIndicator();
    const overlay = document.getElementById('start-overlay');
    if (overlay) overlay.style.display = 'none';
    gameState.isGameRunning = true;
    gameState.lastFrameTime = Date.now();
    requestAnimationFrame(gameLoop);
    startTimer();
}

// Event wiring
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const rules = document.getElementById('rules-overlay');
        if (rules && rules.style.display !== 'none') {
            rules.style.display = 'none';
            const startOverlay = document.getElementById('start-overlay');
            if (startOverlay) startOverlay.style.display = 'flex';
        }
    }
});

document.addEventListener('click', e => {
    if (e.target.id === 'recipe-title') {
        const card = document.getElementById('recipe-card');
        const expanded = card.getAttribute('aria-expanded') === 'true';
        card.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        card.classList.toggle('closed', expanded);
        document.body.classList.toggle('orders-closed', expanded);
    }
});

document.addEventListener('click', e => {
    const btn = e.target.closest('.btn[data-difficulty]');
    if (btn) startGameWithDifficulty(btn.getAttribute('data-difficulty'));
});

document.addEventListener('click', e => {
    if (e.target.id === 'colorblind-toggle') {
        document.body.classList.toggle('colorblind');
        e.target.textContent = document.body.classList.contains('colorblind') ? 'Colorblind: On' : 'Colorblind Mode';
    }
    if (e.target.id === 'pause-toggle') togglePause();
    if (e.target.id === 'resume-btn') resumeGame();
    if (e.target.id === 'restart-btn') window.location.reload();
});

window.addEventListener('resize', () => initStationPositions());

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') togglePause();
});

// Expose needed references for other modules
window.levelConfig = levelConfig;
window.CONSTANTS = CONSTANTS;
window.craftingTable = craftingTable;

// For IDEs
export { startGameWithDifficulty };
