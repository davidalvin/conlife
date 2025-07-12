// Game configuration
const GAME_CONFIG = {
    // Simulation size in Game of Life cells (grid units)
    SIMULATION_WIDTH_CELLS: 1024,   // number of cells across
    SIMULATION_HEIGHT_CELLS: 1024,  // number of cells down
    
    // Cell size in pixels
    CELL_SIZE: 4,
    
    // Boundary configuration
    PULSE_ROWS: 10,
    PULSE_WIDTH: 5,
    
    // Speed configuration
    MIN_SPEED: 1,
    MAX_SPEED: 1000,
    DEFAULT_SPEED: 120,
    
    // Boundary types
    BOUNDARY_TYPES: {
        NOTHING: 'nothing',
        PULSE: 'pulse',
        SOLID: 'solid',
        SHIFT: 'shift'
    }
};

// Game state
let gameState = {
    isRunning: false,
    currentSpeed: GAME_CONFIG.DEFAULT_SPEED,
    generation: 0,
    liveCells: 0,
    boundaryType: GAME_CONFIG.BOUNDARY_TYPES.PULSE,
    lastUpdateTime: 0,
    frameCount: 0,
    lastFpsUpdate: 0,
    actualFps: 0,
    // Debounce DOM updates
    lastDomUpdate: 0,
    domUpdateInterval: 10 // Update DOM every 10 frames
};

// Simulation dimensions
let simWidth = GAME_CONFIG.SIMULATION_WIDTH_CELLS * GAME_CONFIG.CELL_SIZE;
let simHeight = GAME_CONFIG.SIMULATION_HEIGHT_CELLS * GAME_CONFIG.CELL_SIZE;
let cellSize = GAME_CONFIG.CELL_SIZE;
let boundaryRows = GAME_CONFIG.PULSE_ROWS;
let pulseWidth = GAME_CONFIG.PULSE_WIDTH;
let pulseOffset = 0;
let pulseShiftAmount = 1;

let currentCells;
let pulseArray;
let columnCount;
let rowCount;
let boundaryGraphics;
let gameWorker = null;

// OPTIMIZATION: Use Set<number> instead of Set<string> for active cells
// This eliminates string parsing overhead
let activeCells = new Set();

// OPTIMIZATION: Helper function to convert coordinates to flattened index
function getCellIndex(col, row) {
    return col + row * columnCount;
}

// OPTIMIZATION: Helper function to convert flattened index to coordinates
function getCellCoords(index) {
    const row = Math.floor(index / columnCount);
    const col = index % columnCount;
    return [col, row];
}

// Core game functions
function setup() {
    try {
        console.log("Setup called");
        pixelDensity(1);
        frameRate(60); // Set to 60 FPS for smooth animation
        
        // Remove any existing canvas
        const canvasContainer = document.getElementById('canvas-container');
        const oldCanvas = canvasContainer.querySelector('canvas');
        if (oldCanvas) {
            oldCanvas.remove();
        }
        
        // Create new canvas with the specified dimensions
        let canvas = createCanvas(simWidth, simHeight);
        canvas.parent('canvas-container');

        // Calculate grid dimensions
        columnCount = GAME_CONFIG.SIMULATION_WIDTH_CELLS;
        rowCount = GAME_CONFIG.SIMULATION_HEIGHT_CELLS;

        currentCells = createCellArray(columnCount * rowCount);
        pulseArray = createCellArray(columnCount * boundaryRows);

        initializeRandomPattern(currentCells, columnCount, rowCount, boundaryRows, activeCells);
        initializePulsePattern(pulseArray, columnCount, boundaryRows, pulseWidth);
        setupWorker();

        gameState.lastUpdateTime = millis();
        noLoop();
        drawBoundary();
        console.log("Setup complete");
    } catch (error) {
        handleError(error, "setup");
    }
}

function setupWorker() {
    try {
        console.log("Setting up Web Worker");
        gameWorker = new Worker('js/gameWorker.js');
        gameWorker.onmessage = function(e) {
            const { activeCells: newActive, liveCellCount } = e.data;
            activeCells = new Set(newActive);
            gameState.generation++;
            gameState.liveCells = liveCellCount;

            if (gameState.frameCount % gameState.domUpdateInterval === 0) {
                document.getElementById('generationCount').textContent = gameState.generation;
                document.getElementById('liveCells').textContent = liveCellCount;
            }

            renderCurrentState();
        };
        gameWorker.onerror = function(error) {
            console.error("Web Worker error:", error);
        };

        // Send initial state to the worker
        gameWorker.postMessage({
            command: 'init',
            cells: currentCells,
            activeCells: Array.from(activeCells),
            columnCount,
            rowCount,
            boundaryRows,
            boundaryType: gameState.boundaryType,
            pulseWidth,
            pulseOffset
        }, [currentCells.buffer]);

        // After transfer, we no longer keep currentCells locally
        currentCells = createCellArray(columnCount * rowCount);
    } catch (error) {
        handleError(error, "setupWorker");
    }
}

