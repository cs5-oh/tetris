// 테트리스 보드 크기 (가로 10칸, 세로 20칸)
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = "1.75rem";
const DROP_INTERVAL_MS = 800;
const LOCK_DELAY_MS = 500;

// 한 번에 삭제한 줄 수에 따른 점수 (테트리스 방식 보너스)
const LINE_SCORE_TABLE = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

// 테트로미노 블록 정의 (1 = 채워진 칸)
const PIECES = {
  I: {
    shape: [
      [1, 1, 1, 1],
    ],
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
  },
};

const PIECE_TYPES = Object.keys(PIECES);

// DOM 요소
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const linesElement = document.getElementById("lines-cleared");
const statusMessageElement = document.getElementById("status-message");
const startButton = document.getElementById("start-btn");
const restartButton = document.getElementById("restart-btn");

// 게임 상태
let score = 0;
let board = createEmptyBoard();
let currentPiece = null;
let gameStarted = false;
let isGameOver = false;
let gameLoopRunning = false;
let animationFrameId = null;
let lastDropTime = 0;
let isGrounded = false;
let lockDelayStart = null;
let totalLinesCleared = 0;

/**
 * 빈 보드 데이터를 만듭니다.
 * 0은 빈 칸, 문자열(I, O, T 등)은 블록 타입을 의미합니다.
 */
function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

/**
 * shape 배열을 시계 방향으로 90도 회전합니다.
 */
function rotateShape(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = [];

  for (let col = 0; col < cols; col++) {
    const newRow = [];
    for (let row = rows - 1; row >= 0; row--) {
      newRow.push(shape[row][col]);
    }
    rotated.push(newRow);
  }

  return rotated;
}

/**
 * 현재 블록을 시계 방향으로 회전합니다. 충돌 시 회전을 취소합니다.
 */
function tryRotatePiece() {
  if (!currentPiece || !gameStarted || isGameOver) {
    return false;
  }

  const rotatedShape = rotateShape(currentPiece.shape);
  const rotatedPiece = {
    type: currentPiece.type,
    shape: rotatedShape,
    row: currentPiece.row,
    col: currentPiece.col,
  };

  if (!canMove(rotatedPiece, 0, 0, board)) {
    return false;
  }

  currentPiece.shape = rotatedShape;

  if (isGrounded) {
    lockDelayStart = performance.now();
  }

  render();
  return true;
}

/**
 * 블록을 가능한 한 아래로 내린 뒤 즉시 고정합니다.
 */
function hardDrop() {
  if (!currentPiece || !gameStarted || isGameOver) {
    return false;
  }

  while (canMove(currentPiece, 0, 1, board)) {
    currentPiece.row += 1;
  }

  render();
  completePieceLock();
  return true;
}

/**
 * 키보드 입력을 처리합니다.
 */
function handleKeyDown(event) {
  if (!gameStarted || isGameOver || !currentPiece) {
    return;
  }

  const controlKeys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Space"];

  if (!controlKeys.includes(event.code)) {
    return;
  }

  event.preventDefault();

  switch (event.code) {
    case "ArrowLeft":
      tryMovePiece(-1, 0);
      break;
    case "ArrowRight":
      tryMovePiece(1, 0);
      break;
    case "ArrowDown":
      if (tryMovePiece(0, 1)) {
        lastDropTime = performance.now();
      } else if (!isGrounded) {
        isGrounded = true;
        lockDelayStart = performance.now();
      }
      break;
    case "ArrowUp":
      tryRotatePiece();
      break;
    case "Space":
      hardDrop();
      break;
    default:
      break;
  }
}

let keyboardControlsInitialized = false;

/**
 * 키보드 이벤트를 한 번만 등록합니다.
 */
function initKeyboardControls() {
  if (keyboardControlsInitialized) {
    return;
  }

  document.addEventListener("keydown", handleKeyDown);
  keyboardControlsInitialized = true;
}

