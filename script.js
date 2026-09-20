const cells = Array.from(document.querySelectorAll('.cell'));
const setupPanel = document.getElementById('setup-panel');
const gamePanel = document.getElementById('game-panel');
const difficultyFieldset = document.getElementById('difficulty-fieldset');
const startGameButton = document.getElementById('start-game');
const restartRoundButton = document.getElementById('restart-round');
const backMenuButton = document.getElementById('back-menu');
const soundToggle = document.getElementById('sound-toggle');
const statusMessage = document.getElementById('status-message');
const gameTitle = document.getElementById('game-title');
const turnBadge = document.getElementById('turn-badge');
const scoreXElement = document.getElementById('score-x');
const scoreOElement = document.getElementById('score-o');
const playerXLabel = document.getElementById('player-x-label');
const playerOLabel = document.getElementById('player-o-label');
const matchLabel = document.getElementById('match-label');
const roundLabel = document.getElementById('round-label');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultCopy = document.getElementById('result-copy');
const resultKicker = document.getElementById('result-kicker');
const resultIcon = document.getElementById('result-icon');
const nextRoundButton = document.getElementById('next-round');
const modalMenuButton = document.getElementById('modal-menu');
const cheerSound = document.getElementById('cheer-sound');

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

const state = {
  mode: 'single',
  difficulty: 'medium',
  matchLength: 1,
  targetWins: 1,
  board: Array(9).fill(''),
  currentPlayer: 'X',
  gameOver: false,
  computerThinking: false,
  scores: { X: 0, O: 0 },
  round: 1,
  soundOn: true
};

function setChoice(group, value) {
  const buttons = Array.from(document.querySelectorAll(`[data-${group}]`));
  buttons.forEach((button) => {
    const selected = button.dataset[group] === String(value);
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

document.querySelectorAll('[data-mode]').forEach((button) => {
  button.addEventListener('click', () => {
    state.mode = button.dataset.mode;
    setChoice('mode', state.mode);
    difficultyFieldset.hidden = state.mode === 'multi';
  });
});

document.querySelectorAll('[data-difficulty]').forEach((button) => {
  button.addEventListener('click', () => {
    state.difficulty = button.dataset.difficulty;
    setChoice('difficulty', state.difficulty);
  });
});

document.querySelectorAll('[data-match]').forEach((button) => {
  button.addEventListener('click', () => {
    state.matchLength = Number(button.dataset.match);
    state.targetWins = Math.ceil(state.matchLength / 2);
    setChoice('match', state.matchLength);
  });
});

function startMatch() {
  state.scores = { X: 0, O: 0 };
  state.round = 1;
  state.targetWins = Math.ceil(state.matchLength / 2);
  playerXLabel.textContent = state.mode === 'single' ? 'You' : 'Player 1';
  playerOLabel.textContent = state.mode === 'single' ? 'Computer' : 'Player 2';
  matchLabel.textContent = state.matchLength === 1 ? 'Single game' : `Best of ${state.matchLength}`;
  setupPanel.hidden = true;
  gamePanel.hidden = false;
  resetRound();
  updateScoreboard();
}

function resetRound() {
  state.board = Array(9).fill('');
  state.currentPlayer = 'X';
  state.gameOver = false;
  state.computerThinking = false;
  resultModal.hidden = true;

  cells.forEach((cell) => {
    cell.innerHTML = '';
    cell.disabled = false;
    cell.classList.remove('winning');
  });

  roundLabel.textContent = `Round ${state.round}`;
  updateTurnDisplay();
  statusMessage.textContent = 'Horse starts the round.';
}

function updateTurnDisplay() {
  const isHorse = state.currentPlayer === 'X';
  const name = isHorse ? 'Horse' : 'Rose';
  const image = isHorse ? 'logos/horse.png' : 'logos/rose.png';

  turnBadge.innerHTML = `<img src="${image}" alt="" aria-hidden="true"><span>${name}</span>`;

  if (state.mode === 'single') {
    gameTitle.textContent = isHorse ? 'Your move' : 'Computer is thinking';
  } else {
    gameTitle.textContent = `${name}'s move`;
  }
}

function makeMove(index, player) {
  if (state.board[index] || state.gameOver) return false;

  state.board[index] = player;
  const image = player === 'X' ? 'logos/horse.png' : 'logos/rose.png';
  const label = player === 'X' ? 'Horse' : 'Rose';

  cells[index].innerHTML = `<img src="${image}" alt="${label}">`;
  cells[index].disabled = true;
  return true;
}

function getResult(board = state.board) {
  for (const combination of winningCombinations) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combination };
    }
  }

  if (board.every(Boolean)) {
    return { winner: 'Draw', combination: [] };
  }

  return null;
}

