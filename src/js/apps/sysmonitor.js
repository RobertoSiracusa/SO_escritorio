const SysMonitorApp = {
  open() {
    const win = wm.createWindow('sysmonitor', 'Monitor del Sistema', '📊', { width: 800, height: 550 });
    let activeTab = 'overview';
    let updateInterval = null;
    const cpuHistory = [];
    const memHistory = [];
    const MAX_HISTORY = 60;

    win.body.innerHTML = `
      <div class="sysmonitor-app">
        <div class="sysmon-tabs">
          <div class="sysmon-tab active" data-tab="overview">General</div>
          <div class="sysmon-tab" data-tab="cpu">CPU</div>
          <div class="sysmon-tab" data-tab="memory">Memoria</div>
          <div class="sysmon-tab" data-tab="gpu">GPU</div>
          <div class="sysmon-tab" data-tab="processes">Procesos</div>
        </div>
        <div class="sysmon-content"></div>
      </div>
    `;

    const content = win.body.querySelector('.sysmon-content');
    const tabs = win.body.querySelectorAll('.sysmon-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab;
        update();
      });
    });

    const drawChart = (canvas, data, color, maxVal = 100) => {
      const ctx = canvas.getContext('2d');
      const w = canvas.width = canvas.offsetWidth * 2;
      const h = canvas.height = canvas.offsetHeight * 2;
      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (data.length < 2) return;

      // Line
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      const step = w / (MAX_HISTORY - 1);
      const startIdx = Math.max(0, MAX_HISTORY - data.length);
      data.forEach((val, i) => {
        const x = (startIdx + i) * step;
        const y = h - (val / maxVal) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Fill
      ctx.lineTo((startIdx + data.length - 1) * step, h);
      ctx.lineTo(startIdx * step, h);
      ctx.closePath();
      ctx.fillStyle = color.replace(')', ',0.15)').replace('rgb', 'rgba');
      ctx.fill();
    };

    const update = async () => {
      try {
        if (activeTab === 'overview') {
          const [info, cpu, mem] = await Promise.all([
            window.electronAPI.getSystemInfo(),
            window.electronAPI.getCpuUsage(),
            window.electronAPI.getMemUsage()
          ]);
          const memPct = ((mem.used / mem.total) * 100).toFixed(1);
          cpuHistory.push(cpu.currentLoad);
          memHistory.push(parseFloat(memPct));
          if (cpuHistory.length > MAX_HISTORY) cpuHistory.shift();
          if (memHistory.length > MAX_HISTORY) memHistory.shift();

          content.innerHTML = `
            <div class="sysmon-stat">
              <div class="sysmon-stat-label">CPU — ${info.cpu.brand}</div>
              <div class="sysmon-stat-value">${cpu.currentLoad.toFixed(1)}%</div>
              <div class="sysmon-bar"><div class="sysmon-bar-fill cpu" style="width:${cpu.currentLoad}%"></div></div>
              <div class="sysmon-chart"><canvas id="cpu-chart"></canvas></div>
            </div>
            <div class="sysmon-stat">
              <div class="sysmon-stat-label">Memoria RAM — ${(mem.total / 1073741824).toFixed(1)} GB Total</div>
              <div class="sysmon-stat-value">${(mem.used / 1073741824).toFixed(1)} GB (${memPct}%)</div>
              <div class="sysmon-bar"><div class="sysmon-bar-fill ram" style="width:${memPct}%"></div></div>
              <div class="sysmon-chart"><canvas id="mem-chart"></canvas></div>
            </div>
            ${info.graphics.controllers[0] ? `
            <div class="sysmon-stat">
              <div class="sysmon-stat-label">GPU — ${info.graphics.controllers[0].model}</div>
              <div class="sysmon-stat-value">${info.graphics.controllers[0].vram || 'N/A'} MB VRAM</div>
              <div class="sysmon-bar"><div class="sysmon-bar-fill gpu" style="width:${info.graphics.controllers[0].utilizationGpu || 0}%"></div></div>
            </div>` : ''}
          `;

          requestAnimationFrame(() => {
            const cpuCanvas = content.querySelector('#cpu-chart');
            const memCanvas = content.querySelector('#mem-chart');
            if (cpuCanvas) drawChart(cpuCanvas, cpuHistory, 'rgb(52,120,246)');
            if (memCanvas) drawChart(memCanvas, memHistory, 'rgb(255,149,0)');
          });

        } else if (activeTab === 'cpu') {
          const [info, cpu] = await Promise.all([
            window.electronAPI.getSystemInfo(),
            window.electronAPI.getCpuUsage()
          ]);
          let coresHTML = '';
          cpu.cpus.forEach((c, i) => {
            coresHTML += `
              <div class="sysmon-stat">
                <div class="sysmon-stat-label">Core ${i}</div>
                <div class="sysmon-stat-value" style="font-size:14px;">${c.load.toFixed(1)}%</div>
                <div class="sysmon-bar"><div class="sysmon-bar-fill cpu" style="width:${c.load}%"></div></div>
              </div>`;
          });
          content.innerHTML = `
            <div class="sysmon-stat">
              <div class="sysmon-stat-label">CPU</div>
              <div class="sysmon-stat-value">${info.cpu.brand}</div>
            </div>
            <div class="sysmon-stat">
              <div class="sysmon-stat-label">Cores: ${info.cpu.cores} (${info.cpu.physicalCores} físicos) — Velocidad: ${info.cpu.speed} GHz</div>
            </div>
            <div class="sysmon-stat">
              <div class="sysmon-stat-label">Uso Total</div>
              <div class="sysmon-stat-value">${cpu.currentLoad.toFixed(1)}%</div>
              <div class="sysmon-bar"><div class="sysmon-bar-fill cpu" style="width:${cpu.currentLoad}%"></div></div>
            </div>
            ${coresHTML}
          `;

        } else if (activeTab === 'memory') {
          const mem = await window.electronAPI.getMemUsage();
          const total = (mem.total / 1073741824).toFixed(2);
          const used = (mem.used / 1073741824).toFixed(2);
          const free = (mem.free / 1073741824).toFixed(2);
          const available = (mem.available / 1073741824).toFixed(2);
          const swapUsed = (mem.swapused / 1073741824).toFixed(2);
          const swapTotal = (mem.swaptotal / 1073741824).toFixed(2);
          const pct = ((mem.used / mem.total) * 100).toFixed(1);
          content.innerHTML = `
            <div class="sysmon-stat">
              <div class="sysmon-stat-label">Memoria Física</div>
              <div class="sysmon-stat-value">${used} GB / ${total} GB (${pct}%)</div>
              <div class="sysmon-bar"><div class="sysmon-bar-fill ram" style="width:${pct}%"></div></div>
            </div>
            <div class="sysmon-stat">
              <div class="sysmon-stat-label">Libre</div>
              <div class="sysmon-stat-value" style="font-size:16px;">${free} GB</div>
            </div>
            <div class="sysmon-stat">
              <div class="sysmon-stat-label">Disponible</div>
              <div class="sysmon-stat-value" style="font-size:16px;">${available} GB</div>
            </div>
            <div class="sysmon-stat">
              <div class="sysmon-stat-label">Swap</div>
              <div class="sysmon-stat-value" style="font-size:16px;">${swapUsed} GB / ${swapTotal} GB</div>
              <div class="sysmon-bar"><div class="sysmon-bar-fill gpu" style="width:${mem.swaptotal > 0 ? (mem.swapused / mem.swaptotal * 100) : 0}%"></div></div>
            </div>
          `;

        } else if (activeTab === 'gpu') {
          const info = await window.electronAPI.getSystemInfo();
          let gpuHTML = '';
          info.graphics.controllers.forEach((gpu, i) => {
            gpuHTML += `
              <div class="sysmon-stat">
                <div class="sysmon-stat-label">GPU ${i}</div>
                <div class="sysmon-stat-value">${gpu.model}</div>
              </div>
              <div class="sysmon-stat">
                <div class="sysmon-stat-label">Vendor: ${gpu.vendor} | VRAM: ${gpu.vram || 'N/A'} MB</div>
              </div>
              <div class="sysmon-stat">
                <div class="sysmon-stat-label">Bus: ${gpu.bus || 'N/A'}</div>
              </div>
            `;
          });
          if (info.graphics.displays.length > 0) {
            gpuHTML += '<div class="sysmon-stat"><div class="sysmon-stat-label" style="font-weight:600;margin-top:12px;">Pantallas</div></div>';
            info.graphics.displays.forEach(d => {
              gpuHTML += `<div class="sysmon-stat"><div class="sysmon-stat-label">${d.model || 'Display'}: ${d.resolutionX}x${d.resolutionY} @${d.currentRefreshRate || '?'}Hz</div></div>`;
            });
          }
          content.innerHTML = gpuHTML || '<div style="opacity:0.4;padding:20px;">No GPU detectada</div>';

        } else if (activeTab === 'processes') {
          const procs = await window.electronAPI.getProcesses();
          const sorted = procs.list.sort((a, b) => b.cpu - a.cpu).slice(0, 50);
          let rows = sorted.map(p => `
            <tr>
              <td>${p.pid}</td>
              <td>${p.name}</td>
              <td>${p.cpu.toFixed(1)}%</td>
              <td>${p.mem.toFixed(1)}%</td>
              <td>${(p.memRss / 1024).toFixed(0)} MB</td>
              <td>${p.state || '-'}</td>
            </tr>
          `).join('');
          content.innerHTML = `
            <table class="process-table">
              <thead><tr>
                <th>PID</th><th>Nombre</th><th>CPU</th><th>MEM</th><th>RSS</th><th>Estado</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          `;
        }
      } catch(e) {}
    };

    update();
    updateInterval = setInterval(update, 2000);

    win.onClose = () => {
      clearInterval(updateInterval);
    };
  }
};
