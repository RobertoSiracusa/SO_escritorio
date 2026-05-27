const MinesweeperApp = {
  open() {
    const win = wm.createWindow('minesweeper', 'Buscaminas', '💣', { width: 450, height: 500 });
    const ROWS = 10;
    const COLS = 10;
    const MINES = 15;
    let board = [];
    let revealed = [];
    let flagged = [];
    let gameOver = false;
    let minesLeft = MINES;
    let timer = 0;
    let timerInterval = null;
    let firstClick = true;

    const init = () => {
      board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
      revealed = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));
      flagged = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));
      gameOver = false;
      minesLeft = MINES;
      timer = 0;
      firstClick = true;
      clearInterval(timerInterval);
      render();
    };

    const placeMines = (safeR, safeC) => {
      let placed = 0;
      while (placed < MINES) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);
        if (board[r][c] !== -1 && !(Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1)) {
          board[r][c] = -1;
          placed++;
        }
      }
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (board[r][c] === -1) continue;
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === -1) count++;
            }
          }
          board[r][c] = count;
        }
      }
    };

    const reveal = (r, c) => {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
      if (revealed[r][c] || flagged[r][c]) return;
      revealed[r][c] = true;
      if (board[r][c] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            reveal(r + dr, c + dc);
          }
        }
      }
    };

    const checkWin = () => {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (board[r][c] !== -1 && !revealed[r][c]) return false;
        }
      }
      return true;
    };

    const render = () => {
      win.body.innerHTML = `
        <div class="minesweeper-app">
          <div class="ms-header">
            <div class="ms-counter">${String(minesLeft).padStart(3, '0')}</div>
            <button class="ms-reset-btn">${gameOver ? '😵' : '😊'}</button>
            <div class="ms-counter">${String(timer).padStart(3, '0')}</div>
          </div>
          <div class="ms-board">
            <div class="ms-grid" style="grid-template-columns: repeat(${COLS}, 30px); grid-template-rows: repeat(${ROWS}, 30px);"></div>
          </div>
        </div>
      `;

      const grid = win.body.querySelector('.ms-grid');

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = document.createElement('button');
          cell.className = 'ms-cell';

          if (revealed[r][c]) {
            cell.classList.add('revealed');
            if (board[r][c] === -1) {
              cell.classList.add('mine');
              cell.textContent = '💣';
            } else if (board[r][c] > 0) {
              cell.textContent = board[r][c];
              cell.dataset.count = board[r][c];
            }
          } else if (flagged[r][c]) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
          }

          if (!gameOver) {
            cell.addEventListener('click', () => {
              if (flagged[r][c]) return;
              if (firstClick) {
                firstClick = false;
                placeMines(r, c);
                timerInterval = setInterval(() => { timer++; render(); }, 1000);
              }
              if (board[r][c] === -1) {
                gameOver = true;
                clearInterval(timerInterval);
                for (let rr = 0; rr < ROWS; rr++) {
                  for (let cc = 0; cc < COLS; cc++) {
                    if (board[rr][cc] === -1) revealed[rr][cc] = true;
                  }
                }
                render();
                return;
              }
              reveal(r, c);
              if (checkWin()) {
                gameOver = true;
                clearInterval(timerInterval);
              }
              render();
            });

            cell.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              if (revealed[r][c]) return;
              flagged[r][c] = !flagged[r][c];
              minesLeft += flagged[r][c] ? -1 : 1;
              render();
            });
          }

          grid.appendChild(cell);
        }
      }

      win.body.querySelector('.ms-reset-btn').addEventListener('click', init);
    };

    win.onClose = () => clearInterval(timerInterval);
    init();
  }
};
