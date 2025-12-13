import { gameState, craftingTable, resourceIcons, spawnFloatingText, spawnParticles, scheduleIdle, announce } from './state.js';
import { levelConfig } from './state.js';

export function updateTimer() {
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    document.getElementById('timer-value').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function updateDeliveryCounter() {
    const currentConfig = levelConfig[gameState.level - 1];
    const remaining = currentConfig.requiredDeliveries - gameState.currentLevelDeliveries;
    document.getElementById('delivery-count').textContent = remaining;
}

export function updateLevelDisplay() {
    document.getElementById('level-value').textContent = gameState.level;
}

export function updateCarryingDisplay() {
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

function addDeliveryFlourish() {
    const putArea = document.querySelector('.put-area');
    if (!putArea) return;
    putArea.classList.remove('delivered');
    void putArea.offsetWidth;
    putArea.classList.add('delivered');
    setTimeout(() => putArea.classList.remove('delivered'), 500);
}

export function updateOrderDisplay() {
    const recipeScroll = document.querySelector('.recipe-scroll');
    if (!recipeScroll) return;
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

    scheduleIdle(() => markCraftableOrders());
    scheduleIdle(() => updateCraftingProgress());
}

export function canCraftOrder(order) {
    for (const [resource, needed] of Object.entries(order.recipe)) {
        if (!craftingTable[resource] || craftingTable[resource] < needed) return false;
    }
    return true;
}

export function markCraftableOrders() {
    const scroll = document.querySelector('.recipe-scroll');
    if (!scroll) return;
    scroll.querySelectorAll('.recipe-item').forEach(item => {
        const orderId = item.dataset.orderId;
        const order = gameState.orderQueue.find(o => o.id.toString() === orderId);
        if (order && canCraftOrder(order)) item.classList.add('craftable');
        else item.classList.remove('craftable');
    });
}

export function updateCraftingProgress() {
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

export function showPickupEffects(resource) {
    spawnFloatingText(`+1 ${resource}`, gameState.elf.x, gameState.elf.y - 10);
    spawnParticles(gameState.elf.x, gameState.elf.y);
}

export function showCraftEffects(toyName) {
    spawnFloatingText('Crafted!', gameState.elf.x, gameState.elf.y - 10);
    spawnParticles(gameState.elf.x, gameState.elf.y);
    announce(`Crafted ${toyName}`);
}

export function showDeliverEffects(toyName) {
    spawnFloatingText('Delivered!', gameState.elf.x, gameState.elf.y - 10);
    spawnParticles(gameState.elf.x, gameState.elf.y);
    addDeliveryFlourish();
    announce(`Delivered ${toyName}`);
}
