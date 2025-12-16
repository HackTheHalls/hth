import { gameState, craftingTable, playSound, spawnFloatingText, spawnParticles, announce, scheduleIdle, CONSTANTS } from './state.js';
import { updateCarryingDisplay, updateCraftingTableDisplay, updateOrderDisplay, updateCraftingProgress, markCraftableOrders, showPickupEffects, showCraftEffects, showDeliverEffects } from './ui.js';
import { resourceIcons } from './state.js';

export function gatherResource(resource) {
    if (!gameState.elf.carrying) {
        gameState.elf.carrying = { type: 'resource', resource };
        updateCarryingDisplay();
        showPickupEffects(resource);
        playSound('pickup');
        announce(`Picked up ${resource}`);
    }
}

export function depositMaterialForCrafting(resource) {
    craftingTable[resource] = (craftingTable[resource] || 0) + 1;
    gameState.elf.carrying = null;
    updateCarryingDisplay();
    updateCraftingTableDisplay();
    scheduleIdle(() => updateCraftingProgress());
    scheduleIdle(() => markCraftableOrders());
    playSound('pickup');
}

export function attemptCrafting() {
    if (gameState.orderQueue.length === 0) return;
    for (const order of gameState.orderQueue) {
        let canCraft = true;
        for (const [resource, needed] of Object.entries(order.recipe)) {
            if (!craftingTable[resource] || craftingTable[resource] < needed) {
                canCraft = false;
                break;
            }
        }
        if (canCraft && !gameState.elf.carrying) {
            for (const [resource, needed] of Object.entries(order.recipe)) {
                craftingTable[resource] -= needed;
            }
            gameState.elf.carrying = { type: 'crafted', toyName: order.toyName };
            updateCarryingDisplay();
            updateCraftingTableDisplay();
            scheduleIdle(() => updateCraftingProgress());
            scheduleIdle(() => markCraftableOrders());
            showCraftEffects(order.toyName);
            playSound('craft');
            return;
        }
    }
}

function updateCraftingBenchSprite() {
    const sprite = document.getElementById('crafting-bench-sprite');
    if (!sprite) return;
    
    const materials = Object.keys(craftingTable).filter(key => craftingTable[key] > 0).sort();
    
    // Map of material combinations to sprite paths
    const spriteMap = {
        '': 'imgs/WorkBench/woodWorkBench.png',
        'wood': 'imgs/WorkBench/woodWorkBench.png',
        'metal': 'imgs/WorkBench/metalWorkBench.png',
        'fabric': 'imgs/WorkBench/fabricWorkBench.png',
        'cotton': 'imgs/WorkBench/cottonWorkBench.png',
        'metal,wood': 'imgs/WorkBench/WMWorkbench.png',
        'fabric,wood': 'imgs/WorkBench/WFWorkbench.png',
        'cotton,wood': 'imgs/WorkBench/WCWorkbench.png',
        'fabric,metal': 'imgs/WorkBench/MFWorkbench.png',
        'cotton,metal': 'imgs/WorkBench/MCWorkBench.png',
        'cotton,fabric': 'imgs/WorkBench/FCWorkbench.png'
    };
    
    const key = materials.join(',');
    sprite.style.backgroundImage = `url('${spriteMap[key] || 'imgs/WorkBench/woodWorkBench.png'}')`;
}

export function updateCraftingTableDisplay() {
    const box = document.querySelector('.crafting-contents');
    if (!box) return;
    const entries = Object.entries(craftingTable).filter(([, amt]) => amt > 0);
    if (entries.length === 0) {
        box.textContent = '(empty)';
        updateCraftingBenchSprite();
        return;
    }
    box.innerHTML = entries.map(([res, amt]) => `${resourceIcons[res] || res} ${amt}x ${res}`).join('<br>');
    updateCraftingBenchSprite();
}

export function deliverToy(toyName, onDelivered) {
    const orderIndex = gameState.orderQueue.findIndex(order => order.toyName === toyName);
    if (orderIndex !== -1) {
        gameState.orderQueue.splice(orderIndex, 1);
        gameState.elf.carrying = null;
        updateCarryingDisplay();
        updateOrderDisplay();
        scheduleIdle(() => updateCraftingProgress());
        onDelivered();
        showDeliverEffects(toyName);
        playSound('deliver');
    }
}

export function autoDepositIfCraftingNearby(craftStation, distance) {
    if (!gameState.elf.carrying || gameState.elf.carrying.type !== 'resource') return;
    if (!craftStation) return;
    if (distance < 0) return;
    if (distance < 0.9 * CONSTANTS.interactionDistance) {
        depositMaterialForCrafting(gameState.elf.carrying.resource);
    }
}
