const Desktop = {
  user: null,
  wallpapers: {
    'default': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'sunset': 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 30%, #f0932b 60%, #6ab04c 100%)',
    'ocean': 'linear-gradient(135deg, #0c2461 0%, #0a3d62 30%, #1e3799 60%, #4a69bd 100%)',
    'forest': 'linear-gradient(135deg, #0a3d0a 0%, #1b5e20 30%, #2e7d32 60%, #388e3c 100%)',
    'aurora': 'linear-gradient(135deg, #0d0d2b 0%, #1a237e 25%, #4a148c 50%, #00bcd4 75%, #76ff03 100%)',
    'nebula': 'linear-gradient(135deg, #1a0033 0%, #4a0080 25%, #800080 50%, #ff00ff 75%, #ff6699 100%)',
    'midnight': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #2d3436 100%)',
    'candy': 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 30%, #fbc2eb 60%, #a18cd1 100%)',
    'arctic': 'linear-gradient(135deg, #e0f7fa 0%, #80deea 30%, #4dd0e1 60%, #00acc1 100%)',
    'volcano': 'linear-gradient(135deg, #1a0000 0%, #4a0000 30%, #8b0000 50%, #ff4500 75%, #ff8c00 100%)'
  },
  desktopIcons: [],
  dragIcon: null,

  async init(user) {
    this.user = user;
    await this.loadState();
    this.applyWallpaper();
    this.renderDesktopIcons();
    this.setupEvents();
    this.setupContextMenu();
    Taskbar.init();
  },

  async loadState() {
    const state = await window.electronAPI.loadDesktopState(this.user.username);
    if (state) {
      this.user.wallpaper = state.wallpaper || 'default';
      this.desktopIcons = state.icons || this.getDefaultIcons();
    } else {
      this.desktopIcons = this.getDefaultIcons();
    }
  },

  async saveState() {
    await window.electronAPI.saveDesktopState(this.user.username, {
      wallpaper: this.user.wallpaper,
      icons: this.desktopIcons
    });
  },

  getDefaultIcons() {
    return [
      { id: 'folder_docs', type: 'folder', name: 'Documentos', icon: '📁', x: 20, y: 10, path: '/Documentos' },
      { id: 'folder_imgs', type: 'folder', name: 'Imágenes', icon: '🖼️', x: 20, y: 110, path: '/Imagenes' },
      { id: 'folder_vids', type: 'folder', name: 'Videos', icon: '🎬', x: 20, y: 210, path: '/Videos' },
      { id: 'file_sample_video', type: 'file', name: 'Video Demo.mp4', icon: '🎬', x: 20, y: 310, path: '/Videos/file_example_MP4_480_1_5MG.mp4' },
      { id: 'file_sample_audio', type: 'file', name: 'Audio Demo.mp3', icon: '🎵', x: 20, y: 410, path: '/Musica/file_example_MP3_700KB.mp3' }
    ];
  },

  applyWallpaper() {
    const desktop = document.getElementById('desktop');
    const wp = this.wallpapers[this.user.wallpaper] || this.wallpapers['default'];
    desktop.style.background = wp;
    desktop.style.backgroundSize = 'cover';
  },

  renderDesktopIcons() {
    const container = document.getElementById('desktop-icons');
    container.innerHTML = '';
    this.desktopIcons.forEach(iconData => {
      const el = document.createElement('div');
      el.className = 'desktop-icon';
      el.dataset.id = iconData.id;
      el.style.left = iconData.x + 'px';
      el.style.top = iconData.y + 'px';
      el.innerHTML = `
        <div class="icon">${iconData.icon}</div>
        <div class="label">${iconData.name}</div>
      `;
      el.addEventListener('dblclick', () => this.openDesktopIcon(iconData));
      this.setupIconDrag(el, iconData);
      container.appendChild(el);
    });
  },

  setupIconDrag(el, iconData) {
    let startX, startY, iconStartX, iconStartY, dragging = false;

    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      iconStartX = iconData.x;
      iconStartY = iconData.y;
      dragging = false;

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragging = true;
        if (dragging) {
          iconData.x = Math.max(0, iconStartX + dx);
          iconData.y = Math.max(0, iconStartY + dy);
          el.style.left = iconData.x + 'px';
          el.style.top = iconData.y + 'px';
        }
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (dragging) this.saveState();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  },

  openDesktopIcon(iconData) {
    if (iconData.type === 'folder') {
      FileManagerApp.open(iconData.path);
    } else if (iconData.type === 'file') {
      const ext = iconData.path.split('.').pop().toLowerCase();
      const videoExts = ['mp4', 'webm', 'ogg', 'avi', 'mkv'];
      const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac'];
      const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
      if (videoExts.includes(ext)) {
        VideoPlayerApp.openVideo(iconData.path);
      } else if (audioExts.includes(ext)) {
        VideoPlayerApp.openVideo(iconData.path);
      } else if (imageExts.includes(ext)) {
        GalleryApp.openImage(iconData.path);
      } else {
        NotepadApp.openFile(iconData.path, iconData.name);
      }
    }
  },

  createFolder(x, y) {
    const name = 'Nueva Carpeta';
    const id = 'folder_' + Date.now();
    const iconData = { id, type: 'folder', name, icon: '📁', x, y, path: `/${name}` };
    this.desktopIcons.push(iconData);
    window.electronAPI.fsCreateDir(iconData.path);
    this.renderDesktopIcons();
    this.saveState();

    setTimeout(() => {
      const el = document.querySelector(`.desktop-icon[data-id="${id}"] .label`);
      if (el) {
        const input = document.createElement('input');
        input.className = 'label-edit';
        input.value = name;
        input.addEventListener('blur', () => this.finishRename(id, input.value));
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') input.blur();
        });
        el.replaceWith(input);
        input.focus();
        input.select();
      }
    }, 100);
  },

  finishRename(id, newName) {
    const icon = this.desktopIcons.find(i => i.id === id);
    if (icon && newName.trim()) {
      const oldPath = icon.path;
      icon.name = newName.trim();
      icon.path = `/${newName.trim()}`;
      window.electronAPI.fsCreateDir(icon.path);
    }
    this.renderDesktopIcons();
    this.saveState();
  },

  setupEvents() {
    document.querySelectorAll('.dock-item').forEach(item => {
      item.addEventListener('click', () => {
        const app = item.dataset.app;
        if (app) this.openApp(app);
      });
    });
  },

  setupContextMenu() {
    const desktop = document.getElementById('desktop');
    const menu = document.getElementById('context-menu');

    desktop.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.dock') || e.target.closest('.taskbar') || e.target.closest('.app-window')) return;
      e.preventDefault();
      menu.style.left = e.clientX + 'px';
      menu.style.top = e.clientY + 'px';
      menu.style.display = 'block';
      menu._clickX = e.clientX;
      menu._clickY = e.clientY;
    });

    document.addEventListener('click', () => {
      menu.style.display = 'none';
    });

    document.getElementById('ctx-new-folder').addEventListener('click', () => {
      this.createFolder(menu._clickX - 40, menu._clickY - 70);
    });

    document.getElementById('ctx-change-wallpaper').addEventListener('click', () => {
      SettingsApp.open();
    });

    document.getElementById('ctx-sysinfo').addEventListener('click', () => {
      SysMonitorApp.open();
    });

    document.getElementById('ctx-terminal').addEventListener('click', () => {
      TerminalApp.open();
    });
  },

  openApp(name) {
    switch(name) {
      case 'filemanager': FileManagerApp.open('/'); break;
      case 'browser': BrowserApp.open(); break;
      case 'terminal': TerminalApp.open(); break;
      case 'calculator': CalculatorApp.open(); break;
      case 'notepad': NotepadApp.open(); break;
      case 'gallery': GalleryApp.open(); break;
      case 'videoplayer': VideoPlayerApp.open(); break;
      case 'sysmonitor': SysMonitorApp.open(); break;
      case 'devices': DevicesApp.open(); break;
      case 'antivirus': AntivirusApp.open(); break;
      case 'pong': PongApp.open(); break;
      case 'minesweeper': MinesweeperApp.open(); break;
      case 'snake': SnakeApp.open(); break;
      case 'settings': SettingsApp.open(); break;
    }
  }
};