function handleCellClick(event) {
  const index = Number(event.currentTarget.dataset.index);

  if (
    state.gameOver ||
    state.computerThinking ||
    state.board[index] ||
    (state.mode === 'single' && state.currentPlayer === 'O')
  ) {
    return;
  }

  if (!makeMove(index, state.currentPlayer)) return;

  const result = getResult();
  if (result) {
    finishRound(result);
    return;
  }

  state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
  updateTurnDisplay();

  if (state.mode === 'single' && state.currentPlayer === 'O') {
    state.computerThinking = true;
    cells.forEach((cell) => {
      if (!cell.disabled) cell.disabled = true;
    });

    window.setTimeout(() => {
      computerMove();
    }, 420);
  }
}

function computerMove() {
  if (state.gameOver) return;

  const move = chooseComputerMove();
  if (move >= 0) makeMove(move, 'O');

  const result = getResult();
  state.computerThinking = false;

  if (result) {
    finishRound(result);
    return;
  }

  state.currentPlayer = 'X';
  cells.forEach((cell, index) => {
    if (!state.board[index]) cell.disabled = false;
  });
  updateTurnDisplay();
  statusMessage.textContent = 'Your turn.';
}

function chooseComputerMove() {
  const available = state.board
    .map((value, index) => (value === '' ? index : -1))
    .filter((index) => index >= 0);

  if (!available.length) return -1;

  if (state.difficulty === 'easy') {
    return available[Math.floor(Math.random() * available.length)];
  }

  if (state.difficulty === 'medium') {
    const winningMove = findImmediateMove('O');
    if (winningMove !== -1) return winningMove;

    const blockingMove = findImmediateMove('X');
    if (blockingMove !== -1) return blockingMove;

    if (state.board[4] === '') return 4;

    const corners = [0, 2, 6, 8].filter((index) => state.board[index] === '');
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

    return available[Math.floor(Math.random() * available.length)];
  }

  return findBestMove();
}

function findImmediateMove(player) {
  for (let index = 0; index < state.board.length; index += 1) {
    if (state.board[index] !== '') continue;
    state.board[index] = player;
    const result = getResult();
    state.board[index] = '';

    if (result && result.winner === player) {
      return index;
    }
  }

  return -1;
}

function evaluate(board) {
  const result = getResult(board);
  if (!result || result.winner === 'Draw') return 0;
  return result.winner === 'O' ? 10 : -10;
}

function minimax(board, depth, isMaximizing) {
  const score = evaluate(board);

  if (score === 10) return score - depth;
  if (score === -10) return score + depth;
  if (!board.includes('')) return 0;

  if (isMaximizing) {
    let best = -Infinity;

    for (let index = 0; index < board.length; index += 1) {
      if (board[index] !== '') continue;
      board[index] = 'O';
      best = Math.max(best, minimax(board, depth + 1, false));
      board[index] = '';
    }

    return best;
  }

  let best = Infinity;

  for (let index = 0; index < board.length; index += 1) {
    if (board[index] !== '') continue;
    board[index] = 'X';
    best = Math.min(best, minimax(board, depth + 1, true));
    board[index] = '';
  }

  return best;
}

function findBestMove() {
  let bestValue = -Infinity;
  let bestMove = -1;

  for (let index = 0; index < state.board.length; index += 1) {
    if (state.board[index] !== '') continue;

    state.board[index] = 'O';
    const value = minimax(state.board, 0, false);
    state.board[index] = '';

    if (value > bestValue) {
      bestValue = value;
      bestMove = index;
    }
  }

  return bestMove;
}

