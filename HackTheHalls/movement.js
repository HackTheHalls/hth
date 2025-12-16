import { gameState, CONSTANTS } from './state.js';
import { autoDepositIfCraftingNearby, gatherResource, depositMaterialForCrafting, attemptCrafting, deliverToy } from './crafting.js';

export function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function resolveCollisions(prevX, prevY) {
    const elf = gameState.elf;
    const elfRect = { x: elf.x, y: elf.y, w: elf.width, h: elf.height };
    for (const block of gameState.blockers) {
        if (rectIntersect(elfRect, block)) {
            const overlapX = Math.min(elfRect.x + elfRect.w - block.x, block.x + block.w - elfRect.x);
            const overlapY = Math.min(elfRect.y + elfRect.h - block.y, block.y + block.h - elfRect.y);
            if (overlapX < overlapY) {
                elf.x += elfRect.x < block.x ? -overlapX : overlapX;
            } else {
                elf.y += elfRect.y < block.y ? -overlapY : overlapY;
            }
            elfRect.x = elf.x;
            elfRect.y = elf.y;
        }
    }
    const elfElement = document.querySelector('.elf');
    elfElement.style.transform = `translate(${elf.x}px, ${elf.y}px)`;
}

export function updateElfPosition(deltaTime) {
    const elf = gameState.elf;
    let dx = 0;
    let dy = 0;
    if (gameState.keys.w || gameState.keys.ArrowUp) dy -= 1;
    if (gameState.keys.s || gameState.keys.ArrowDown) dy += 1;
    if (gameState.keys.a || gameState.keys.ArrowLeft) dx -= 1;
    if (gameState.keys.d || gameState.keys.ArrowRight) dx += 1;
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }
    elf.x += dx * elf.speed * deltaTime;
    elf.y += dy * elf.speed * deltaTime;
    const margin = CONSTANTS.elfMargin;
    elf.x = Math.max(margin, Math.min(window.innerWidth - margin - elf.width, elf.x));
    elf.y = Math.max(margin, Math.min(window.innerHeight - margin - elf.height, elf.y));
    resolveCollisions();
    checkStationProximity();
}

export function checkStationProximity() {
    const elf = gameState.elf;
    const interactionDistance = CONSTANTS.interactionDistance;
    let nearestCraftStation = null;
    let craftDistance = Infinity;
    let nearestStation = null;
    let nearestDistance = Infinity;

    for (const [stationId, stationPos] of Object.entries(gameState.stations)) {
        const dx = (elf.x + elf.width / 2) - stationPos.x;
        const dy = (elf.y + elf.height / 2) - stationPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const stationElement = document.getElementById(stationId);
        if (distance < interactionDistance) {
            stationElement.classList.add('in-range');
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestStation = { id: stationId, resource: stationPos.resource, element: stationElement, distance };
            }
            if (stationPos.resource === 'crafting') {
                nearestCraftStation = stationPos;
                craftDistance = distance;
            }
        } else {
            stationElement.classList.remove('in-range');
        }
    }

    const putArea = document.querySelector('.put-area');
    const putAreaRect = putArea.getBoundingClientRect();
    const putAreaCenterX = putAreaRect.left + putAreaRect.width / 2;
    const putAreaCenterY = putAreaRect.top + putAreaRect.height / 2;
    const dx = elf.x - putAreaCenterX;
    const dy = elf.y - putAreaCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const elfElement = document.querySelector('.elf');
    if (distance < interactionDistance) {
        putArea.classList.add('in-range');
        elfElement.classList.add('can-interact');
        autoDepositIfCraftingNearby(nearestCraftStation, craftDistance);
        return { id: 'put-area', resource: 'delivery', distance };
    }
    putArea.classList.remove('in-range');

    // Add can-interact class if near any station
    if (nearestStation) {
        elfElement.classList.add('can-interact');
    } else {
        elfElement.classList.remove('can-interact');
    }

    autoDepositIfCraftingNearby(nearestCraftStation, craftDistance);
    return nearestStation;
}

export function handleInteraction() {
    const nearby = checkStationProximity();
    if (!nearby) return;
    if (nearby.resource === 'delivery') {
        if (gameState.elf.carrying && gameState.elf.carrying.type === 'crafted') {
            deliverToy(gameState.elf.carrying.toyName, window.Game.completeDelivery);
        }
    } else if (nearby.resource === 'crafting') {
        if (gameState.elf.carrying && gameState.elf.carrying.type !== 'crafted') {
            depositMaterialForCrafting(gameState.elf.carrying.resource);
        }
    } else {
        if (!gameState.elf.carrying) gatherResource(nearby.resource);
    }
}

export function handleCraftKey() {
    const nearby = checkStationProximity();
    if (!nearby) return;
    if (nearby.resource === 'crafting') {
        attemptCrafting();
    }
}

export function handleKeyDown(event) {
    if (event.key in gameState.keys) {
        gameState.keys[event.key] = true;
        const dbg = document.getElementById('key-debug');
        if (dbg) {
            dbg.textContent = `Key: ${event.key}`;
            dbg.classList.remove('show');
            void dbg.offsetWidth;
            dbg.classList.add('show');
        }
        if (event.key === 'e') handleInteraction();
        else if (event.key === 'c') handleCraftKey();
        else if (event.key === 'Escape') window.Game.togglePause();
    }
}

export function handleKeyUp(event) {
    if (event.key in gameState.keys) {
        gameState.keys[event.key] = false;
    }
}
