const cells = document.querySelectorAll('.cell');
const resetButton = document.getElementById('reset');
const singlePlayerBtn = document.getElementById('single-player');
const multiPlayerBtn = document.getElementById('multi-player');
const modeSelection = document.getElementById('mode-selection');
const gameBoard = document.getElementById('game');
const turnIndicator = document.getElementById('turn-indicator');
const victoryOverlay = document.getElementById('victory-overlay');
const victoryText = document.getElementById('victory-text');
const cheer2Sound = document.getElementById('cheer2-sound');

let currentPlayer = 'X';
let board = ['', '', '', '', '', '', '', '', ''];
let gameOver = false;
let mode = null; // "single" or "multi"
let fireworksInterval;

const winningCombinations = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
];

// --- Mode Selection ---
singlePlayerBtn.addEventListener('click', () => startGame('single'));
multiPlayerBtn.addEventListener('click', () => startGame('multi'));

function startGame(selectedMode) {
    mode = selectedMode;
    
    // Highlight selected mode
    if (mode === 'single') {
        singlePlayerBtn.style.backgroundColor = '#d0ffd0';
        multiPlayerBtn.style.backgroundColor = '#fff';
    } else {
        multiPlayerBtn.style.backgroundColor = '#d0ffd0';
        singlePlayerBtn.style.backgroundColor = '#fff';
    }

    // Disable both buttons
    singlePlayerBtn.disabled = true;
    multiPlayerBtn.disabled = true;

    modeSelection.style.display = 'flex'; // Keep visible but buttons disabled
    gameBoard.style.display = 'grid';
    resetButton.style.display = 'block';
    turnIndicator.style.display = 'block';
    updateTurnIndicator();
}

// Update the turn indicator with icons
function updateTurnIndicator() {
    if (!gameOver) {
        if (currentPlayer === 'X') {
            turnIndicator.innerHTML = `<img src="logos/horse.png" alt="Horse" style="width: 40px; height: 40px; vertical-align: middle; margin-right: 10px;">'s Turn`;
            turnIndicator.style.color = '#5c3005';
        } else {
            turnIndicator.innerHTML = `<img src="logos/rose.png" alt="Rose" style="width: 40px; height: 40px; vertical-align: middle; margin-right: 10px;">'s Turn`;
            turnIndicator.style.color = '#8b0000';
        }
    } else {
        turnIndicator.innerHTML = '';
    }
}

// --- Game Logic ---
function checkWinner() {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return board.includes('') ? null : 'Draw';
}

function handleClick(e) {
    const index = e.target.dataset.index;
    if (board[index] || gameOver) return;

    makeMove(index, currentPlayer);

    const result = checkWinner();
    if (result) {
        endGame(result);
        return;
    }

    if (mode === 'single' && currentPlayer === 'X') {
        // Switch to computer's turn immediately
        currentPlayer = 'O';
        updateTurnIndicator();
        setTimeout(computerMove, 500);
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateTurnIndicator();
    }
}

function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.innerHTML = ''; // clear before placing new

    if (player === 'X') {
        cell.innerHTML = `<img src="logos/horse.png" alt="Horse">`;
    } else {
        cell.innerHTML = `<img src="logos/rose.png" alt="Rose">`;
    }
}

function computerMove() {
    if (gameOver) return;

    const bestMove = findBestMove();
    makeMove(bestMove, 'O');

    const result = checkWinner();
    if (result) {
        endGame(result);
        return;
    }

    currentPlayer = 'X';
    updateTurnIndicator();
}

function endGame(result) {
    gameOver = true;
    
    if (result === 'Draw') {
        setTimeout(() => alert("It's a draw!"), 100);
    } else {
        // Show victory overlay
        showVictoryOverlay(result);

        // Play cheering sound
        cheer2Sound.currentTime = 0; // restart if already played
        cheer2Sound.play();

        // Fireworks continuously
        startFireworks();
    }
}

// Show overlay with winner name
function showVictoryOverlay(winner) {
    if (winner === 'X') {
        victoryText.innerHTML = `Congratulations <img src="logos/horse.png" alt="Horse" style="width: 60px; height: 60px; vertical-align: middle; margin: 0 10px;">!`;
    } else {
        victoryText.innerHTML = `Congratulations <img src="logos/rose.png" alt="Rose" style="width: 60px; height: 60px; vertical-align: middle; margin: 0 10px;">!`;
    }
    victoryOverlay.style.display = 'flex';
    
    // Add click event listener to return to main menu
    victoryOverlay.addEventListener('click', returnToMainMenu);
}

// Hide overlay (used in reset)
function hideVictoryOverlay() {
    victoryOverlay.style.display = 'none';
}

// Return to main menu when clicking on victory overlay
function returnToMainMenu() {
    // Stop fireworks and sound
    stopFireworks();
    cheer2Sound.pause();
    
    // Remove the click event listener to prevent multiple calls
    victoryOverlay.removeEventListener('click', returnToMainMenu);
    
    // Reset the game to main menu
    resetGame();
}

// Fireworks control
function startFireworks() {
    const centerX = 0.5; // horizontal center
    const centerY = 0.4; // slightly above center for better visual

    fireworksInterval = setInterval(() => {
        // Randomize around the text for dynamic effect
        const randomX = centerX + (Math.random() - 0.5) * 0.2; // ±0.1 around center
        const randomY = centerY + (Math.random() - 0.5) * 0.2; // ±0.1 around center

        confetti({
            particleCount: 10,
            spread: 120,
            origin: { x: randomX, y: randomY },
            colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
            gravity: 0.6,
            scalar: 1.2
        });
    }, 200);
}

function stopFireworks() {
    clearInterval(fireworksInterval);
}

function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    gameOver = false;
    currentPlayer = 'X';
    cells.forEach(cell => cell.textContent = '');
    
    // Reset mode selection UI
    singlePlayerBtn.disabled = false;
    multiPlayerBtn.disabled = false;
    singlePlayerBtn.style.backgroundColor = '#fff';
    multiPlayerBtn.style.backgroundColor = '#fff';
    
    modeSelection.style.display = 'flex';
    gameBoard.style.display = 'none';
    resetButton.style.display = 'none';
    turnIndicator.style.display = 'none';

    hideVictoryOverlay();
}

// --- Minimax AI functions (unchanged) ---
function evaluate(b) {
    for (let [a,b1,c] of winningCombinations) {
        if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
            return b[a] === 'O' ? 10 : -10;
        }
    }
    return 0;
}

function minimax(b, depth, isMaximizing) {
    const score = evaluate(b);

    if (score === 10) return score - depth;
    if (score === -10) return score + depth;
    if (!b.includes('')) return 0;

    if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] === '') {
                b[i] = 'O';
                best = Math.max(best, minimax(b, depth + 1, false));
                b[i] = '';
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] === '') {
                b[i] = 'X';
                best = Math.min(best, minimax(b, depth + 1, true));
                b[i] = '';
            }
        }
        return best;
    }
}

function findBestMove() {
    let bestVal = -Infinity;
    let move = -1;

    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            let moveVal = minimax(board, 0, false);
            board[i] = '';
            if (moveVal > bestVal) {
                move = i;
                bestVal = moveVal;
            }
        }
    }

    return move;
}

// --- Event Listeners ---
cells.forEach(cell => cell.addEventListener('click', handleClick));
resetButton.addEventListener('click', resetGame);