// OPTIMIZATION: More efficient cell drawing using batching
function drawCells(startRow, endRow, cellSize) {
    noStroke();
    fill(0);
    
    // OPTIMIZATION: Only iterate through active cells instead of entire grid
    for (let cellIndex of activeCells) {
        const [col, row] = getCellCoords(cellIndex);
        if (row >= startRow && row < endRow) {
            square(col * cellSize, row * cellSize, cellSize);
        }
    }
}

function drawBoundary() {
    try {
        if (gameState.boundaryType !== GAME_CONFIG.BOUNDARY_TYPES.NOTHING) {
            if (gameState.boundaryType === GAME_CONFIG.BOUNDARY_TYPES.PULSE ||
                gameState.boundaryType === GAME_CONFIG.BOUNDARY_TYPES.SHIFT) {
                // Draw pulse pattern (flashing or shifting)
                noStroke();
                for (let col = 0; col < columnCount; col++) {
                    for (let row = 0; row < boundaryRows; row++) {
                        const index = getIndex(col, row, columnCount);
                        const isPulseOn = Math.floor((col + pulseOffset) / pulseWidth) % 2 === 0;
                        fill(isPulseOn ? 0 : 255);
                        square(col * cellSize, row * cellSize, cellSize);
                    }
                }
            } else if (gameState.boundaryType === GAME_CONFIG.BOUNDARY_TYPES.SOLID) {
                // Draw solid black cells for the boundary
                noStroke();
                fill(0);
                for (let col = 0; col < columnCount; col++) {
                    for (let row = 0; row < boundaryRows; row++) {
                        square(col * cellSize, row * cellSize, cellSize);
                    }
                }
            }
        }
        
        // Draw red separator line
        stroke(255, 0, 0);
        strokeWeight(2);
        line(0, boundaryRows * cellSize, simWidth, boundaryRows * cellSize);
    } catch (error) {
        handleError(error, "drawBoundary");
    }
}

function renderCurrentState() {
    // OPTIMIZATION: Performance monitoring
    PerformanceMonitor.startMeasurement('rendering');
    
    background(255);
    
    // OPTIMIZATION: Only draw active cells instead of entire grid
    drawCells(boundaryRows, rowCount, cellSize);
    
    // Draw the boundary directly on the main canvas
    drawBoundary();
    
    PerformanceMonitor.endMeasurement('rendering');
    
    // OPTIMIZATION: More aggressive debouncing for DOM updates
    if (gameState.frameCount % 30 === 0) {
        let currentTime = millis();
        let fps = (30 * 1000) / (currentTime - gameState.lastFpsUpdate);
        document.getElementById('fps').textContent = fps.toFixed(1);
        gameState.lastFpsUpdate = currentTime;
        gameState.frameCount = 0;
        
        // OPTIMIZATION: Log performance every 30 frames
        if (gameState.frameCount % 300 === 0) {
            PerformanceMonitor.logPerformance();
        }
    }
    gameState.frameCount++;
}

function draw() {
    if (gameState.isRunning) {
        updateGame();
    } else {
        // Paused state: draw the current state
        console.log("Draw called");
        renderCurrentState();
    }
}

function mousePressed() {
    try {
        if (!gameState.isRunning) {
            let col = Math.floor(mouseX / cellSize);
            let row = Math.floor(mouseY / cellSize);
            if (isValidCell(col, row, columnCount, rowCount) && row >= boundaryRows) {
                const index = getCellIndex(col, row);
                if (activeCells.has(index)) {
                    activeCells.delete(index);
                } else {
                    activeCells.add(index);
                }
                document.getElementById('liveCells').textContent = activeCells.size;
                gameWorker.postMessage({ command: 'toggle', index });
                draw();
            }
        }
    } catch (error) {
        handleError(error, "mousePressed");
    }
}

