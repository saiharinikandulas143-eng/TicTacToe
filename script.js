let board = Array(9).fill(null);
let currentPlayer = "X";
let gameOver = false;

const boardDiv = document.getElementById("board");
const message = document.getElementById("message");
const rematchBtn = document.getElementById("rematchBtn");
const resetBtn = document.getElementById("resetBtn");
const difficultySelect = document.getElementById("difficulty");

// Stats object
let stats = { X: 0, O: 0, draws: 0 };

// Create board UI
boardDiv.innerHTML = "";
for (let i = 0; i < 9; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.index = i;
  cell.addEventListener("click", () => handleClick(i));
  boardDiv.appendChild(cell);
}

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// Helpers
function getMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

function getDifficulty() {
  return difficultySelect.value;
}

// Main click handler
function handleClick(index) {
  if (board[index] || gameOver) return;

  board[index] = currentPlayer;
  updateUI(index, currentPlayer);

  const win = checkWin();
  if (win) return endGame(win);
  if (board.every((c) => c !== null)) return endGame(null); // Draw

  switchTurn();

  // AI move if needed
  if (getMode() === "ai" && currentPlayer === "O") {
    setTimeout(aiMove, 350);
  }
}

function switchTurn() {
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  message.textContent =
    getMode() === "ai" && currentPlayer === "O"
      ? "AI (O) is thinking..."
      : `Player ${currentPlayer}'s turn`;
}

// UI update
function updateUI(index, player) {
  const cell = document.querySelectorAll(".cell")[index];
  cell.textContent = player;
  cell.classList.add("filled");
}

// Win + draw detection
function checkWin() {
  for (let [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }
  return null;
}

function endGame(winningLine) {
  gameOver = true;

  if (winningLine) {
    highlight(winningLine);
    message.textContent = `Player ${currentPlayer} wins!`;
    updateStats(currentPlayer);
  } else {
    message.textContent = "It's a draw!";
    updateStats("draw");
  }
}

// Highlight winning cells
function highlight(line) {
  const cells = document.querySelectorAll(".cell");
  line.forEach((i) => cells[i].classList.add("win"));
}

// ===== AI LOGIC =====

function aiMove() {
  if (gameOver) return;

  const difficulty = getDifficulty();
  let moveIndex;

  if (difficulty === "easy") {
    moveIndex = getRandomMove();
  } else if (difficulty === "medium") {
    moveIndex = getMediumMove();
  } else {
    moveIndex = getBestMoveMinimax();
  }

  // In rare case board is full or something weird:
  if (moveIndex == null) return;

  handleClick(moveIndex);
}

function getEmptyIndices() {
  return board
    .map((val, idx) => (val === null ? idx : null))
    .filter((v) => v !== null);
}

function getRandomMove() {
  const empty = getEmptyIndices();
  if (!empty.length) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

// Medium difficulty: try win -> block -> random
function getMediumMove() {
  const empty = getEmptyIndices();
  if (!empty.length) return null;

  // 1. Try to win as O
  for (let idx of empty) {
    board[idx] = "O";
    if (checkWin()) {
      board[idx] = null;
      return idx;
    }
    board[idx] = null;
  }

  // 2. Block X's winning move
  for (let idx of empty) {
    board[idx] = "X";
    if (checkWin()) {
      board[idx] = null;
      return idx;
    }
    board[idx] = null;
  }

  // 3. Otherwise random
  return getRandomMove();
}

// Hard difficulty: Minimax (unbeatable)
function getBestMoveMinimax() {
  const empty = getEmptyIndices();
  if (!empty.length) return null;

  let bestScore = -Infinity;
  let bestMove = null;

  for (let idx of empty) {
    board[idx] = "O"; // AI
    const score = minimax(false);
    board[idx] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }
  return bestMove;
}

function minimax(isMaximizing) {
  const result = getWinnerForBoard();
  if (result !== null) {
    if (result === "O") return 1;
    if (result === "X") return -1;
    if (result === "draw") return 0;
  }

  const empty = getEmptyIndices();

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let idx of empty) {
      board[idx] = "O";
      const score = minimax(false);
      board[idx] = null;
      bestScore = Math.max(bestScore, score);
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let idx of empty) {
      board[idx] = "X";
      const score = minimax(true);
      board[idx] = null;
      bestScore = Math.min(bestScore, score);
    }
    return bestScore;
  }
}

function getWinnerForBoard() {
  for (let [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every((c) => c !== null)) return "draw";
  return null;
}

// ===== Stats =====
function updateStats(result) {
  if (result === "X") stats.X++;
  else if (result === "O") stats.O++;
  else stats.draws++;

  renderStats();
}

function renderStats() {
  document.getElementById("x-wins").textContent = stats.X;
  document.getElementById("o-wins").textContent = stats.O;
  document.getElementById("draws").textContent = stats.draws;
}

// ===== Rematch & Reset =====
rematchBtn.addEventListener("click", () => {
  resetBoardOnly();
});

resetBtn.addEventListener("click", () => {
  resetBoardOnly();
  stats = { X: 0, O: 0, draws: 0 };
  renderStats();
});

function resetBoardOnly() {
  board = Array(9).fill(null);
  currentPlayer = "X";
  gameOver = false;

  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("win", "filled");
  });

  message.textContent = "Player X's turn";
}

// Update difficulty hint styling when mode changes (optional UX)
document.querySelectorAll('input[name="mode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    if (getMode() === "ai" && currentPlayer === "O") {
      message.textContent = "AI (O) is thinking...";
    } else {
      message.textContent = `Player ${currentPlayer}'s turn`;
    }
  });
});