/**
 * shape 배열의 복사본을 만듭니다.
 * 원본 PIECES 데이터가 변경되지 않도록 합니다.
 */
function copyShape(shape) {
  return shape.map((row) => row.slice());
}

/**
 * CSS grid 크기를 JS 상수(COLS, ROWS)와 맞춥니다.
 */
function initBoardLayout() {
  boardElement.style.gridTemplateColumns = `repeat(${COLS}, ${CELL_SIZE})`;
  boardElement.style.gridTemplateRows = `repeat(${ROWS}, ${CELL_SIZE})`;
}

/**
 * 블록 하나를 생성합니다.
 * @param {string} [type] - 블록 종류 (I, O, T, S, Z, J, L). 생략 시 무작위.
 * @returns {{ type: string, shape: number[][], row: number, col: number }}
 */
function createPiece(type) {
  let pieceType = type;

  if (pieceType && !PIECES[pieceType]) {
    console.warn(`알 수 없는 블록 타입 "${pieceType}"입니다. 무작위 블록을 사용합니다.`);
    pieceType = undefined;
  }

  if (!pieceType) {
    pieceType = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  }

  const { shape } = PIECES[pieceType];
  const col = Math.floor((COLS - shape[0].length) / 2);

  return {
    type: pieceType,
    shape: copyShape(shape),
    row: 0,
    col,
  };
}

/**
 * 이동 후 위치에서 블록이 보드 안에 있고, 고정 블록과 겹치지 않는지 확인합니다.
 * @param {{ shape: number[][], row: number, col: number }} piece
 * @param {number} dx - 가로 이동량
 * @param {number} dy - 세로 이동량
 * @param {Array<Array<string|number>>} matrix - 고정된 블록만 담긴 보드
 * @returns {boolean}
 */
function canMove(piece, dx, dy, matrix) {
  if (!piece) {
    return false;
  }

  const { shape, row, col } = piece;
  const nextRow = row + dy;
  const nextCol = col + dx;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) {
        continue;
      }

      const boardRow = nextRow + r;
      const boardCol = nextCol + c;

      if (
        boardRow < 0 ||
        boardRow >= ROWS ||
        boardCol < 0 ||
        boardCol >= COLS
      ) {
        return false;
      }

      if (matrix[boardRow][boardCol] !== 0) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 현재 블록을 보드에 고정합니다.
 */
function lockPiece(piece, matrix) {
  const { shape, row, col, type } = piece;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) {
        continue;
      }

      const boardRow = row + r;
      const boardCol = col + c;

      if (
        boardRow >= 0 &&
        boardRow < ROWS &&
        boardCol >= 0 &&
        boardCol < COLS
      ) {
        matrix[boardRow][boardCol] = type;
      }
    }
  }
}

/**
 * 가득 찬 줄을 삭제하고 위 줄을 내립니다.
 * @returns {number} 삭제된 줄 수
 */
function clearFullLines(matrix) {
  let cleared = 0;

  for (let row = ROWS - 1; row >= 0; row--) {
    const isFull = matrix[row].every((cell) => cell !== 0);

    if (!isFull) {
      continue;
    }

    matrix.splice(row, 1);
    matrix.unshift(Array(COLS).fill(0));
    cleared += 1;
    row += 1;
  }

  return cleared;
}

/**
 * 한 번에 삭제한 줄 수에 따른 점수를 계산합니다.
 */
function calculateLineScore(clearedLines) {
  if (clearedLines <= 0) {
    return 0;
  }

  return LINE_SCORE_TABLE[clearedLines] ?? clearedLines * 100;
}

/**
 * 줄 삭제 점수를 반영하고 삭제한 줄 수를 갱신합니다.
 */
function addScoreForLines(clearedLines) {
  if (clearedLines <= 0) {
    return;
  }

  const points = calculateLineScore(clearedLines);
  totalLinesCleared += clearedLines;
  updateScore(score + points);
  updateLinesCleared(totalLinesCleared);
}

