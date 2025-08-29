const cells = document.querySelectorAll('.cell');
const resetButton = document.getElementById('reset');
let currentPlayer = 'X';
let board = ['', '', '', '', '', '', '', '', ''];
let gameOver = false;

const winningCombinations = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
];

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
    if (board[index] || gameOver || currentPlayer !== 'X') return;

    makeMove(index, 'X');

    const result = checkWinner();
    if (result) {
        endGame(result);
    } else {
        // Let the computer play after a short delay
        setTimeout(computerMove, 500);
    }
}

function makeMove(index, player) {
    board[index] = player;
    cells[index].textContent = player;
}

function computerMove() {
    if (gameOver) return;

    // --- Simple AI: choose best move using minimax ---
    const bestMove = findBestMove();
    makeMove(bestMove, 'O');

    const result = checkWinner();
    if (result) {
        endGame(result);
    }

    currentPlayer = 'X'; // back to human
}

function endGame(result) {
    gameOver = true;
    setTimeout(() => alert(result === 'Draw' ? "It's a draw!" : `${result} wins!`), 100);
}

function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    gameOver = false;
    currentPlayer = 'X';
    cells.forEach(cell => cell.textContent = '');
}

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

    if (score === 10) return score - depth;  // prefer faster wins
    if (score === -10) return score + depth; // prefer slower losses
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

cells.forEach(cell => cell.addEventListener('click', handleClick));
resetButton.addEventListener('click', resetGame);
