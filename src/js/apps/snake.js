const SnakeApp = {
  open() {
    const win = wm.createWindow('snake', 'Snake', '🐍', { width: 500, height: 480 });
    win.body.innerHTML = `<div class="game-canvas-container"><canvas id="snake-canvas"></canvas></div>`;

    const canvas = win.body.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 440;
    canvas.height = 440;

    const GRID = 20;
    const CELLS = canvas.width / GRID;

    let snake = [{ x: 10, y: 10 }];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let food = { x: 15, y: 10 };
    let score = 0;
    let gameOver = false;
    let running = true;
    let speed = 120;

    const placeFood = () => {
      let valid = false;
      while (!valid) {
        food.x = Math.floor(Math.random() * CELLS);
        food.y = Math.floor(Math.random() * CELLS);
        valid = !snake.some(s => s.x === food.x && s.y === food.y);
      }
    };

    const update = () => {
      if (gameOver) return;
      dir = { ...nextDir };

      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // Wall collision
      if (head.x < 0 || head.x >= CELLS || head.y < 0 || head.y >= CELLS) {
        gameOver = true;
        return;
      }

      // Self collision
      if (snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOver = true;
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score += 10;
        placeFood();
        if (speed > 60) speed -= 2;
      } else {
        snake.pop();
      }
    };

    const draw = () => {
      // Background
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= CELLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID, 0);
        ctx.lineTo(i * GRID, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * GRID);
        ctx.lineTo(canvas.width, i * GRID);
        ctx.stroke();
      }

      // Snake
      snake.forEach((seg, i) => {
        const brightness = 1 - (i / snake.length) * 0.5;
        ctx.fillStyle = `rgb(0, ${Math.floor(200 * brightness)}, 0)`;
        ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
        ctx.strokeStyle = '#0a0';
        ctx.strokeRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
      });

      // Head eyes
      if (snake.length > 0) {
        const h = snake[0];
        ctx.fillStyle = '#fff';
        const ex1 = h.x * GRID + 5 + dir.x * 3;
        const ey1 = h.y * GRID + 5 + dir.y * 3;
        const ex2 = h.x * GRID + 13 + dir.x * 3;
        const ey2 = h.y * GRID + 13 + dir.y * 3;
        ctx.beginPath();
        ctx.arc(ex1, ey1, 2, 0, Math.PI * 2);
        ctx.arc(ex2, ey2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Food
      ctx.fillStyle = '#f00';
      ctx.beginPath();
      ctx.arc(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Score
      ctx.font = '16px monospace';
      ctx.fillStyle = '#555';
      ctx.textAlign = 'left';
      ctx.fillText(`Puntos: ${score}`, 8, 18);

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '32px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '16px sans-serif';
        ctx.fillText(`Puntos: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText('Presiona ESPACIO para reiniciar', canvas.width / 2, canvas.height / 2 + 50);
      }
    };

    let lastUpdate = 0;
    const loop = (timestamp) => {
      if (!running) return;
      if (timestamp - lastUpdate >= speed) {
        update();
        lastUpdate = timestamp;
      }
      draw();
      requestAnimationFrame(loop);
    };

    const reset = () => {
      snake = [{ x: 10, y: 10 }];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      speed = 120;
      gameOver = false;
      placeFood();
    };

    const onKeyDown = (e) => {
      if (e.key === ' ' && gameOver) {
        reset();
        return;
      }
      const dirs = {
        'ArrowUp': { x: 0, y: -1 }, 'ArrowDown': { x: 0, y: 1 },
        'ArrowLeft': { x: -1, y: 0 }, 'ArrowRight': { x: 1, y: 0 },
        'w': { x: 0, y: -1 }, 's': { x: 0, y: 1 },
        'a': { x: -1, y: 0 }, 'd': { x: 1, y: 0 }
      };
      const nd = dirs[e.key];
      if (nd && (nd.x + dir.x !== 0 || nd.y + dir.y !== 0)) {
        nextDir = nd;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    win.onClose = () => {
      running = false;
      document.removeEventListener('keydown', onKeyDown);
    };

    placeFood();
    requestAnimationFrame(loop);
  }
};