/**
 * 착지 대기 상태를 초기화합니다.
 */
function resetGroundedState() {
  isGrounded = false;
  lockDelayStart = null;
}

/**
 * 현재 블록을 (dx, dy)만큼 이동합니다. 이동이 불가능하면 false를 반환합니다.
 */
function tryMovePiece(dx, dy) {
  if (!currentPiece || !gameStarted || isGameOver) {
    return false;
  }

  if (!canMove(currentPiece, dx, dy, board)) {
    return false;
  }

  currentPiece.row += dy;
  currentPiece.col += dx;

  if (dy > 0) {
    resetGroundedState();
  } else if (isGrounded && dx !== 0) {
    lockDelayStart = performance.now();
  }

  render();
  return true;
}

/**
 * 현재 블록을 보드에 고정합니다.
 */
function lockCurrentPiece() {
  if (!currentPiece) {
    return;
  }

  lockPiece(currentPiece, board);
  currentPiece = null;
  resetGroundedState();
}

/**
 * 게임 오버 상태로 전환합니다.
 */
function triggerGameOver() {
  stopGameLoop();
  gameStarted = false;
  isGameOver = true;
  currentPiece = null;
  boardElement.classList.add("is-game-over");
  render();
  updateStatus("게임 오버! 재시작 버튼을 눌러 다시 시작하세요.");
}

/**
 * 새 블록을 생성합니다. 스폰 위치에 공간이 없으면 게임 오버 처리합니다.
 * @returns {boolean} 새 블록 생성 성공 여부
 */
function spawnNextPiece() {
  currentPiece = createPiece();

  if (!canMove(currentPiece, 0, 0, board)) {
    triggerGameOver();
    return false;
  }

  render();
  return true;
}

/**
 * 착지 후 고정·줄 삭제·새 블록 생성을 처리합니다.
 */
function completePieceLock() {
  lockCurrentPiece();

  const cleared = clearFullLines(board);
  addScoreForLines(cleared);

  if (!spawnNextPiece()) {
    return;
  }

  if (cleared > 0) {
    updateStatus(`${cleared}줄 삭제! +${calculateLineScore(cleared)}점 · 총점: ${score} · 현재 블록: ${currentPiece.type}`);
  } else {
    updateStatus(`블록이 고정되었습니다. 현재 블록: ${currentPiece.type}`);
  }
}

/**
 * 자동 낙하 1틱을 처리합니다.
 */
function processDrop(timestamp) {
  if (!currentPiece) {
    return;
  }

  if (tryMovePiece(0, 1)) {
    return;
  }

  if (!isGrounded) {
    isGrounded = true;
    lockDelayStart = timestamp;
  }
}

/**
 * 착지 대기 시간이 지나면 블록을 고정합니다.
 */
function processLockDelay(timestamp) {
  if (!isGrounded || !currentPiece || lockDelayStart === null) {
    return;
  }

  if (timestamp - lockDelayStart >= LOCK_DELAY_MS) {
    completePieceLock();
  }
}

/**
 * requestAnimationFrame 기반 게임 루프.
 * 경과 시간으로 낙하 간격을 계산해 탭 비활성화 시에도 일정한 속도를 유지합니다.
 */
function gameLoop(timestamp) {
  if (!gameStarted || !gameLoopRunning) {
    animationFrameId = null;
    gameLoopRunning = false;
    return;
  }

  animationFrameId = requestAnimationFrame(gameLoop);

  if (timestamp - lastDropTime >= DROP_INTERVAL_MS) {
    processDrop(timestamp);
    lastDropTime = timestamp;
  }

  processLockDelay(timestamp);
}

/**
 * 게임 루프를 시작합니다. 기존 루프가 있으면 먼저 중지해 중복 실행을 방지합니다.
 */
