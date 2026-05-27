const PongApp = {
  open() {
    const win = wm.createWindow('pong', 'Pong', '🏓', { width: 650, height: 450 });
    win.body.innerHTML = `<div class="game-canvas-container"><canvas id="pong-canvas"></canvas></div>`;

    const canvas = win.body.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;

    const state = {
      ball: { x: 300, y: 200, vx: 4, vy: 3, radius: 8 },
      paddle1: { y: 160, h: 80, w: 10, score: 0 },
      paddle2: { y: 160, h: 80, w: 10, score: 0 },
      keys: {},
      running: true
    };

    const resetBall = () => {
      state.ball.x = 300;
      state.ball.y = 200;
      state.ball.vx = (Math.random() > 0.5 ? 4 : -4);
      state.ball.vy = (Math.random() - 0.5) * 6;
    };

    const update = () => {
      const b = state.ball;
      const p1 = state.paddle1;
      const p2 = state.paddle2;

      // Player controls
      if (state.keys['w'] || state.keys['W']) p1.y = Math.max(0, p1.y - 5);
      if (state.keys['s'] || state.keys['S']) p1.y = Math.min(canvas.height - p1.h, p1.y + 5);
      if (state.keys['ArrowUp']) p2.y = Math.max(0, p2.y - 5);
      if (state.keys['ArrowDown']) p2.y = Math.min(canvas.height - p2.h, p2.y + 5);

      // Ball movement
      b.x += b.vx;
      b.y += b.vy;

      // Top/bottom bounce
      if (b.y - b.radius < 0 || b.y + b.radius > canvas.height) {
        b.vy = -b.vy;
      }

      // Paddle collision
      if (b.x - b.radius < 20 && b.y > p1.y && b.y < p1.y + p1.h) {
        b.vx = Math.abs(b.vx) * 1.05;
        b.vy += (b.y - (p1.y + p1.h / 2)) * 0.1;
      }
      if (b.x + b.radius > canvas.width - 20 && b.y > p2.y && b.y < p2.y + p2.h) {
        b.vx = -Math.abs(b.vx) * 1.05;
        b.vy += (b.y - (p2.y + p2.h / 2)) * 0.1;
      }

      // Score
      if (b.x < 0) { p2.score++; resetBall(); }
      if (b.x > canvas.width) { p1.score++; resetBall(); }

      // Limit speed
      const maxSpeed = 10;
      b.vx = Math.max(-maxSpeed, Math.min(maxSpeed, b.vx));
      b.vy = Math.max(-maxSpeed, Math.min(maxSpeed, b.vy));
    };

    const draw = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center line
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#333';
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Paddles
      ctx.fillStyle = '#fff';
      ctx.fillRect(10, state.paddle1.y, state.paddle1.w, state.paddle1.h);
      ctx.fillRect(canvas.width - 20, state.paddle2.y, state.paddle2.w, state.paddle2.h);

      // Ball
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0f0';
      ctx.fill();

      // Score
      ctx.font = '36px monospace';
      ctx.fillStyle = '#444';
      ctx.textAlign = 'center';
      ctx.fillText(state.paddle1.score, canvas.width / 4, 50);
      ctx.fillText(state.paddle2.score, canvas.width * 3 / 4, 50);

      // Controls hint
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#333';
      ctx.fillText('W/S', 40, canvas.height - 10);
      ctx.fillText('↑/↓', canvas.width - 40, canvas.height - 10);
    };

    const loop = () => {
      if (!state.running) return;
      update();
      draw();
      requestAnimationFrame(loop);
    };

    const onKeyDown = (e) => { state.keys[e.key] = true; };
    const onKeyUp = (e) => { state.keys[e.key] = false; };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    win.onClose = () => {
      state.running = false;
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };

    loop();
  }
};
