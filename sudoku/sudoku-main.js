/**
 * Module A: Data Loader
 * Reads flattened Sudoku puzzle data from a string and converts it into a 9x9 grid array.
 * This function implements the logic required by the specification for loading puzzle data.
 *
 * @param {string} puzzleData - The flattened string of 81 digits from src/puzzle.txt.
 * @returns {number[][]} A 9x9 array representing the SudokuGrid state.
 */
function loadPuzzleData(puzzleData) {
    if (!puzzleData || typeof puzzleData !== 'string') {
        console.error('Invalid or missing puzzle data provided.');
        return [];
    }

    const data = String(puzzleData).trim();

    if (data.length !== 81) {
        console.error(`Data length mismatch. Expected 81 characters, but received ${data.length}.`);
        return [];
    }

    const grid = [];
    for (let i = 0; i < 9; i++) {
        grid[i] = [];
    }

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const index = i * 9 + j;
            grid[i][j] = parseInt(data[index], 10);
        }
    }

    return grid;
}

let sudokuGrid = [];
let activeInputCell = null;
let timerStarted = false;
let timerElapsedMs = 0;
let timerIntervalId = null;
let timerDisplay = null;

function isValidCellValue(value) {
    const numericValue = Number.parseInt(value, 10);
    return Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 9;
}

function normalizeCellValue(value) {
    if (value === '' || value === null || value === undefined) {
        return 0;
    }

    return isValidCellValue(value) ? Number.parseInt(value, 10) : 0;
}

function hasRuleViolation(rowIndex, colIndex, value) {
    const numericValue = normalizeCellValue(value);
    if (numericValue === 0) {
        return false;
    }

    for (let currentCol = 0; currentCol < 9; currentCol += 1) {
        if (currentCol !== colIndex && sudokuGrid[rowIndex][currentCol] === numericValue) {
            return true;
        }
    }

    for (let currentRow = 0; currentRow < 9; currentRow += 1) {
        if (currentRow !== rowIndex && sudokuGrid[currentRow][colIndex] === numericValue) {
            return true;
        }
    }

    const boxRowStart = Math.floor(rowIndex / 3) * 3;
    const boxColStart = Math.floor(colIndex / 3) * 3;

    for (let currentRow = boxRowStart; currentRow < boxRowStart + 3; currentRow += 1) {
        for (let currentCol = boxColStart; currentCol < boxColStart + 3; currentCol += 1) {
            if ((currentRow !== rowIndex || currentCol !== colIndex) && sudokuGrid[currentRow][currentCol] === numericValue) {
                return true;
            }
        }
    }

    return false;
}

function updateGridCellValue(rowIndex, colIndex, value) {
    if (!Array.isArray(sudokuGrid[rowIndex])) {
        return;
    }

    sudokuGrid[rowIndex][colIndex] = value;
}

function formatTimerValue(totalMilliseconds) {
    const totalSeconds = Math.min(Math.floor(totalMilliseconds / 1000), 99959);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hundredths = Math.floor((totalMilliseconds % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    if (!timerDisplay) {
        return;
    }

    timerDisplay.textContent = `Time: ${formatTimerValue(timerElapsedMs)}`;
}

function startTimer() {
    if (timerStarted) {
        return;
    }

    timerStarted = true;
    const startTime = Date.now() - timerElapsedMs;
    timerIntervalId = window.setInterval(() => {
        timerElapsedMs = Date.now() - startTime;
        if (timerElapsedMs >= 99959000) {
            timerElapsedMs = 99959000;
            stopTimer();
        }
        updateTimerDisplay();
    }, 10);
}

function stopTimer() {
    if (timerIntervalId !== null) {
        window.clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
}

function resetTimer() {
    stopTimer();
    timerStarted = false;
    timerElapsedMs = 0;
    updateTimerDisplay();
}

function isPuzzleComplete() {
    return sudokuGrid.every((row) => row.every((value) => value > 0));
}

function handleTimerState(value) {
    if (value === '' || value === null || value === undefined) {
        return;
    }

    if (!timerStarted) {
        startTimer();
    }

    if (isPuzzleComplete()) {
        stopTimer();
    }
}

function validateInputCell(rowIndex, colIndex, value) {
    const normalizedValue = normalizeCellValue(value);
    updateGridCellValue(rowIndex, colIndex, normalizedValue);

    const hasViolation = hasRuleViolation(rowIndex, colIndex, normalizedValue);
    const cell = document.querySelector(`[data-row="${rowIndex}"][data-col="${colIndex}"]`);

    if (cell) {
        cell.dataset.ruleViolation = hasViolation ? 'true' : 'false';
    }

    handleTimerState(value);
}

function createCellElement(value, rowIndex, colIndex) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = String(rowIndex);
    cell.dataset.col = String(colIndex);

    if (value > 0) {
        cell.classList.add('pre-filled');
        cell.textContent = value;
        return cell;
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = 1;
    input.setAttribute('aria-label', `Row ${rowIndex + 1}, Column ${colIndex + 1}`);

    input.addEventListener('focus', () => {
        activeInputCell = { row: rowIndex, col: colIndex };
    });

    input.addEventListener('input', (event) => {
        const nextValue = event.target.value.replace(/[^1-9]/g, '').slice(0, 1);
        event.target.value = nextValue;
        validateInputCell(rowIndex, colIndex, nextValue);
    });

    input.addEventListener('blur', () => {
        validateInputCell(rowIndex, colIndex, input.value);
        if (activeInputCell && activeInputCell.row === rowIndex && activeInputCell.col === colIndex) {
            activeInputCell = null;
        }
    });

    cell.appendChild(input);
    return cell;
}

function renderGrid(grid, container) {
    if (!container || !Array.isArray(grid)) {
        return;
    }

    sudokuGrid = grid.map((row) => row.slice());
    container.innerHTML = '';

    grid.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
            container.appendChild(createCellElement(value, rowIndex, colIndex));
        });
    });

    resetTimer();
    updateTimerDisplay();
}

