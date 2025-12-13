# 🎄 Elf Workshop Game
🎮 Overview
Elf Workshop Game is a fast-paced time management game where you play as Santa's elf, gathering resources, crafting toys, and delivering them to meet orders before time runs out. The game features 5 progressively challenging levels with multiple difficulty modes, a streak system for speed bonuses, and engaging visual feedback.
📋 Table of Contents

Features
Installation
How to Play
Game Mechanics
Architecture
File Structure
Customization Guide
Technical Details
Accessibility
Browser Compatibility
Troubleshooting

✨ Features
Core Gameplay

Resource Management: Gather wood, metal, and fabric from dedicated stations
Crafting System: Combine resources to create 5 different toy types
Order Queue: Dynamic order generation with visual progress tracking
Time Pressure: Complete deliveries before the timer expires
Level Progression: 5 levels with increasing difficulty and time bonuses

Difficulty Modes

Easy: 1 starting order, slower progression, 70% chance of single-quantity recipes
Medium: 1 starting order, moderate progression, 50% chance of single-quantity recipes
Hard: 2 starting orders, fast progression, 40% chance of single-quantity recipes

Advanced Features

Streak System: Complete deliveries quickly to gain speed bonuses (up to 3x)
Smart Order Generation: Prevents duplicate orders when possible
Visual Feedback: Particle effects, floating text, and station highlighting
Collision Detection: Realistic elf movement with station collision
Pause/Resume: Escape key to pause game at any time
Responsive UI: Adapts to different screen sizes

🚀 Installation
Quick Start

Download all files into a single directory:

   elf-workshop/
   ├── Index.html
   ├── Style.css
   ├── Script.js (legacy monolithic file)
   ├── main.js
   ├── state.js
   ├── ui.js
   ├── crafting.js
   ├── movement.js
   └── Code.code-workspace

Add audio files (optional but recommended):

pickup.mp3 - Resource collection sound
craft.mp3 - Toy crafting sound
deliver.mp3 - Delivery completion sound


Add background texture (optional):

wood-texture.jpg - Workshop floor background


Open Index.html in a modern web browser

Module-Based Setup (Recommended)
The game uses ES6 modules for better code organization. Ensure your HTML file includes:
html<script src="main.js" type="module"></script>
```

**Note**: ES6 modules require a web server when using `file://` protocol. Use one of these methods:

- **Python 3**: `python -m http.server 8000`
- **Node.js**: `npx http-server`
- **VS Code**: Use Live Server extension

## 🎯 How to Play

### Starting the Game

1. **Rules Screen**: Press `Enter` to continue
2. **Difficulty Selection**: Choose Easy, Medium, or Hard
3. **Game Begins**: Timer starts counting down

### Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Move Up |
| `S` / `↓` | Move Down |
| `A` / `←` | Move Left |
| `D` / `→` | Move Right |
| `E` | Interact (pickup/deposit/deliver) |
| `C` | Craft at crafting table |
| `Esc` | Pause/Resume game |

### Gameplay Loop

1. **Check Orders**: View the recipe card (top-left) for current toy orders
2. **Gather Resources**: Walk to resource stations and press `E` to pick up materials
3. **Deposit Materials**: Walk near the crafting table - resources auto-deposit
4. **Craft Toys**: Press `C` at the crafting table when materials are ready
5. **Deliver**: Carry crafted toy to the "put area" and press `E`
6. **Repeat**: New orders generate automatically

### Visual Indicators

- **Green Glow**: Station is in interaction range
- **Craftable Orders**: Green-bordered orders in recipe card
- **Progress Bar**: Shows crafting completion percentage
- **Arrow Indicator** (Easy mode): Points to next needed resource
- **Crafting Table Contents**: Displays deposited materials

## 🔧 Game Mechanics

### Resource Types

| Resource | Icon | Uses |
|----------|------|------|
| Wood | 🪵 | Basic building material |
| Metal | 🔩 | Mechanical parts |
| Fabric | 🧵 | Soft toy components |

### Toy Recipes

| Toy | Wood | Metal | Fabric | Unlocked |
|-----|------|-------|--------|----------|
| Train | 2 | 2 | - | Level 1 |
| Christmas Tree | 3 | - | 1 | Level 2 |
| Gingerbread Man | 1 | - | 1 | Level 3 |
| Teddy Bear | 1 | - | 3 | Level 4 |
| Nutcracker | 2 | 2 | 1 | Level 5 |

### Level Progression

| Level | Required Deliveries | Time Limit | Available Toys |
|-------|---------------------|------------|----------------|
| 1 | 3 | 3:00 | Train |
| 2 | 4 | 2:30 | Train, Christmas Tree |
| 3 | 5 | 2:30 | Train, Christmas Tree, Gingerbread |
| 4 | 6 | 3:00 | All except Nutcracker |
| 5 | 7 | 3:00 | All toys |

**Time Bonus**: Remaining time carries over to the next level!

### Streak System

