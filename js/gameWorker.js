// Web Worker for Conway's Game of Life with minimal message passing

let currentCells = null;
let columnCount = 0;
let rowCount = 0;
let boundaryRows = 0;
let boundaryType = 'pulse';
let pulseWidth = 5;
let pulseOffset = 0;
let activeCells = new Set();

const neighborOffsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

function getCellCoords(index) {
    const row = Math.floor(index / columnCount);
    const col = index % columnCount;
    return [col, row];
}

function getCellIndex(col, row) {
    return col + row * columnCount;
}

function countNeighbors(column, row) {
    let count = 0;
    for (let [dx, dy] of neighborOffsets) {
        const newCol = column + dx;
        const newRow = row + dy;
        if (newRow < 0) {
            continue;
        } else if (newRow < boundaryRows && boundaryType !== 'nothing') {
            if (newCol >= 0 && newCol < columnCount) {
                if (boundaryType === 'pulse' || boundaryType === 'shift') {
                    count += Math.floor((newCol + pulseOffset) / pulseWidth) % 2 === 0 ? 1 : 0;
                } else if (boundaryType === 'solid') {
                    count += 1;
                }
            }
        } else if (newCol >= 0 && newCol < columnCount && newRow >= 0 && newRow < rowCount) {
            count += currentCells[getCellIndex(newCol, newRow)];
        }
    }
    return count;
}

function step() {
    let newActive = [];
    let cellsToCheck = new Set(activeCells);

    for (let cellIndex of activeCells) {
        const [col, row] = getCellCoords(cellIndex);
        for (let [dx, dy] of neighborOffsets) {
            const newCol = col + dx;
            const newRow = row + dy;
            if (newCol >= 0 && newCol < columnCount && newRow >= boundaryRows && newRow < rowCount) {
                cellsToCheck.add(getCellIndex(newCol, newRow));
            }
        }
    }

    const newCells = new Uint8Array(currentCells.length);
    let liveCount = 0;

    for (let index of cellsToCheck) {
        const [col, row] = getCellCoords(index);
        if (row < boundaryRows) continue;
        const neighbors = countNeighbors(col, row);
        const currentState = currentCells[index];
        let nextState = currentState;

        if (currentState === 1 && (neighbors < 2 || neighbors > 3)) {
            nextState = 0;
        } else if (currentState === 0 && neighbors === 3) {
            nextState = 1;
        }

        newCells[index] = nextState;
        if (nextState === 1) {
            newActive.push(index);
            liveCount++;
        }
    }

    currentCells = newCells;
    activeCells = new Set(newActive);
    return { activeCells: newActive, liveCellCount: liveCount };
}

self.onmessage = function(e) {
    const data = e.data;
    if (data.command === 'init') {
        currentCells = data.cells;
        columnCount = data.columnCount;
        rowCount = data.rowCount;
        boundaryRows = data.boundaryRows;
        boundaryType = data.boundaryType;
        pulseWidth = data.pulseWidth;
        pulseOffset = data.pulseOffset || 0;
        activeCells = new Set(data.activeCells);
        const liveCount = activeCells.size;
        self.postMessage({ activeCells: Array.from(activeCells), liveCellCount: liveCount });
    } else if (data.command === 'step') {
        boundaryType = data.boundaryType;
        pulseWidth = data.pulseWidth;
        pulseOffset = data.pulseOffset || 0;
        const result = step();
        self.postMessage(result);
    } else if (data.command === 'toggle') {
        const index = data.index;
        const newState = currentCells[index] === 1 ? 0 : 1;
        currentCells[index] = newState;
        if (newState === 1) {
            activeCells.add(index);
        } else {
            activeCells.delete(index);
        }
        self.postMessage({ activeCells: Array.from(activeCells), liveCellCount: activeCells.size });
    }
};
