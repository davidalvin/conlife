self.onmessage = function(e) {
    const { currentCells, activeCells, columnCount, rowCount, boundaryRows, boundaryType, pulseWidth } = e.data;

    const neighborOffsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    function countNeighbors(column, row) {
        let count = 0;
        for (let [dx, dy] of neighborOffsets) {
            let newCol = column + dx;
            let newRow = row + dy;
            
            if (newRow < 0) {
                continue;
            } else if (newRow < boundaryRows && boundaryType !== 'nothing') {
                if (newCol >= 0 && newCol < columnCount) {
                    if (boundaryType === 'pulse') {
                        count += Math.floor(newCol / pulseWidth) % 2 === 0 ? 1 : 0;
                    } else if (boundaryType === 'solid') {
                        count += 1;
                    }
                }
            } else if (newCol >= 0 && newCol < columnCount && newRow >= 0 && newRow < rowCount) {
                count += currentCells[newCol + newRow * columnCount];
            }
        }
        return count;
    }

    let newActiveCells = [];
    let cellsToCheck = new Set(activeCells);
    
    for (let cell of activeCells) {
        let [col, row] = cell.split(',').map(Number);
        for (let [dx, dy] of neighborOffsets) {
            let newCol = col + dx;
            let newRow = row + dy;
            if (newCol >= 0 && newCol < columnCount && newRow >= boundaryRows && newRow < rowCount) {
                cellsToCheck.add(`${newCol},${newRow}`);
            }
        }
    }

    let newCells = new Uint8Array(columnCount * rowCount);
    let liveCellCount = 0;

    for (let cell of cellsToCheck) {
        let [col, row] = cell.split(',').map(Number);
        if (row < boundaryRows) continue;
        
        let index = col + row * columnCount;
        let neighbors = countNeighbors(col, row);
        let currentState = currentCells[index];
        let nextState = currentState;
        
        if (currentState === 1 && (neighbors < 2 || neighbors > 3)) {
            nextState = 0;
        } else if (currentState === 0 && neighbors === 3) {
            nextState = 1;
        }
        
        newCells[index] = nextState;
        if (nextState === 1) {
            newActiveCells.push(`${col},${row}`);
            liveCellCount++;
        }
    }

    self.postMessage({ newCells, newActiveCells, liveCellCount });
}; 