Complete deliveries within **4.5 seconds** to build a streak:

- **Streak 1**: Normal speed (280 px/s)
- **Streak 2**: +60 px/s bonus speed
- **Streak 3**: +120 px/s bonus speed (max)

Speed bonus lasts for 4.5 seconds after each delivery.

### Collision System

- Elf cannot walk through stations
- Collision resolution uses axis-aligned bounding boxes (AABB)
- Stations have reduced hitboxes (75% of visual size) for better movement

## 📐 Architecture

### Module Structure

The game uses a modular architecture for maintainability:
```
main.js          → Game initialization, level management, event coordination
state.js         → Shared state, constants, audio, effects
ui.js            → Display updates, visual feedback
crafting.js      → Resource gathering, crafting logic, delivery
movement.js      → Elf movement, collision detection, input handling
```

### Data Flow
```
User Input → movement.js → state.js → crafting.js → ui.js → DOM
                ↓                          ↓
         Game Loop (main.js)      Audio/Effects (state.js)
Key Design Patterns

State Management: Centralized in state.js for predictable data flow
Event Bus: Simple pub/sub system for decoupled communication
Object Pools: Reusable particle and text elements for performance
Idle Callbacks: Non-critical UI updates deferred with requestIdleCallback

📁 File Structure
HTML (Index.html)

Game container structure
Overlays: rules, difficulty selection, pause menu
Station elements with data attributes
Elf character element
Recipe card and HUD elements

CSS (Style.css)

Responsive layout with clamp() for fluid sizing
Station styling with hover effects and tooltips
Animation keyframes for particles, floating text
Overlay and modal designs
Accessibility utilities (.sr-only)

JavaScript Modules
state.js - Global State
javascriptCONSTANTS          // Game configuration
gameState          // Current game state
toyRecipes         // Toy crafting recipes
levelConfig        // Level definitions
craftingTable      // Material storage
soundLibrary       // Audio assets
effectPools        // Reusable DOM elements
main.js - Core Game Logic
javascriptinitGame()                    // Setup game on load
startGameWithDifficulty()    // Begin gameplay
generateNewOrder()           // Create orders
levelComplete()              // Level transition
gameLoop()                   // Main update loop
startTimer()                 // Countdown timer
crafting.js - Resource/Crafting
javascriptgatherResource()             // Pick up materials
depositMaterialForCrafting() // Add to crafting table
attemptCrafting()           // Create toy from materials
deliverToy()                // Complete order
autoDepositIfCraftingNearby() // Convenience feature
movement.js - Player Control
javascriptupdateElfPosition()          // Apply movement per frame
resolveCollisions()         // Handle station collisions
checkStationProximity()     // Detect nearby stations
handleInteraction()         // Process E key
handleKeyDown/Up()          // Input handling
ui.js - Display Updates
javascriptupdateTimer()                // Clock display
updateOrderDisplay()        // Recipe card
updateCarryingDisplay()     // Held item
updateCraftingProgress()    // Progress bar
markCraftableOrders()       // Highlight ready orders
showPickupEffects()         // Visual feedback
🛠️ Customization Guide
Adding a New Resource

Add station HTML:

html<div class="station" id="newresource-station" data-resource="newresource">
    <div class="station-label">newresource</div>
    <div class="station-icon"></div>
</div>

Add icon in state.js:

javascriptexport const resourceIcons = {
    wood: '🪵',
    metal: '🔩',
    fabric: '🧵',
    newresource: '🎨' // Your icon
};

Add CSS styling (optional):

css#newresource-station .station-icon {
    background: #your-color;
}
Adding a New Toy

Define recipe in state.js:

javascriptexport const toyRecipes = {
    // ... existing toys
    'robot': {
        metal: 3,
        fabric: 1,
        newresource: 2
    }
};

Add to level config:

javascriptexport const levelConfig = [
    // ... existing levels
    { 
        requiredDeliveries: 8, 
        timeLimit: 200, 
        availableToys: ['train', 'christmas-tree', 'gingerbread', 'teddy', 'nutcracker', 'robot'] 
    }
];

Add CSS class for styling (optional):

css.toy-robot .materials {
    margin-left: 10px;
}
Adding a New Level
Simply append to levelConfig in state.js:
javascript{ 
    requiredDeliveries: 10,    // Orders to complete
    timeLimit: 240,            // Time bonus (seconds)
    availableToys: ['train', 'robot', 'spaceship']
}
Modifying Difficulty
Edit difficultySettings in state.js:
javascriptexpert: {
    startOrders: 3,              // Initial order count
    increaseEveryLevels: 1,      // Orders increase frequency
    singleQuantityChance: 0.2    // Smaller recipe probability
}
Changing Game Speed
In state.js:
javascriptelf: {
    baseSpeed: 350,  // Increase for faster movement
    // ...
}

CONSTANTS = {
    streakSpeedBonus: 80,  // Per-streak speed increase
    streakWindowMs: 4500,  // Streak time window
    // ...
}
🔍 Technical Details
Performance Optimizations

Object Pooling: Reuses DOM elements for particles and floating text

javascript   // state.js
   ensureEffectPools() // Pre-creates reusable elements

Idle Callbacks: Defers non-critical updates

javascript   scheduleIdle(() => updateCraftingProgress());

CSS will-change: Hints browser for elf transform optimization

css   .elf { will-change: transform; }

Animation via classList: Restarts CSS animations efficiently

javascript   el.classList.remove('animating');
   void el.offsetWidth; // Force reflow
   el.classList.add('animating');
Collision Detection Algorithm
Uses AABB (Axis-Aligned Bounding Box) detection:
javascriptfunction rectIntersect(a, b) {
    return a.x < b.x + b.w && 
           a.x + a.w > b.x && 
           a.y < b.y + b.h && 
           a.y + a.h > b.y;
}
Resolution prioritizes smallest overlap axis to prevent sticking.
Coordinate System

Origin: Top-left corner (0, 0)
Elf Position: Top-left corner of elf sprite
Station Position: Center point for proximity checks
Collision Boxes: Inset by 25% from visual bounds

Audio System
javascriptsoundLibrary[name].currentTime = 0;  // Reset to start
soundLibrary[name].play();           // Play immediately
Catches exceptions for browsers blocking autoplay.
♿ Accessibility
Features Implemented

ARIA Labels: All interactive elements labeled
Live Regions: Screen reader announcements for game events
Keyboard-Only Play: Full game playable without mouse
Focus Management: Tabindex and focus trapping in overlays
Semantic HTML: Proper heading hierarchy and landmarks
Alt Text: All images have descriptive alternatives

Screen Reader Announcements
javascriptannounce("Picked up wood");      // Resource gathering
announce("Crafted train");       // Toy creation
announce("Delivered teddy");     // Order completion
Announcements sent to #aria-live element with role="status".
Keyboard Navigation

Tab: Navigate buttons in overlays
Enter: Activate buttons, confirm selections
Escape: Pause game, close dialogs
WASD/Arrows: Game movement (doesn't require focus)

🌐 Browser Compatibility
Minimum Requirements

Chrome/Edge: 90+
Firefox: 88+
Safari: 14+
Opera: 76+

Required Features

ES6 Modules
CSS Grid/Flexbox
clamp() CSS function
requestAnimationFrame
requestIdleCallback (optional, has fallback)

Known Issues

Safari < 14: clamp() not supported - use fixed sizes
Firefox < 88: Module script loading inconsistent - use polyfill
Mobile Browsers: Touch controls not implemented

Testing Checklist

 Stations render correctly
 Elf movement smooth at 60 FPS
 Audio plays without user gesture (or after first interaction)
 Overlays display properly
 Orders generate and clear correctly
 Timer counts down accurately
 Pause/resume works

🐛 Troubleshooting
Game Won't Start
Problem: Blank screen or console errors
Solutions:

Check browser console (F12) for errors
Ensure all files in same directory
Use web server (not file:// protocol)
Verify type="module" in script tag

Audio Not Playing
Problem: Sounds don't work
Solutions:

Check audio files exist and are named correctly
Try user interaction first (click/keypress) to unlock audio
Lower volume in CONSTANTS if distorted
Check browser autoplay policy settings

Elf Gets Stuck
Problem: Character cannot move past stations
Solutions:

Reduce station blocker size in initStationPositions()
Increase elfMargin in CONSTANTS
Check for overlapping collision boxes

Performance Issues
Problem: Lag or stuttering
Solutions:

Reduce particlePoolSize and floatingTextPoolSize
Disable particle effects in production
Increase scheduleIdle timeout values
Check for memory leaks in console

Orders Not Crafting
Problem: "Ready to craft!" but nothing happens
Solutions:

Ensure elf is not carrying anything
Walk directly to crafting station
Press C (not E) to craft
Check console for recipe matching errors

Module Loading Errors
Problem: "Cannot use import outside a module"
Solutions:

Add type="module" to script tag
Use HTTP server instead of file:// protocol
Check for syntax errors in JS files
Verify import paths are correct

📝 Development Notes
Code Style

ES6+: Arrow functions, destructuring, template literals
Modules: Explicit imports/exports
Naming: camelCase for functions, UPPER_CASE for constants
Comments: JSDoc-style for public functions

Future Enhancements

 Mobile touch controls
 Sound toggle button
 High score tracking with localStorage
 More toy types and resources
 Workshop upgrades system
 Mini-games for resource gathering
 Multiplayer mode
 Achievement system

Contributing
When adding features:

Follow existing module structure
Add to appropriate file (state/ui/crafting/movement)
Update this README
Test across browsers
Maintain accessibility features


📄 License
This project is provided as-is for educational and personal use.
🎄 Credits
Created as a festive workshop management game. Enjoy helping Santa fulfill toy orders!
Version: 2.0 (Modular Architecture)
Last Updated: December 2025
