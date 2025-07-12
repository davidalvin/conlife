// UI state management
let uiInitialized = false;

// Default configuration
const DEFAULT_CONFIG = {
    currentSpeed: 120,
    pulseRows: 10,
    pulseWidth: 5,
    boundaryCondition: 'pulse',
    pulseShift: 1,
    fpsUpdateInterval: 30
};

// DOM element references
const DOM = {
    startButton: null,
    resetButton: null,
    speedSlider: null,
    speedDisplay: null,
    boundarySelect: null,
    boundaryRowsInput: null,
    pulseWidthInput: null,
    pulseShiftInput: null,
    generationCount: null,
    liveCells: null,
    fps: null,
    pulseStatus: null,
    pulseIndicator: null
};

// Initialize DOM references
function initializeDOMReferences() {
    DOM.startButton = document.getElementById('startButton');
    DOM.resetButton = document.getElementById('resetButton');
    DOM.speedSlider = document.getElementById('speedSlider');
    DOM.speedDisplay = document.getElementById('speedDisplay');
    DOM.boundarySelect = document.getElementById('boundarySelect');
    DOM.boundaryRowsInput = document.getElementById('boundaryRows');
    DOM.pulseWidthInput = document.getElementById('pulseWidth');
    DOM.pulseShiftInput = document.getElementById('pulseShift');
    DOM.generationCount = document.getElementById('generationCount');
    DOM.liveCells = document.getElementById('liveCells');
    DOM.fps = document.getElementById('fps');
    DOM.pulseStatus = document.getElementById('pulseStatus');
    DOM.pulseIndicator = document.getElementById('pulseIndicator');
}

// Event handlers
function setupSpeedSlider() {
    try {
        console.log("Setting up speed slider");
        DOM.speedSlider.addEventListener('input', function() {
            const newSpeed = parseInt(this.value);
            DOM.speedDisplay.textContent = `${newSpeed} FPS`;
            GameModule.updateSpeed(newSpeed);
        });
    } catch (error) {
        handleError(error, "setupSpeedSlider");
    }
}

function setupBoundarySelect() {
    try {
        console.log("Setting up boundary select");
        DOM.boundarySelect.addEventListener('change', function() {
            GameModule.updateBoundaryCondition(this.value);
        });
    } catch (error) {
        handleError(error, "setupBoundarySelect");
    }
}

function setupStartButton() {
    try {
        console.log("Setting up start button");
        DOM.startButton.addEventListener('click', function() {
            console.log("Start/Pause button clicked");
            const isRunning = GameModule.isRunning();
            
            if (isRunning) {
                GameModule.pauseSimulation();
                this.textContent = '🚀 Start Simulation';
            } else {
                GameModule.startSimulation();
                this.textContent = '⏸ Pause';
            }
        });
    } catch (error) {
        handleError(error, "setupStartButton");
    }
}

function setupResetButton() {
    try {
        console.log("Setting up reset button");
        DOM.resetButton.addEventListener('click', function() {
            console.log("Reset button clicked");
            GameModule.resetSimulation();
        });
    } catch (error) {
        handleError(error, "setupResetButton");
    }
}

function setupBoundaryControls() {
    try {
        console.log("Setting up boundary controls");
        
        DOM.boundaryRowsInput.addEventListener('input', function() {
            const newRows = validateInput(this.value, 1, 50, DEFAULT_CONFIG.pulseRows);
            GameModule.updateBoundaryRows(newRows);
        });

        DOM.pulseWidthInput.addEventListener('input', function() {
            const newWidth = validateInput(this.value, 1, 50, DEFAULT_CONFIG.pulseWidth);
            GameModule.updatePulseWidth(newWidth);
        });

        DOM.pulseShiftInput.addEventListener('input', function() {
            const newShift = validateInput(this.value, 0, 50, DEFAULT_CONFIG.pulseShift);
            GameModule.updatePulseShift(newShift);
        });
    } catch (error) {
        handleError(error, "setupBoundaryControls");
    }
}

// Statistics updates
function updateStatistics() {
    try {
        DOM.generationCount.textContent = GameModule.getGeneration();
        DOM.liveCells.textContent = GameModule.getLiveCells();
        DOM.pulseStatus.textContent = GameModule.getBoundaryCondition().toUpperCase();
        updateGridInfo(); // Update grid info along with stats
    } catch (error) {
        handleError(error, "updateStatistics");
    }
}

function updateFPS(fps) {
    try {
        DOM.fps.textContent = fps.toFixed(1);
    } catch (error) {
        handleError(error, "updateFPS");
    }
}

function updateGridInfo() {
    try {
        const dimensions = GameModule.getSimulationDimensions();
        const cellSize = GameModule.getCellSize();
        const gridInfo = document.getElementById('gridInfo');
        if (gridInfo) {
            gridInfo.textContent = `${dimensions.widthCells} x ${dimensions.heightCells} cells (${cellSize}px each)`;
        }
    } catch (error) {
        handleError(error, "updateGridInfo");
    }
}

// UI initialization
function initializeUI() {
    try {
        console.log("Initializing UI");
        
        if (uiInitialized) {
            console.log("UI already initialized");
            return;
        }

        // Initialize DOM references
        initializeDOMReferences();

        // Setup event handlers
        setupSpeedSlider();
        setupBoundarySelect();
        setupStartButton();
        setupResetButton();
        setupBoundaryControls();

        // Set initial values
        DOM.speedSlider.value = DEFAULT_CONFIG.currentSpeed;
        DOM.speedDisplay.textContent = `${DEFAULT_CONFIG.currentSpeed} FPS`;
        DOM.boundaryRowsInput.value = DEFAULT_CONFIG.pulseRows;
        DOM.pulseWidthInput.value = DEFAULT_CONFIG.pulseWidth;
        DOM.pulseShiftInput.value = DEFAULT_CONFIG.pulseShift;
        DOM.boundarySelect.value = DEFAULT_CONFIG.boundaryCondition;

        // Initialize statistics
        updateStatistics();
        updateGridInfo(); // Call the new function here

        uiInitialized = true;
        console.log("UI initialization complete");
    } catch (error) {
        handleError(error, "initializeUI");
    }
}

// Mouse interaction handling
function handleMouseInteraction() {
    // This function is called by the game module's mousePressed function
    // The actual mouse handling is done in the game module for better integration
    updateStatistics();
}

// Export UI functions
window.UIModule = {
    initializeUI,
    updateStatistics,
    updateFPS,
    handleMouseInteraction,
    DOM
};

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing UI");
    initializeUI();
    if (window.ChartModule) {
        ChartModule.initializeChart();
    }
});