function finishRound(result) {
  state.gameOver = true;
  state.computerThinking = false;
  cells.forEach((cell) => {
    cell.disabled = true;
  });

  result.combination.forEach((index) => {
    cells[index].classList.add('winning');
  });

  if (result.winner === 'Draw') {
    statusMessage.textContent = 'Round drawn.';
    openResultModal('Draw');
    return;
  }

  state.scores[result.winner] += 1;
  updateScoreboard();

  const winnerName = result.winner === 'X' ? 'Horse' : 'Rose';
  statusMessage.textContent = `${winnerName} wins the round.`;

  if (state.soundOn) {
    cheerSound.currentTime = 0;
    cheerSound.play().catch(() => {});
  }

  launchCelebration();

  const matchWinner =
    state.scores[result.winner] >= state.targetWins ? result.winner : null;

  openResultModal(result.winner, matchWinner);
}

function openResultModal(roundWinner, matchWinner = null) {
  resultModal.hidden = false;

  if (roundWinner === 'Draw') {
    resultIcon.innerHTML = '<span aria-hidden="true" style="font-size:2.2rem;">=</span>';
    resultKicker.textContent = 'Round complete';
    resultTitle.textContent = 'It is a draw';
    resultCopy.textContent = 'No winner this round. Start another round to keep the match going.';
    nextRoundButton.textContent = 'Play again';
    return;
  }

  const winnerName = roundWinner === 'X' ? 'Horse' : 'Rose';
  const winnerImage = roundWinner === 'X' ? 'logos/horse.png' : 'logos/rose.png';
  resultIcon.innerHTML = `<img src="${winnerImage}" alt="">`;

  if (matchWinner) {
    const label =
      state.mode === 'single' && matchWinner === 'X'
        ? 'You win the match'
        : state.mode === 'single' && matchWinner === 'O'
          ? 'Computer wins the match'
          : `${winnerName} wins the match`;

    resultKicker.textContent = 'Match complete';
    resultTitle.textContent = label;
    resultCopy.textContent = `Final score: ${state.scores.X} - ${state.scores.O}.`;
    nextRoundButton.textContent = 'New match';
    nextRoundButton.dataset.action = 'new-match';
  } else {
    resultKicker.textContent = 'Round complete';
    resultTitle.textContent = `${winnerName} wins`;
    resultCopy.textContent = `Match score: ${state.scores.X} - ${state.scores.O}.`;
    nextRoundButton.textContent = 'Next round';
    nextRoundButton.dataset.action = 'next-round';
  }
}

function updateScoreboard() {
  scoreXElement.textContent = String(state.scores.X);
  scoreOElement.textContent = String(state.scores.O);
}

function launchCelebration() {
  if (typeof confetti !== 'function') return;

  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.65 }
  });
}

function returnToMenu() {
  resultModal.hidden = true;
  gamePanel.hidden = true;
  setupPanel.hidden = false;
  state.gameOver = true;
  cheerSound.pause();
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  soundToggle.textContent = state.soundOn ? 'Sound on' : 'Sound off';
  soundToggle.setAttribute('aria-pressed', String(state.soundOn));
  soundToggle.setAttribute(
    'aria-label',
    state.soundOn ? 'Mute game sounds' : 'Enable game sounds'
  );

  if (!state.soundOn) {
    cheerSound.pause();
  }
}

startGameButton.addEventListener('click', startMatch);
restartRoundButton.addEventListener('click', resetRound);
backMenuButton.addEventListener('click', returnToMenu);
modalMenuButton.addEventListener('click', returnToMenu);
soundToggle.addEventListener('click', toggleSound);

nextRoundButton.addEventListener('click', () => {
  const action = nextRoundButton.dataset.action;

  if (action === 'new-match') {
    state.scores = { X: 0, O: 0 };
    state.round = 1;
    updateScoreboard();
  } else {
    state.round += 1;
  }

  nextRoundButton.dataset.action = 'next-round';
  resetRound();
});

cells.forEach((cell) => {
  cell.addEventListener('click', handleCellClick);
});

difficultyFieldset.hidden = false;
setChoice('mode', state.mode);
setChoice('difficulty', state.difficulty);
setChoice('match', state.matchLength);