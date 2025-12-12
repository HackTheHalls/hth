// ==============================================
// GAME STATE
// ==============================================

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
        speed: 200, // pixels per second
        carrying: null, // {type: 'resource', resource: 'wood'} or {type: 'crafted', toyName: 'bench'}
        width: 60,
        height: 60
    },
    stations: {}, // Will store station positions
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
        c: false // Craft key
    },
    lastFrameTime: Date.now(),
    timerInterval: null,
    isGameRunning: false
};

// ==============================================
// TOY RECIPES
// Add new toy recipes here
// ==============================================

const toyRecipes = {
    bench: {
        wood: 1,
        metal: 1
    },
    couch: {
        wood: 2,
        metal: 1,
        fabric: 1
    },
    chair: {
        wood: 2,
        metal: 1
    },
    table: {
        wood: 3,
        metal: 2
    },
    bed: {
        wood: 2,
        fabric: 3,
        metal: 1
    }
};

// Level configuration - defines difficulty progression
const levelConfig = [
    { requiredDeliveries: 3, timeLimit: 180, availableToys: ['bench'] },
    { requiredDeliveries: 4, timeLimit: 150, availableToys: ['bench', 'chair'] },
    { requiredDeliveries: 5, timeLimit: 150, availableToys: ['bench', 'chair', 'couch'] },
    { requiredDeliveries: 6, timeLimit: 180, availableToys: ['bench', 'chair', 'couch', 'table'] },
    { requiredDeliveries: 7, timeLimit: 180, availableToys: ['bench', 'chair', 'couch', 'table', 'bed'] }
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
    const currentConfig = levelConfig[gameState.level - 1];
    const remaining = currentConfig.requiredDeliveries - gameState.currentLevelDeliveries;
    document.getElementById('delivery-count').textContent = remaining;
}

function completeDelivery() {
    gameState.currentLevelDeliveries++;
    gameState.totalDeliveries++;
    updateDeliveryCounter();
    
    const currentConfig = levelConfig[gameState.level - 1];
    if (gameState.currentLevelDeliveries >= currentConfig.requiredDeliveries) {
        levelComplete();
    } else {
        generateNewOrder();
    }
}

// ==============================================
// LEVEL SYSTEM
// ==============================================

function levelComplete() {
    clearInterval(gameState.timerInterval);
    
    if (gameState.level >= levelConfig.length) {
        gameWon();
        return;
    }
    
    // Advance to next level, carry over remaining time
    gameState.level++;
    gameState.currentLevelDeliveries = 0;
    const nextConfig = levelConfig[gameState.level - 1];
    gameState.timeLeft += nextConfig.timeLimit;
    
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
    if (gameState.orderQueue.length >= gameState.maxOrdersInQueue) {
        return;
    }
    
    const currentConfig = levelConfig[gameState.level - 1];
    const availableToys = currentConfig.availableToys;
    const randomToy = availableToys[Math.floor(Math.random() * availableToys.length)];
    
    const order = {
        toyName: randomToy,
        recipe: toyRecipes[randomToy],
        id: Date.now()
    };
    
    gameState.orderQueue.push(order);
    updateOrderDisplay();
}

function generateInitialOrders() {
    for (let i = 0; i < gameState.maxOrdersInQueue; i++) {
        generateNewOrder();
    }
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
}

// ==============================================
// ELF MOVEMENT & CONTROLS
// ==============================================

function updateElfPosition(deltaTime) {
    const elf = gameState.elf;
    let dx = 0;
    let dy = 0;
    
    // Check keyboard input
    if (gameState.keys.w || gameState.keys.ArrowUp) dy -= 1;
    if (gameState.keys.s || gameState.keys.ArrowDown) dy += 1;
    if (gameState.keys.a || gameState.keys.ArrowLeft) dx -= 1;
    if (gameState.keys.d || gameState.keys.ArrowRight) dx += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }
    
    // Apply movement
    elf.x += dx * elf.speed * deltaTime;
    elf.y += dy * elf.speed * deltaTime;
    
    // Clamp to screen bounds
    const margin = 50;
    elf.x = Math.max(margin, Math.min(window.innerWidth - margin - elf.width, elf.x));
    elf.y = Math.max(margin, Math.min(window.innerHeight - margin - elf.height, elf.y));
    
    // Update visual position
    const elfElement = document.querySelector('.elf');
    elfElement.style.left = elf.x + 'px';
    elfElement.style.top = elf.y + 'px';
}

