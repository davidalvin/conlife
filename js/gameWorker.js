self.onmessage = function(e) {
    const { currentCells, activeCells, columnCount, rowCount, boundaryRows, boundaryType, pulseWidth } = e.data;

    // OPTIMIZATION: Pre-compute neighbor offsets for better cache locality
    const neighborOffsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    // OPTIMIZATION: Helper function to convert index to coordinates
    function getCellCoords(index) {
        const row = Math.floor(index / columnCount);
        const col = index % columnCount;
        return [col, row];
    }

    // OPTIMIZATION: Helper function to convert coordinates to index
    function getCellIndex(col, row) {
        return col + row * columnCount;
    }

    // OPTIMIZATION: Inline neighbor counting with early exit for better performance
    function countNeighbors(column, row) {
        let count = 0;
        
        // OPTIMIZATION: Unroll the loop for better performance
        // Check each neighbor position directly
        const positions = [
            [column - 1, row - 1], [column - 1, row], [column - 1, row + 1],
            [column, row - 1],                         [column, row + 1],
            [column + 1, row - 1], [column + 1, row], [column + 1, row + 1]
        ];
        
        for (let [newCol, newRow] of positions) {
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

    // OPTIMIZATION: Use Set<number> instead of Set<string>
    let newActiveCells = [];
    let cellsToCheck = new Set(activeCells);
    
    // OPTIMIZATION: Convert string-based active cells to index-based
    for (let cellIndex of activeCells) {
        let [col, row] = getCellCoords(cellIndex);
        for (let [dx, dy] of neighborOffsets) {
            let newCol = col + dx;
            let newRow = row + dy;
            if (newCol >= 0 && newCol < columnCount && newRow >= boundaryRows && newRow < rowCount) {
                cellsToCheck.add(getCellIndex(newCol, newRow));
            }
        }
    }

    let newCells = new Uint8Array(columnCount * rowCount);
    let liveCellCount = 0;

    for (let cellIndex of cellsToCheck) {
        let [col, row] = getCellCoords(cellIndex);
        if (row < boundaryRows) continue;
        
        let index = cellIndex; // Already the correct index
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
            newActiveCells.push(index);
            liveCellCount++;
        }
    }

    // OPTIMIZATION: Transfer ownership of the buffer to avoid copying
    self.postMessage({ newCells, newActiveCells, liveCellCount }, [newCells.buffer]);
}; 