function handleDocumentClick(event) {
    const target = event.target;
    if (target && target.closest && target.closest('input')) {
        return;
    }

    if (!activeInputCell) {
        return;
    }

    const cell = document.querySelector(`[data-row="${activeInputCell.row}"][data-col="${activeInputCell.col}"] input`);
    if (cell) {
        validateInputCell(activeInputCell.row, activeInputCell.col, cell.value);
    }

    activeInputCell = null;
}

function getIstDateParts() {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utcTime + (5.5 * 60 * 60000));

    return {
        year: istTime.getUTCFullYear(),
        month: String(istTime.getUTCMonth() + 1).padStart(2, '0'),
        day: String(istTime.getUTCDate()).padStart(2, '0')
    };
}

function getPuzzleFileCandidates() {
    const { year, month, day } = getIstDateParts();
    const dateStamp = `${year}${month}${day}`;

    return [
        `data/${dateStamp}Q.txt`,
        `data/${dateStamp}.txt`,
        'data/puzzle.txt'
    ];
}

async function loadPuzzleFromToday() {
    const candidates = getPuzzleFileCandidates();

    for (const filePath of candidates) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                continue;
            }

            return await response.text();
        } catch (error) {
            continue;
        }
    }

    throw new Error('Unable to load puzzle data from available sources.');
}

function updatePageHeading() {
    const heading = document.querySelector('h1');
    if (!heading) {
        return;
    }

    const { year, month, day } = getIstDateParts();
    heading.textContent = `Daily Sudoku: ${year}-${month}-${day}`;
}

function initializeTimerDisplay() {
    if (timerDisplay) {
        return;
    }

    timerDisplay = document.createElement('div');
    timerDisplay.id = 'timer-display';
    timerDisplay.className = 'timer-display';
    timerDisplay.textContent = 'Time: 00:00.00';

    const container = document.getElementById('sudoku-grid');
    if (container && container.parentNode) {
        container.parentNode.insertBefore(timerDisplay, container.nextSibling);
    }
}

async function initializePuzzle() {
    const container = document.getElementById('sudoku-grid');
    if (!container) {
        return;
    }

    updatePageHeading();
    initializeTimerDisplay();

    try {
        const puzzleData = await loadPuzzleFromToday();
        const grid = loadPuzzleData(puzzleData);
        renderGrid(grid, container);
    } catch (error) {
        console.error('Failed to initialize Sudoku puzzle:', error);
        container.textContent = 'Unable to load puzzle.';
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('click', handleDocumentClick);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePuzzle);
    } else {
        initializePuzzle();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadPuzzleData,
        createCellElement,
        renderGrid,
        initializePuzzle,
        getIstDateParts,
        getPuzzleFileCandidates,
        loadPuzzleFromToday,
        updatePageHeading,
        initializeTimerDisplay
    };
}