function checkStationProximity() {
    const elf = gameState.elf;
    const interactionDistance = 100;
    
    for (const [stationId, stationPos] of Object.entries(gameState.stations)) {
        const dx = elf.x - stationPos.x;
        const dy = elf.y - stationPos.y;
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
            
            console.log(`Crafted ${order.toyName}!`);
            return;
        }
    }
    
    console.log('Cannot craft any current order with available materials');
}

function updateCraftingTableDisplay() {
    // This could show what's on the crafting table
    console.log('Crafting table contents:', craftingTable);
}

// ==============================================
// DELIVERY SYSTEM
// ==============================================

function deliverToy(toyName) {
    // Find matching order
    const orderIndex = gameState.orderQueue.findIndex(order => order.toyName === toyName);
    
    if (orderIndex !== -1) {
        gameState.orderQueue.splice(orderIndex, 1);
        gameState.elf.carrying = null;
        updateCarryingDisplay();
        updateOrderDisplay();
        completeDelivery();
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
        checkStationProximity();
        requestAnimationFrame(gameLoop);
    }
}

function startTimer() {
    gameState.timerInterval = setInterval(() => {
        if (gameState.timeLeft > 0) {
            gameState.timeLeft--;
            updateTimer();
        } else {
            gameOver();
        }
    }, 1000);
}

// ==============================================
// GAME OVER / WIN CONDITIONS
// ==============================================

function gameOver() {
    gameState.isGameRunning = false;
    clearInterval(gameState.timerInterval);
    console.log('Game Over - Time\'s up!');
    alert(`Game Over! You completed ${gameState.totalDeliveries} deliveries across ${gameState.level} level(s)!`);
}

function gameWon() {
    gameState.isGameRunning = false;
    clearInterval(gameState.timerInterval);
    console.log('You Win! All levels completed!');
    alert(`Congratulations! You completed all ${levelConfig.length} levels with ${gameState.totalDeliveries} total deliveries!`);
}

// ==============================================
// INITIALIZATION
// ==============================================

function initStationPositions() {
    const stations = document.querySelectorAll('.station');
    stations.forEach(station => {
        const rect = station.getBoundingClientRect();
        const stationId = station.id;
        const resource = station.dataset.resource;
        
        gameState.stations[stationId] = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            resource: resource
        };
    });
}

function initGame() {
    console.log('Initializing game...');
    
    // Initialize station positions
    initStationPositions();
    
    // Initialize elf position (start near center)
    gameState.elf.x = window.innerWidth / 2;
    gameState.elf.y = window.innerHeight / 2;
    const elfElement = document.querySelector('.elf');
    elfElement.style.left = gameState.elf.x + 'px';
    elfElement.style.top = gameState.elf.y + 'px';
    
    // Generate initial orders
    generateInitialOrders();
    
    // Update UI
    updateTimer();
    updateDeliveryCounter();
    updateLevelDisplay();
    updateCarryingDisplay();
    
    // Add keyboard listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Start game loop
    gameState.isGameRunning = true;
    gameState.lastFrameTime = Date.now();
    requestAnimationFrame(gameLoop);
    
    // Start timer countdown
    startTimer();
    
    console.log('Game initialized!');
    console.log('Controls: WASD or Arrow Keys to move, E to interact');
    console.log('Initial state:', gameState);
}

// ==============================================
// START GAME WHEN PAGE LOADS
// ==============================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

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