# Conway's Game of Life - Ultra Fast Enhanced

An interactive Conway's Game of Life simulation built with p5.js, featuring configurable boundary conditions, real-time speed control, and modern UI design.

## Features

### Core Functionality
- ✅ Conway's Game of Life simulation
- ✅ Configurable boundary conditions (Nothing, Pulse, Solid)
- ✅ Real-time speed control (1-1000 FPS)
- ✅ Pause/Start functionality
- ✅ Random pattern generation
- ✅ Manual cell editing when paused

### Advanced Features
- ✅ Flashing pulse boundary pattern
- ✅ Shifting pulse boundary option
- ✅ Configurable simulation dimensions
- ✅ Variable boundary row count
- ✅ Pulse pattern width control
- ✅ Live statistics (generation, live cells, FPS)
- ✅ Modern glassmorphism UI design

### Performance Optimizations
- ✅ Efficient cell state management with Uint8Array
- ✅ Active cell tracking with Set data structure
- ✅ Optimized neighbor counting
- ✅ Separate graphics buffer for boundary rendering
- ✅ Web Worker for parallel computation
- ✅ Pixel-based rendering for maximum speed

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open `http://localhost:8080` in your browser

## Usage

### Controls

**Basic Controls:**
- **Start/Pause Button**: Toggle simulation on/off
- **Reset Button**: Clear the grid and generate a new random pattern

**Speed Control:**
- **Speed Slider**: Adjust simulation speed from 1 to 1000 FPS
- **FPS Display**: Shows current target frame rate

**Boundary Configuration:**
- **Top Boundary**: Choose between "Nothing (Empty)", "Flashing Pulse", "Shifting Pulse", or "Solid Black Line"
- **Boundary Rows**: Set the number of boundary rows (1-50)
- **Pulse Pattern Width**: Control the width of the pulse pattern (1-50 cells)
- **Pulse Shift**: Number of columns to shift the pulse each step

**Simulation Size:**
- **Simulation Width**: Adjust canvas width (100-1200 pixels)
- **Simulation Height**: Adjust canvas height (100-800 pixels)

### Interaction

**Mouse Controls:**
- Click on cells when paused to toggle their state
- Only works in the game area (below the red separator line)

**Visual Elements:**
- **Black squares**: Live cells
- **White squares**: Dead cells
- **Red line**: Separates boundary from game area
- **Top boundary**: Configurable pattern that affects neighbor counting

## Technical Details

### Architecture

The project is organized into modular JavaScript files:

- **`js/utils.js`**: Constants, helper functions, and configuration
- **`js/game.js`**: Core game logic and Conway's algorithm
- **`js/ui.js`**: DOM manipulation and event handlers
- **`js/gameWorker.js`**: Web Worker for parallel computation

### Performance Features

1. **Typed Arrays**: Uses `Uint8Array` for efficient memory access
2. **Web Worker**: Offloads computation to background thread
3. **Active Cell Tracking**: Only processes cells that are alive or have live neighbors
4. **Pixel-Based Rendering**: Direct canvas pixel manipulation for speed
5. **Cached Graphics**: Pre-rendered boundary graphics for efficiency

### Browser Compatibility

- Modern browsers with Web Worker support
- Chrome, Firefox, Safari, Edge (latest versions)
- Requires local server (not `file://` URLs) for Web Workers

## Development

### Project Structure
```
conways-game-of-life/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styles and animations
├── js/
│   ├── utils.js        # Constants and utilities
│   ├── game.js         # Core game logic
│   ├── ui.js           # UI and event handlers
│   └── gameWorker.js   # Web Worker implementation
├── assets/             # Future asset storage
├── package.json        # Project configuration
└── README.md          # This file
```

### Script Loading Order
```html
<script src="js/utils.js"></script>      <!-- Constants first -->
<script src="js/game.js"></script>       <!-- Game logic -->
<script src="js/ui.js"></script>         <!-- UI handlers -->
```

### Development Commands
```bash
npm start    # Start development server
npm run dev  # Start on port 3000
```

## Performance Expectations

- **Target Performance**: 100-120 FPS on modern hardware
- **Grid Size**: Supports up to 1200x800 cells efficiently
- **Memory Usage**: Optimized with typed arrays and active cell tracking
- **Scalability**: Web Worker allows for larger grids without blocking UI

## Troubleshooting

### Common Issues

1. **Web Worker not loading**: Ensure you're using a local server, not `file://` URLs
2. **Slow performance**: Check browser console for errors, verify Web Worker support
3. **Canvas not appearing**: Check p5.js CDN link, verify browser compatibility
4. **Controls not responding**: Check console for JavaScript errors

### Debug Mode

Open browser console (F12) to see detailed logs:
- "Setup called" - Game initialization
- "UI initialization complete" - UI setup
- "Draw called" - Rendering cycles
- Error messages with context

## Future Enhancements

- Pattern library (gliders, oscillators, etc.)
- Save/load functionality
- Color themes
- Sound effects
- Pattern recognition
- Performance metrics dashboard
- Mobile touch support

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Credits

- Built with [p5.js](https://p5js.org/)
- Conway's Game of Life algorithm by John Conway
- Modern UI design with glassmorphism effects 