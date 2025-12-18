# 🎄 Elf Workshop Game

A festive resource management and crafting game where you play as an elf in Santa's workshop, gathering materials, crafting toys, and delivering them before time runs out!

## 🎮 Game Overview

Navigate a busy Christmas workshop, collect resources from various stations, craft toys according to orders, and deliver them to Santa's sack. Progress through increasingly challenging levels with more toy types and tighter time constraints.

## 🕹️ Controls

- **WASD** - Move the elf around the workshop
- **E** - Interact with stations (pickup resources, deposit materials, deliver toys)
- **C** - Craft toys at the workbench (when materials are ready)
- **ESC** - Pause/Resume game
- **Click Recipe Title** - Toggle order list open/closed

## 📋 How to Play

1. **Check Orders**: Look at the recipe scroll to see what toys need to be crafted
2. **Gather Resources**: Walk to resource stations (wood, metal, fabric, cotton) and press **E** to pick up materials
3. **Deposit Materials**: Carry resources to the crafting workbench - they auto-deposit when you get close
4. **Craft Toys**: When you have all required materials, press **C** or **E** at the workbench to craft
5. **Deliver**: Carry the completed toy to Santa's sack and press **E** to deliver
6. **Complete Level**: Finish all orders before time runs out to advance!

## 🎯 Difficulty Modes

- **Easy**: Start with 1 order, slower difficulty progression, helpful arrow indicators
- **Medium**: Balanced challenge with moderate progression
- **Hard**: Start with 2 orders, faster difficulty scaling, maximum pressure!

## 🎨 Game Features

### Resource Management
- **Wood** 🪵 - Basic building material
- **Metal** 🔩 - For mechanical toys
- **Fabric** 🧵 - For soft toys and decoration
- **Cotton** 🧶 - For stuffed toys

### Toy Recipes
- **Train**: 2 wood + 2 metal
- **Christmas Tree**: 3 wood + 1 fabric
- **Gingerbread Man**: 1 wood + 1 fabric
- **Teddy Bear**: 1 wood + 3 fabric
- **Nutcracker**: 2 wood + 2 metal + 1 fabric

### Level Progression
- 5 levels with increasing difficulty
- New toy types unlock as you progress
- Time bonuses added between levels
- Queue capacity increases with difficulty

### Special Mechanics
- **Auto-deposit**: Resources automatically deposit when near the workbench
- **Visual Feedback**: Glowing stations when in range, particles on successful actions
- **Crafting Progress**: Real-time display of materials needed for current orders
- **Collision System**: Realistic movement around stations and workshop boundaries

## 🏗️ Project Structure

```
elf-workshop-game/
├── Index.html          # Main HTML structure
├── Style.css           # All styling and animations
├── Script.js           # Original monolithic game logic (legacy)
├── main.js             # Game initialization and main loop
├── state.js            # Game state management
├── crafting.js         # Crafting and resource logic
├── movement.js         # Player movement and collision detection
├── ui.js               # UI updates and visual feedback
└── imgs/               # Game assets directory
    ├── Background/     # Floor, walls, decorations
    ├── Character/      # Elf sprites and animations
    ├── ItemBench/      # Resource station sprites
    ├── WorkBench/      # Crafting bench variations
    ├── Toys/           # Toy and delivery area sprites
    └── UI/             # Interface elements
```

## 🔧 Configuration & Customization

### Adjusting Difficulty
Edit `state.js` → `difficultySettings` object:
```javascript
easy: { 
    startOrders: 1,           // Initial queue size
    increaseEveryLevels: 2,   // How often to add queue slots
    singleQuantityChance: 0.7 // Not currently used
}
```

### Adding New Resources
1. Add station HTML in `Index.html` with `data-resource="resourcename"`
2. Add sprite styling in `Style.css`
3. Add icon to `resourceIcons` in `state.js`
4. Use in toy recipes

### Adding New Toys
1. Add recipe to `toyRecipes` in `state.js`:
```javascript
'toy-name': { wood: 2, fabric: 1 }
```
2. Add to level configuration in `availableToys` array
3. Add recipe card HTML in `Index.html` (optional)
4. Add custom styling in `Style.css` if needed

### Collision Hitboxes
Edit `Script.js` → `initStationPositions()`:
- **Elf hitbox**: Adjust `gameState.elf.width` and `height`
- **Station hitboxes**: Change `inset` percentage (higher = smaller hitbox)
- **Wall expansion**: Modify `wallExpansion` values
- **Workbench hitbox**: Adjust `yOffset`, `xOffset`, and `heightExtension`

### Interaction Distance
Edit `state.js` → `CONSTANTS.interactionDistance`:
```javascript
interactionDistance: 150  // Smaller = must be closer to interact
```

## 🎨 Asset Requirements

### Sprite Sheets Needed
- Elf animations: idle, walking (4 directions)
- Resource benches: wood, metal, fabric, cotton
- Crafting workbench: base + material combinations
- Background: floor tiles, stone walls, snowy grass
- Decorations: Christmas tree, presents, shelves
- UI: recipe scroll (open/closed states), Santa's sack

### Animation Frame Format
Elf sprites use CSS keyframe animations cycling through 4 frames at 0%, 25%, 50%, 75%, 100%.

## 🐛 Known Limitations

- Sounds require user interaction to play (browser autoplay restrictions)
- Station positions must be recalculated on window resize
- Single-item carrying capacity (gameplay design choice)
- File paths assume specific image directory structure

## 🚀 Running the Game

1. Ensure all files and the `imgs/` directory are in the same folder
2. Open `Index.html` in a modern web browser
3. Click through the splash screen and rules
4. Select difficulty and start playing!

**Note**: Best played in fullscreen or maximized browser window for optimal layout.

## 🎯 Gameplay Tips

- **Plan ahead**: Check what materials are needed for upcoming orders
- **Stay organized**: Don't just craft the first order - prioritize what you can complete fastest
- **Use auto-deposit**: Walk near the workbench with resources to save an interaction
- **Time management**: Remember time carries over between levels - don't rush if you have buffer
- **Easy mode arrows**: In easy mode, follow the gold arrows for efficiency guidance

## 📝 Credits

Game developed with modular JavaScript architecture, sprite-based animations, and festive Christmas theming. Built for browser gameplay with keyboard controls and visual feedback systems.

---

**Merry Crafting! 🎅🎄**
