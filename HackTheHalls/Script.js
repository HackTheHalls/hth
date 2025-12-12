// ==============================================
// GAME STATE
// ==============================================

const gameState = {
    timeLeft: 180, // 3 minutes in seconds
    deliveryCount: 4,
    inventory: {
        wood: 0,
        metal: 0,
        fabric: 0
        // Add new resources here when adding new stations
    },
    currentOrder: null
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
        metal: 4
    }
    // Add new toys here:
    // toyname: {
    //     wood: X,
    //     metal: X,
    //     fabric: X
    // }
};

// ==============================================
// TIMER FUNCTIONS
// ==============================================

function updateTimer() {
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    document.getElementById('timer-value').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (gameState.timeLeft > 0) {
        gameState.timeLeft--;
        setTimeout(updateTimer, 1000);
    } else {
        gameOver();
    }
}

// ==============================================
// DELIVERY COUNTER
// ==============================================

function updateDeliveryCounter() {
    document.getElementById('delivery-count').textContent = gameState.deliveryCount;
}

function decrementDelivery() {
    gameState.deliveryCount--;
    updateDeliveryCounter();
    
    if (gameState.deliveryCount <= 0) {
        gameWon();
    }
}

// ==============================================
// STATION INTERACTION
// ==============================================

function handleStationClick(event) {
    const station = event.currentTarget;
    const resource = station.dataset.resource;
    
    console.log(`Clicked station: ${resource}`);
    
    // Remove active state from all stations
    document.querySelectorAll('.station').forEach(s => s.classList.remove('active'));
    
    // Add active state to clicked station
    station.classList.add('active');
    
    if (resource === 'crafting') {
        attemptCrafting();
    } else {
        gatherResource(resource);
    }
}

// ==============================================
// RESOURCE GATHERING
// ==============================================

function gatherResource(resource) {
    if (gameState.inventory.hasOwnProperty(resource)) {
        gameState.inventory[resource]++;
        console.log(`Gathered ${resource}. Current inventory:`, gameState.inventory);
        
        // You can add visual feedback here
        showResourceFeedback(resource);
    }
}

function showResourceFeedback(resource) {
    // Add animation or visual feedback when gathering resources
    console.log(`+1 ${resource}!`);
    // TODO: Add visual feedback animation
}

// ==============================================
// CRAFTING SYSTEM
// ==============================================

function attemptCrafting() {
    // Get the first toy from the recipe list (current order)
    const toyName = Object.keys(toyRecipes)[0]; // You can modify this logic
    const recipe = toyRecipes[toyName];
    
    console.log(`Attempting to craft: ${toyName}`);
    console.log(`Required:`, recipe);
    console.log(`Current inventory:`, gameState.inventory);
    
    // Check if player has enough resources
    let canCraft = true;
    for (const [resource, amount] of Object.entries(recipe)) {
        if (gameState.inventory[resource] < amount) {
            canCraft = false;
            console.log(`Not enough ${resource}! Need ${amount}, have ${gameState.inventory[resource]}`);
        }
    }
    
    if (canCraft) {
        // Deduct resources
        for (const [resource, amount] of Object.entries(recipe)) {
            gameState.inventory[resource] -= amount;
        }
        
        console.log(`Successfully crafted ${toyName}!`);
        console.log(`Remaining inventory:`, gameState.inventory);
        
        // TODO: Add the crafted toy to inventory or put area
        craftingSuccess(toyName);
    } else {
        console.log(`Cannot craft ${toyName} - missing resources`);
        craftingFailed();
    }
}

function craftingSuccess(toyName) {
    console.log(`Crafted: ${toyName}`);
    // TODO: Add visual feedback
    // TODO: Move toy to put area or player inventory
}

function craftingFailed() {
    console.log('Crafting failed - not enough resources');
    // TODO: Add visual feedback (shake animation, sound, etc.)
}

// ==============================================
// DELIVERY SYSTEM
// ==============================================

function deliverToy(toyName) {
    // Called when a toy is placed in the put area
    console.log(`Delivered: ${toyName}`);
    decrementDelivery();
    
    // TODO: Remove toy from current order
    // TODO: Generate new order
}

// ==============================================
// GAME OVER / WIN CONDITIONS
// ==============================================

function gameOver() {
    console.log('Game Over - Time\'s up!');
    alert('Time\'s up! Game Over!');
    // TODO: Add proper game over screen
}

function gameWon() {
    console.log('You Win! All deliveries completed!');
    alert('Congratulations! All toys delivered!');
    // TODO: Add proper win screen
}

// ==============================================
// INITIALIZATION
// ==============================================

function initGame() {
    console.log('Initializing game...');
    
    // Start timer
    updateTimer();
    
    // Initialize delivery counter
    updateDeliveryCounter();
    
    // Add click handlers to all stations
    document.querySelectorAll('.station').forEach(station => {
        station.addEventListener('click', handleStationClick);
    });
    
    console.log('Game initialized!');
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

// Add any additional helper functions here

// ==============================================
// TO ADD NEW FEATURES:
// 
// 1. NEW RESOURCE:
//    - Add to gameState.inventory
//    - Add station HTML in index.html
//    - Resource will automatically work
//
// 2. NEW TOY:
//    - Add recipe to toyRecipes object
//    - Add HTML in recipe card
//    - Crafting system will handle it
//
// 3. NEW GAME MECHANIC:
//    - Add state to gameState object
//    - Create functions for the mechanic
//    - Hook into existing event handlers
// ==============================================