const Taskbar = {
  init() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    this.startSystemMonitor();
    this.setupMenus();
  },

  updateClock() {
    const now = new Date();
    const el = document.getElementById('taskbar-clock');
    if (el) {
      el.textContent = now.toLocaleDateString('es-ES', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
  },

  async startSystemMonitor() {
    const update = async () => {
      try {
        const [cpu, mem] = await Promise.all([
          window.electronAPI.getCpuUsage(),
          window.electronAPI.getMemUsage()
        ]);
        document.getElementById('tray-cpu').textContent = `🔲 ${cpu.currentLoad.toFixed(0)}%`;
        const memPercent = ((mem.used / mem.total) * 100).toFixed(0);
        document.getElementById('tray-ram').textContent = `💾 ${memPercent}%`;
      } catch(e) {}
    };
    update();
    setInterval(update, 3000);

    const userTray = document.getElementById('tray-user');
    if (LoginManager.currentUser) {
      userTray.textContent = LoginManager.currentUser.avatar + ' ' + LoginManager.currentUser.username;
    }
  },

  setupMenus() {
    const appleBtn = document.getElementById('apple-menu-btn');
    const dropdown = document.getElementById('apple-menu-dropdown');

    appleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });

    document.getElementById('menu-about').addEventListener('click', () => {
      this.showAbout();
    });

    document.getElementById('menu-sysinfo').addEventListener('click', () => {
      SysMonitorApp.open();
    });

    document.getElementById('menu-settings').addEventListener('click', () => {
      SettingsApp.open();
    });

    document.getElementById('menu-switch-user').addEventListener('click', () => {
      LoginManager.logout();
    });

    document.getElementById('menu-logout').addEventListener('click', () => {
      LoginManager.logout();
    });

    document.getElementById('menu-shutdown').addEventListener('click', () => {
      window.electronAPI.quitApp();
    });
  },

  showAbout() {
    const win = wm.createWindow('about', 'Acerca de SimulOS', '🍎', { width: 350, height: 280 });
    win.body.innerHTML = `
      <div style="text-align:center; padding:30px;">
        <div style="font-size:60px; margin-bottom:12px;">🖥️</div>
        <div style="font-size:22px; font-weight:600; margin-bottom:4px;">SimulOS</div>
        <div style="opacity:0.5; margin-bottom:16px;">Versión 1.0.0</div>
        <div style="opacity:0.4; font-size:12px; line-height:1.6;">
          Sistema Operativo de Escritorio Simulado<br>
          Desarrollado con Electron<br>
          © 2026 Roberto Siracusa
        </div>
      </div>
    `;
  }
};
