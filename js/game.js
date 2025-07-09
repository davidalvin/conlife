// Game configuration
const GAME_CONFIG = {
    // Simulation size in Game of Life cells (grid units)
    SIMULATION_WIDTH_CELLS: 1000,   // number of cells across
    SIMULATION_HEIGHT_CELLS: 1000,  // number of cells down
    
    // Cell size in pixels
    CELL_SIZE: 32,
    
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
        SOLID: 'solid'
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
    actualFps: 0
};

// Simulation dimensions
let simWidth = GAME_CONFIG.SIMULATION_WIDTH_CELLS * GAME_CONFIG.CELL_SIZE;
let simHeight = GAME_CONFIG.SIMULATION_HEIGHT_CELLS * GAME_CONFIG.CELL_SIZE;
let cellSize = GAME_CONFIG.CELL_SIZE;
let boundaryRows = GAME_CONFIG.PULSE_ROWS;
let pulseWidth = GAME_CONFIG.PULSE_WIDTH;

let currentCells;
let nextCells;
let pulseArray;
let columnCount;
let rowCount;
let boundaryGraphics;
let gameWorker = null;

let activeCells = new Set();

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
        nextCells = createCellArray(columnCount * rowCount);
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
            // Remove debug logging for better performance
            const { newCells, newActiveCells, liveCellCount } = e.data;
            currentCells.set(newCells);
            activeCells = new Set(newActiveCells);
            gameState.generation++;
            gameState.liveCells = liveCellCount;
            document.getElementById('generationCount').textContent = gameState.generation;
            document.getElementById('liveCells').textContent = liveCellCount;
            renderCurrentState(); // <-- Draw after updating state
        };
        gameWorker.onerror = function(error) {
            console.error("Web Worker error:", error);
        };
    } catch (error) {
        handleError(error, "setupWorker");
    }
}

// Unified cell drawing function
function drawCells(cells, startRow, endRow, cellSize) {
    noStroke();
    fill(0);
    for (let col = 0; col < columnCount; col++) {
        for (let row = startRow; row < endRow; row++) {
            const index = getIndex(col, row, columnCount);
            if (cells[index] === 1) {
                square(col * cellSize, row * cellSize, cellSize);
            }
        }
    }
}

function drawBoundary() {
    try {
        if (gameState.boundaryType !== GAME_CONFIG.BOUNDARY_TYPES.NOTHING) {
            if (gameState.boundaryType === GAME_CONFIG.BOUNDARY_TYPES.PULSE) {
                // Draw pulse pattern directly on main canvas
                noStroke();
                for (let col = 0; col < columnCount; col++) {
                    for (let row = 0; row < boundaryRows; row++) {
                        const index = getIndex(col, row, columnCount);
                        const isPulseOn = Math.floor(col / pulseWidth) % 2 === 0;
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
    background(255);
    
    // Draw the main simulation area using the unified function
    drawCells(currentCells, boundaryRows, rowCount, cellSize);
    
    // Draw the boundary directly on the main canvas
    drawBoundary();
    
    if (gameState.frameCount % 30 === 0) {
        let currentTime = millis();
        let fps = (30 * 1000) / (currentTime - gameState.lastFpsUpdate);
        document.getElementById('fps').textContent = fps.toFixed(1);
        gameState.lastFpsUpdate = currentTime;
        gameState.frameCount = 0;
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
                const index = getIndex(col, row, columnCount);
                currentCells[index] = 1 - currentCells[index];
                if (currentCells[index] === 1) {
                    activeCells.add(`${col},${row}`);
                } else {
                    activeCells.delete(`${col},${row}`);
                }
                document.getElementById('liveCells').textContent = activeCells.size;
                draw();
            }
        }
    } catch (error) {
        handleError(error, "mousePressed");
    }
}

function updateGame() {
    if (gameState.isRunning) {
        // Remove debug logging for better performance
        gameWorker.postMessage({
            currentCells: currentCells,
            activeCells: Array.from(activeCells),
            columnCount,
            rowCount,
            boundaryRows,
            boundaryType: gameState.boundaryType,
            pulseWidth
        });
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
    currentCells.fill(0);
    nextCells.fill(0);
    
    // Calculate grid dimensions
    columnCount = GAME_CONFIG.SIMULATION_WIDTH_CELLS;
    rowCount = GAME_CONFIG.SIMULATION_HEIGHT_CELLS;
    
    currentCells = createCellArray(columnCount * rowCount);
    nextCells = createCellArray(columnCount * rowCount);
    pulseArray = createCellArray(columnCount * boundaryRows);
    boundaryGraphics = createGraphics(simWidth, boundaryRows * cellSize);
    
    initializeRandomPattern(currentCells, columnCount, rowCount, boundaryRows, activeCells);
    initializePulsePattern(pulseArray, columnCount, boundaryRows, pulseWidth);
    drawBoundary();
    
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
    nextCells = createCellArray(columnCount * rowCount);
    pulseArray = createCellArray(columnCount * boundaryRows);
    
    // Reinitialize the simulation with new dimensions
    initializeRandomPattern(currentCells, columnCount, rowCount, boundaryRows, activeCells);
    initializePulsePattern(pulseArray, columnCount, boundaryRows, pulseWidth);
    drawBoundary();
    
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

function updateBoundaryCondition(newCondition) {
    gameState.boundaryType = validateBoundaryCondition(newCondition);
    document.getElementById('pulseStatus').textContent = gameState.boundaryType.toUpperCase();
    initializePulsePattern(pulseArray, columnCount, boundaryRows, pulseWidth);
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