function updateGame() {
    if (gameState.isRunning) {
        PerformanceMonitor.startMeasurement('worker-communication');
        if (gameState.boundaryType === GAME_CONFIG.BOUNDARY_TYPES.PULSE) {
            pulseOffset = (pulseOffset + pulseWidth) % (2 * pulseWidth);
        } else if (gameState.boundaryType === GAME_CONFIG.BOUNDARY_TYPES.SHIFT) {
            pulseOffset = (pulseOffset + pulseShiftAmount) % (2 * pulseWidth);
        }
        gameWorker.postMessage({
            command: 'step',
            boundaryType: gameState.boundaryType,
            pulseWidth,
            pulseOffset
        });
        PerformanceMonitor.endMeasurement('worker-communication');
    } else {
        draw();
    }
}

// Game control functions
function startSimulation() {
    gameState.isRunning = true;
    gameState.lastUpdateTime = millis();
    gameState.frameCount = 0;
    loop();
}

function pauseSimulation() {
    gameState.isRunning = false;
    noLoop();
}

function resetSimulation() {
    gameState.generation = 0;
    activeCells.clear();
    
    // Calculate grid dimensions
    columnCount = GAME_CONFIG.SIMULATION_WIDTH_CELLS;
    rowCount = GAME_CONFIG.SIMULATION_HEIGHT_CELLS;
    
    currentCells = createCellArray(columnCount * rowCount);
    pulseArray = createCellArray(columnCount * boundaryRows);
    boundaryGraphics = createGraphics(simWidth, boundaryRows * cellSize);
    
    // OPTIMIZATION: Use index-based active cells
    initializeRandomPattern(currentCells, columnCount, rowCount, boundaryRows, activeCells);
    initializePulsePattern(pulseArray, columnCount, boundaryRows, pulseWidth);
    drawBoundary();

    if (gameWorker) {
        gameWorker.postMessage({
            command: 'init',
            cells: currentCells,
            activeCells: Array.from(activeCells),
            columnCount,
            rowCount,
            boundaryRows,
            boundaryType: gameState.boundaryType,
            pulseWidth,
            pulseOffset
        }, [currentCells.buffer]);
        currentCells = createCellArray(columnCount * rowCount);
    }
    
    document.getElementById('generationCount').textContent = '0';
    document.getElementById('liveCells').textContent = activeCells.size;
    if (!gameState.isRunning) {
        draw();
    }
}

function resizeSimulation(newWidthCells, newHeightCells) {
    console.log("Resizing simulation to:", newWidthCells, "x", newHeightCells, "cells");
    
    // Update the configuration
    GAME_CONFIG.SIMULATION_WIDTH_CELLS = newWidthCells;
    GAME_CONFIG.SIMULATION_HEIGHT_CELLS = newHeightCells;
    
    // Recalculate pixel dimensions
    simWidth = GAME_CONFIG.SIMULATION_WIDTH_CELLS * GAME_CONFIG.CELL_SIZE;
    simHeight = GAME_CONFIG.SIMULATION_HEIGHT_CELLS * GAME_CONFIG.CELL_SIZE;
    
    // Update grid dimensions
    columnCount = GAME_CONFIG.SIMULATION_WIDTH_CELLS;
    rowCount = GAME_CONFIG.SIMULATION_HEIGHT_CELLS;
    
    console.log("New dimensions - cellSize:", cellSize, "columns:", columnCount, "rows:", rowCount);
    console.log("Canvas will be created as:", simWidth, "width x", simHeight, "height pixels");
    
    // Remove the old canvas and create a new one with the correct size
    const canvasContainer = document.getElementById('canvas-container');
    const oldCanvas = canvasContainer.querySelector('canvas');
    if (oldCanvas) {
        console.log("Removing old canvas");
        oldCanvas.remove();
    }
    
    // Create new canvas with the specified dimensions
    let canvas = createCanvas(simWidth, simHeight);
    canvas.parent('canvas-container');
    
    // Set the canvas style dimensions to ensure it displays correctly
    canvas.style.width = simWidth + 'px';
    canvas.style.height = simHeight + 'px';
    
    console.log("Created new canvas with dimensions:", simWidth, "x", simHeight);
    console.log("Canvas actual size:", canvas.width, "x", canvas.height);
    
    // Recreate arrays with new dimensions
    currentCells = createCellArray(columnCount * rowCount);
    pulseArray = createCellArray(columnCount * boundaryRows);
    
    // Reinitialize the simulation with new dimensions
    initializeRandomPattern(currentCells, columnCount, rowCount, boundaryRows, activeCells);
    initializePulsePattern(pulseArray, columnCount, boundaryRows, pulseWidth);
    drawBoundary();

    if (gameWorker) {
        gameWorker.postMessage({
            command: 'init',
            cells: currentCells,
            activeCells: Array.from(activeCells),
            columnCount,
            rowCount,
            boundaryRows,
            boundaryType: gameState.boundaryType,
            pulseWidth,
            pulseOffset
        }, [currentCells.buffer]);
        currentCells = createCellArray(columnCount * rowCount);
    }
    
    // Update UI without full reset
    document.getElementById('generationCount').textContent = '0';
    document.getElementById('liveCells').textContent = activeCells.size;
    
    // Redraw if not running
    if (!gameState.isRunning) {
        draw();
    }
}

