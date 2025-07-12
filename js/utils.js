// Constants and configuration
const NEIGHBOR_OFFSETS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

// Helper functions
function getIndex(column, row, columnCount) {
    return column + row * columnCount;
}

function isValidCell(column, row, columnCount, rowCount) {
    return column >= 0 && column < columnCount && row >= 0 && row < rowCount;
}

function countLiveCells(cells) {
    return cells.reduce((count, cell) => count + cell, 0);
}

function createCellArray(size) {
    return new Uint8Array(size);
}

function initializeRandomPattern(cells, columnCount, rowCount, pulseRows, activeCells) {
    activeCells.clear();
    for (let column = 0; column < columnCount; column++) {
        for (let row = pulseRows; row < rowCount; row++) {
            const index = getIndex(column, row, columnCount);
            cells[index] = Math.random() > 0.8 ? 1 : 0;
            if (cells[index] === 1) {
                // OPTIMIZATION: Use flattened index instead of string
                activeCells.add(index);
            }
        }
    }
}

function initializePulsePattern(pulseArray, columnCount, pulseRows, pulseWidth) {
    for (let column = 0; column < columnCount; column++) {
        for (let row = 0; row < pulseRows; row++) {
            const index = getIndex(column, row, columnCount);
            pulseArray[index] = Math.floor(column / pulseWidth) % 2 === 0 ? 1 : 0;
        }
    }
}

// Performance monitoring utilities
const PerformanceMonitor = {
    frameTimes: [],
    maxSamples: 60,
    
    addFrameTime(time) {
        this.frameTimes.push(time);
        if (this.frameTimes.length > this.maxSamples) {
            this.frameTimes.shift();
        }
    },
    
    getAverageFPS() {
        if (this.frameTimes.length === 0) return 0;
        const avgFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
        return 1000 / avgFrameTime;
    },
    
    reset() {
        this.frameTimes = [];
    },
    
    // OPTIMIZATION: Enhanced performance monitoring
    startTime: 0,
    measurements: [],
    
    startMeasurement(name) {
        this.startTime = performance.now();
    },
    
    endMeasurement(name) {
        const duration = performance.now() - this.startTime;
        this.measurements.push({ name, duration, timestamp: Date.now() });
        
        // Keep only last 100 measurements
        if (this.measurements.length > 100) {
            this.measurements.shift();
        }
        
        return duration;
    },
    
    getAverageTime(name) {
        const relevant = this.measurements.filter(m => m.name === name);
        if (relevant.length === 0) return 0;
        const total = relevant.reduce((sum, m) => sum + m.duration, 0);
        return total / relevant.length;
    },
    
    logPerformance() {
        console.log('Performance Summary:');
        const names = [...new Set(this.measurements.map(m => m.name))];
        names.forEach(name => {
            const avg = this.getAverageTime(name);
            console.log(`${name}: ${avg.toFixed(2)}ms average`);
        });
    }
};

// Error handling utilities
function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
    // Could add user notification here
}

// Validation utilities
function validateInput(value, min, max, defaultValue) {
    const num = parseInt(value);
    if (isNaN(num) || num < min || num > max) {
        return defaultValue;
    }
    return num;
}

function validateBoundaryCondition(condition) {
    const validConditions = ['nothing', 'pulse', 'solid'];
    return validConditions.includes(condition) ? condition : 'pulse';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NEIGHBOR_OFFSETS,
        getIndex,
        isValidCell,
        countLiveCells,
        createCellArray,
        initializeRandomPattern,
        initializePulsePattern,
        PerformanceMonitor,
        handleError,
        validateInput,
        validateBoundaryCondition
    };
} 