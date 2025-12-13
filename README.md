# 🎄 Elf Workshop Game

A festive resource management and crafting game where you play as Santa's elf, gathering materials, crafting toys, and fulfilling orders before time runs out!

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [How to Play](#how-to-play)
- [Game Mechanics](#game-mechanics)
- [Level Progression](#level-progression)
- [Controls](#controls)
- [Customization Guide](#customization-guide)
- [Technical Details](#technical-details)
- [Troubleshooting](#troubleshooting)

## 🎮 Overview

In **Elf Workshop Game**, you manage a busy toy workshop where you must:
- Gather resources (wood, metal, fabric)
- Craft toys according to order specifications
- Deliver completed toys before the timer runs out
- Progress through increasingly challenging levels

The game features three difficulty modes, five unique toy types, and multiple levels with escalating complexity.

## ✨ Features

### Gameplay Features
- **Three Difficulty Modes**: Easy, Medium, and Hard with different order quantities and progression rates
- **Five Toy Types**: Train, Christmas Tree, Gingerbread Man, Teddy, and Nutcracker
- **Progressive Difficulty**: Five levels with increasing order requirements and decreasing time limits
- **Resource Management**: Collect and manage wood, metal, and fabric resources
- **Crafting System**: Combine materials at the crafting station to create toys
- **Time Bonus**: Unused time carries over to the next level
- **Dynamic Orders**: Multiple simultaneous orders that increase with difficulty

### UI Features
- Collapsible recipe card showing current orders
- Real-time inventory display
- Level and timer tracking
- Delivery counter
- Visual feedback for station interactions
- Festive themed design with Santa hat decoration

## 🚀 Getting Started

### Installation

1. **Download the game files:**
   - `Index.html` - Main HTML structure
   - `Style.css` - Game styling and layout
   - `Script.js` - Game logic and mechanics

2. **Optional assets** (place in the same directory):
   - `wood-texture.jpg` - Background texture (or the game will use a fallback color)
   - Custom sprite images for stations and characters

3. **Open in browser:**
   ```bash
   # Simply open Index.html in any modern web browser
   # Recommended browsers: Chrome, Firefox, Edge, Safari
   ```

### File Structure
```
elf-workshop-game/
├── Index.html          # Main game file
├── Style.css           # Styling and animations
├── Script.js           # Game logic
├── wood-texture.jpg    # (Optional) Background image
└── Assets/             # (Optional) Custom sprites
    ├── elf.png
    ├── wood-bench.png
    ├── metal-bench.png
    ├── fabric-bench.png
    └── crafting-table.png
```

## 🎯 How to Play

### Starting the Game

1. **Read the Rules**: Press Enter to continue past the rules overlay
2. **Select Difficulty**:
   - **Easy**: 1 order at start, increases every 2 levels, 70% chance for single items
   - **Medium**: 1 order at start, increases every level, 50% chance for single items
   - **Hard**: 2 orders at start, increases every level, 40% chance for single items
3. **Game Begins**: Timer starts and you can begin gathering resources

### Gameplay Loop

1. **Check Orders**: Review the recipe card (left side) to see what toys are needed
2. **Gather Resources**: Move to resource stations (wood, metal, fabric) and press **E** to pick up
3. **Deposit Materials**: Bring resources to the crafting station and press **E** to deposit
4. **Craft Toys**: Once you have all required materials, press **C** at the crafting station
5. **Deliver**: Carry the crafted toy to the "put area" and press **E** to complete the delivery
6. **Repeat**: Continue until all orders are fulfilled or time runs out

## 🛠️ Game Mechanics

### Resource Management
- **One Item at a Time**: You can only carry one resource or toy at once
- **Resource Stations**: Unlimited supply of wood, metal, and fabric
- **Crafting Table**: Stores deposited materials until crafting is complete

### Crafting System

Each toy requires specific materials:

| Toy | Wood | Metal | Fabric |
|-----|------|-------|--------|
| **Train** | 2 | 2 | - |
| **Christmas Tree** | 3 | - | 1 |
| **Gingerbread Man** | 1 | - | 1 |
| **Teddy** | 1 | - | 3 |
| **Nutcracker** | 2 | 2 | 1 |

**Crafting Process:**
1. Deposit required materials at the crafting station (press E)
2. Materials accumulate in the crafting table
3. When you have enough materials for any order, press C to craft
4. The game automatically selects the first craftable order

### Collision System
- Stations have collision boxes to prevent walking through them
- The elf cannot pass through resource stations or the crafting table
- Collision detection uses axis-aligned bounding box (AABB) algorithm

### Station Interaction
- **Interaction Range**: 100 pixels from station center
- **Visual Feedback**: Stations glow gold when in range
- **Multiple Stations**: Only the nearest station highlights at a time

## 📊 Level Progression

### Level Configuration

| Level | Orders Required | Time Limit | Available Toys |
|-------|----------------|------------|----------------|
| **1** | 3 | 3:00 | Train |
| **2** | 4 | 2:30 | Train, Christmas Tree |
| **3** | 5 | 2:30 | Train, Christmas Tree, Gingerbread |
| **4** | 6 | 3:00 | Train, Christmas Tree, Gingerbread, Teddy |
| **5** | 7 | 3:00 | All toys |

### Progression Mechanics
- **Time Bonus**: Remaining time carries over to the next level
- **Order Scaling**: Number of simultaneous orders increases based on difficulty
- **Toy Unlocking**: New toy types unlock progressively
- **Winning**: Complete all 5 levels to win the game

## 🎮 Controls

### Movement
- **WASD** or **Arrow Keys**: Move the elf in all directions
- Diagonal movement is supported and normalized for consistent speed

### Interactions
- **E Key**: 
  - Pick up resources from stations
  - Deposit resources at crafting station
  - Deliver toys at put area
- **C Key**: 
  - Craft toys at the crafting station (when materials are available)

### UI Interactions
- **Click Recipe Title**: Toggle the recipe card open/closed
- **Enter**: Continue from rules screen
- **Mouse Click**: Select difficulty and restart game

## 🔧 Customization Guide

### Adding New Toys

1. **Add Recipe to Script.js:**
```javascript
const toyRecipes = {
    // Existing recipes...
    "your-new-toy": {
        wood: 2,
        metal: 1,
        fabric: 1
    }
};
```

2. **Add to Level Configuration:**
```javascript
const levelConfig = [
    // Add to availableToys array in desired level
    { 
        requiredDeliveries: 5, 
        timeLimit: 180, 
        availableToys: ['train', 'your-new-toy'] 
    }
];
```

3. **Add HTML Recipe Display (Index.html):**
```html
<div class="recipe-item toy-your-new-toy">
    <div class="recipe-item-name">Item: your new toy</div>
    <div class="materials">
        <div>2x wood</div>
        <div>1x metal</div>
        <div>1x fabric</div>
    </div>
</div>
```

4. **Add Optional Custom Styling (Style.css):**
```css
.toy-your-new-toy .materials {
    margin-left: 10px;
    /* Add custom styling */
}
```

### Adding New Resources

1. **Add Station HTML (Index.html):**
```html
<div class="station" id="newresource-station" data-resource="newresource">
    <div class="station-label">new resource</div>
    <div class="station-icon">
        <!-- Optional: <img src="Assets/newresource.png" /> -->
    </div>
</div>
```

2. **Add Custom Styling (Style.css):**
```css
#newresource-station .station-icon {
    background: #customcolor;
}
```

3. **Update Recipes** to use the new resource in Script.js

### Adjusting Difficulty

Modify `difficultySettings` in Script.js:
```javascript
difficultySettings: {
    easy: {
        startOrders: 1,                    // Initial simultaneous orders
        increaseEveryLevels: 2,            // Levels between order increases
        singleQuantityChance: 0.7          // Currently unused (future feature)
    }
}
```

### Modifying Level Requirements

Edit `levelConfig` array in Script.js:
```javascript
const levelConfig = [
    { 
        requiredDeliveries: 3,              // Orders to complete
        timeLimit: 180,                     // Seconds given (+ carryover)
        availableToys: ['train', 'teddy']   // Available toy types
    }
];
```

## 🔍 Technical Details

### Architecture

**Game State Management:**
- Centralized `gameState` object tracks all game data
- Single source of truth for elf position, inventory, orders, and timing

**Rendering:**
- Vanilla JavaScript DOM manipulation
- CSS transforms for smooth movement
- RequestAnimationFrame for game loop (targeting 60 FPS)

**Collision Detection:**
- Rectangle intersection algorithm (AABB)
- Separate collision and visual layers
- 25% inset on station hitboxes for forgiving gameplay

### Performance Considerations

- **Game Loop**: Fixed at ~60 FPS using requestAnimationFrame
- **Delta Time**: Frame-independent movement using delta time calculations
- **Event Delegation**: Minimal event listeners for efficiency
- **CSS Hardware Acceleration**: Transform-based animations

### Browser Compatibility

- **Tested On**: Chrome, Firefox, Edge, Safari
- **Requirements**: ES6+ JavaScript support
- **Responsive**: Adapts to different screen sizes with clamp() functions

## 🐛 Troubleshooting

### Common Issues

**Game won't start:**
- Ensure all three files (HTML, CSS, JS) are in the same directory
- Check browser console (F12) for JavaScript errors
- Verify you've selected a difficulty mode

**Elf moves too fast/slow:**
- Adjust `elf.speed` value in Script.js (default: 280 pixels/second)

**Can't interact with stations:**
- Check interaction distance (default: 100 pixels)
- Ensure station has correct `data-resource` attribute
- Verify station positions are initialized (check console)

**Timer not working:**
- Verify game is running (`gameState.isGameRunning === true`)
- Check for JavaScript errors in console

**Orders not appearing:**
- Ensure difficulty is selected
- Check `orderQueue` in game state
- Verify `generateInitialOrders()` is called after difficulty selection

### Debug Mode

Add to browser console while playing:
```javascript
// View current game state
console.log(gameState);

// Check elf position
console.log(gameState.elf);

// View current orders
console.log(gameState.orderQueue);

// Check crafting table contents
console.log(craftingTable);
```

## 📝 License

This game is provided as-is for educational and entertainment purposes. Feel free to modify and extend it for your own projects!

## 🎄 Credits

Created as a festive resource management game demonstration. Perfect for learning game development concepts including:
- Game loops and delta time
- State management
- Collision detection
- UI/UX design
- Progressive difficulty systems

---

**Enjoy crafting toys and spreading holiday cheer! 🎅🎁**