function updateBoundaryRows(newRows) {
    boundaryRows = newRows;
    pulseArray = createCellArray(columnCount * boundaryRows);
    boundaryGraphics = createGraphics(simWidth, boundaryRows * cellSize);
    resetSimulation();
}

function updatePulseWidth(newWidth) {
    pulseWidth = newWidth;
    initializePulsePattern(pulseArray, columnCount, boundaryRows, pulseWidth);
    if (!gameState.isRunning) {
        draw();
    }
}

function updatePulseShift(newShift) {
    pulseShiftAmount = newShift;
    if (!gameState.isRunning) {
        draw();
    }
}

function updateBoundaryCondition(newCondition) {
    gameState.boundaryType = validateBoundaryCondition(newCondition);
    document.getElementById('pulseStatus').textContent = gameState.boundaryType.toUpperCase();
    initializePulsePattern(pulseArray, columnCount, boundaryRows, pulseWidth);
    pulseOffset = 0;
    if (!gameState.isRunning) {
        draw();
    }
}

function updateSpeed(newSpeed) {
    gameState.currentSpeed = validateInput(newSpeed, GAME_CONFIG.MIN_SPEED, GAME_CONFIG.MAX_SPEED, GAME_CONFIG.DEFAULT_SPEED);
    frameRate(gameState.currentSpeed);
}

function updateCellSize(newCellSize) {
    console.log("Updating cell size to:", newCellSize, "pixels");
    
    // Update the configuration
    GAME_CONFIG.CELL_SIZE = newCellSize;
    cellSize = newCellSize;
    
    // Recalculate pixel dimensions
    simWidth = GAME_CONFIG.SIMULATION_WIDTH_CELLS * GAME_CONFIG.CELL_SIZE;
    simHeight = GAME_CONFIG.SIMULATION_HEIGHT_CELLS * GAME_CONFIG.CELL_SIZE;
    
    console.log("New pixel dimensions:", simWidth, "x", simHeight);
    console.log("Grid dimensions remain:", columnCount, "x", rowCount, "cells");
    
    // Remove the old canvas and create a new one with the correct size
    const canvasContainer = document.getElementById('canvas-container');
    const oldCanvas = canvasContainer.querySelector('canvas');
    if (oldCanvas) {
        console.log("Removing old canvas");
        oldCanvas.remove();
    }
    
    // Create new canvas with the specified dimensions
    let canvas = createCanvas(simWidth, simHeight);
    canvas.parent('canvas-container');
    
    // Set the canvas style dimensions to ensure it displays correctly
    canvas.style.width = simWidth + 'px';
    canvas.style.height = simHeight + 'px';
    
    console.log("Created new canvas with dimensions:", simWidth, "x", simHeight);
    
    // Redraw the current state with new cell size
    drawBoundary();
    
    // Redraw if not running
    if (!gameState.isRunning) {
        draw();
    }
}

// Export game functions for UI module
window.GameModule = {
    setup,
    draw,
    mousePressed,
    updateGame,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    resizeSimulation,
    updateBoundaryRows,
    updatePulseWidth,
    updatePulseShift,
    updateBoundaryCondition,
    updateSpeed,
    updateCellSize,
    drawBoundary,
    isRunning: () => gameState.isRunning,
    getGeneration: () => gameState.generation,
    getLiveCells: () => activeCells.size,
    getCurrentSpeed: () => gameState.currentSpeed,
    getBoundaryCondition: () => gameState.boundaryType,
    getCellSize: () => GAME_CONFIG.CELL_SIZE,
    getSimulationDimensions: () => ({
        widthCells: GAME_CONFIG.SIMULATION_WIDTH_CELLS,
        heightCells: GAME_CONFIG.SIMULATION_HEIGHT_CELLS,
        widthPixels: simWidth,
        heightPixels: simHeight
    })
}; 