function startGameLoop() {
  stopGameLoop();
  resetGroundedState();
  lastDropTime = performance.now();
  gameLoopRunning = true;
  animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * 게임 루프(타이머)를 중지합니다.
 */
function stopGameLoop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  gameLoopRunning = false;
  resetGroundedState();
}

/**
 * 보드 데이터 위에 현재 블록을 그립니다.
 * 원본 보드는 변경하지 않고, 복사본에 블록을 반영해 반환합니다.
 */
function drawPiece(boardData, piece) {
  const displayBoard = boardData.map((row) => row.slice());

  if (!piece) {
    return displayBoard;
  }

  const { shape, row, col, type } = piece;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) {
        continue;
      }

      const boardRow = row + r;
      const boardCol = col + c;

      if (
        boardRow >= 0 &&
        boardRow < ROWS &&
        boardCol >= 0 &&
        boardCol < COLS
      ) {
        displayBoard[boardRow][boardCol] = type;
      }
    }
  }

  return displayBoard;
}

/**
 * 보드 데이터를 화면에 그립니다.
 */
function renderBoard(boardData) {
  boardElement.innerHTML = "";

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = row;
      cell.dataset.col = col;

      const value = boardData[row][col];
      if (value) {
        cell.classList.add("filled", `piece-${value.toLowerCase()}`);
      }

      boardElement.appendChild(cell);
    }
  }
}

/**
 * 보드와 현재 블록을 함께 화면에 반영합니다.
 */
function render() {
  const displayBoard = drawPiece(board, currentPiece);
  renderBoard(displayBoard);
}

/**
 * 점수를 화면에 표시합니다.
 */
function updateScore(value) {
  score = value;
  scoreElement.textContent = String(score);
}

/**
 * 삭제한 줄 수를 화면에 표시합니다.
 */
function updateLinesCleared(value) {
  totalLinesCleared = value;
  linesElement.textContent = String(value);
}

/**
 * 상태 메시지를 화면에 표시합니다.
 */
function updateStatus(message) {
  statusMessageElement.textContent = message;
}

/**
 * 보드, 점수, 타이머, 게임 상태를 모두 초기화합니다.
 */
function resetGameState() {
  stopGameLoop();
  board = createEmptyBoard();
  currentPiece = null;
  gameStarted = false;
  isGameOver = false;
  totalLinesCleared = 0;
  lastDropTime = 0;
  resetGroundedState();
  updateScore(0);
  updateLinesCleared(0);
  boardElement.classList.remove("is-game-over");
}

/**
 * 게임을 시작합니다.
 * @returns {boolean} 시작 성공 여부
 */
function beginGame() {
  resetGameState();
  gameStarted = true;
  currentPiece = createPiece();

  if (!canMove(currentPiece, 0, 0, board)) {
    triggerGameOver();
    return false;
  }

  render();
  startGameLoop();
  updateStatus(`게임 시작! 현재 블록: ${currentPiece.type}`);
  return true;
}

/**
 * 시작 버튼 클릭 시 호출됩니다.
 */
function handleStart() {
  if (gameStarted) {
    updateStatus("게임이 이미 진행 중입니다. 재시작 버튼을 눌러 새로 시작하세요.");
    return;
  }

  beginGame();
}

/**
 * 재시작 버튼 클릭 시 호출됩니다.
 */
function handleRestart() {
  resetGameState();
  gameStarted = true;
  currentPiece = createPiece();

  if (!canMove(currentPiece, 0, 0, board)) {
    triggerGameOver();
    return;
  }

  render();
  startGameLoop();
  updateStatus(`새 블록 ${currentPiece.type}으로 다시 시작했습니다.`);
}

// 이벤트 연결
startButton.addEventListener("click", handleStart);
restartButton.addEventListener("click", handleRestart);
initKeyboardControls();

// 페이지 로드 시 빈 보드만 표시
initBoardLayout();
resetGameState();
render();
updateStatus("시작 버튼을 눌러 게임을 준비하세요.");
