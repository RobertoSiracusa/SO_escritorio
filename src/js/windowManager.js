class WindowManager {
  constructor() {
    this.windows = new Map();
    this.zIndex = 100;
    this.activeWindowId = null;
  }

  createWindow(id, title, icon, options = {}) {
    const existing = this.windows.get(id);
    if (existing && !options.allowMultiple) {
      this.focusWindow(id);
      if (existing.element.classList.contains('minimized')) {
        existing.element.classList.remove('minimized');
      }
      return existing;
    }

    const actualId = options.allowMultiple ? `${id}_${Date.now()}` : id;
    const container = document.getElementById('windows-container');

    const w = options.width || 800;
    const h = options.height || 500;
    const x = options.x || Math.random() * (window.innerWidth - w - 100) + 50;
    const y = options.y || Math.random() * (window.innerHeight - h - 150) + 40;

    const win = document.createElement('div');
    win.className = 'app-window';
    win.id = `window-${actualId}`;
    win.style.width = w + 'px';
    win.style.height = h + 'px';
    win.style.left = x + 'px';
    win.style.top = y + 'px';

    win.innerHTML = `
      <div class="window-titlebar">
        <div class="window-controls">
          <button class="window-btn close" data-action="close">✕</button>
          <button class="window-btn minimize" data-action="minimize">−</button>
          <button class="window-btn maximize" data-action="maximize">+</button>
        </div>
        <div class="window-title">${icon} ${title}</div>
      </div>
      <div class="window-body"></div>
      <div class="resize-handle right"></div>
      <div class="resize-handle bottom"></div>
      <div class="resize-handle corner"></div>
      <div class="resize-handle left"></div>
      <div class="resize-handle top"></div>
    `;

    container.appendChild(win);

    const windowData = {
      id: actualId,
      appType: id,
      element: win,
      title,
      icon,
      body: win.querySelector('.window-body'),
      minimized: false,
      maximized: false,
      prevBounds: null
    };

    this.windows.set(actualId, windowData);
    this.focusWindow(actualId);
    this.setupWindowEvents(actualId);
    this.updateDockIndicators();

    return windowData;
  }

  setupWindowEvents(id) {
    const data = this.windows.get(id);
    if (!data) return;
    const win = data.element;
    const titlebar = win.querySelector('.window-titlebar');

    win.addEventListener('mousedown', () => this.focusWindow(id));

    // Drag
    let dragStartX, dragStartY, winStartX, winStartY;
    const onDragMove = (e) => {
      if (data.maximized) return;
      win.style.left = (winStartX + e.clientX - dragStartX) + 'px';
      win.style.top = (winStartY + e.clientY - dragStartY) + 'px';
    };
    const onDragEnd = () => {
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
    };

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('window-btn')) return;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      winStartX = parseInt(win.style.left);
      winStartY = parseInt(win.style.top);
      this.focusWindow(id);
      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragEnd);
    });

    // Double click titlebar to maximize
    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.classList.contains('window-btn')) return;
      this.toggleMaximize(id);
    });

    // Window controls
    win.querySelector('.window-btn.close').addEventListener('click', () => this.closeWindow(id));
    win.querySelector('.window-btn.minimize').addEventListener('click', () => this.minimizeWindow(id));
    win.querySelector('.window-btn.maximize').addEventListener('click', () => this.toggleMaximize(id));

    // Resize handles
    const handles = win.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        if (data.maximized) return;
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = parseInt(win.style.width);
        const startH = parseInt(win.style.height);
        const startL = parseInt(win.style.left);
        const startT = parseInt(win.style.top);
        const isRight = handle.classList.contains('right') || handle.classList.contains('corner');
        const isBottom = handle.classList.contains('bottom') || handle.classList.contains('corner');
        const isLeft = handle.classList.contains('left');
        const isTop = handle.classList.contains('top');

        const onResize = (ev) => {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          if (isRight) win.style.width = Math.max(400, startW + dx) + 'px';
          if (isBottom) win.style.height = Math.max(300, startH + dy) + 'px';
          if (isLeft) {
            const newW = Math.max(400, startW - dx);
            win.style.width = newW + 'px';
            win.style.left = (startL + startW - newW) + 'px';
          }
          if (isTop) {
            const newH = Math.max(300, startH - dy);
            win.style.height = newH + 'px';
            win.style.top = (startT + startH - newH) + 'px';
          }
        };
        const onEnd = () => {
          document.removeEventListener('mousemove', onResize);
          document.removeEventListener('mouseup', onEnd);
        };
        document.addEventListener('mousemove', onResize);
        document.addEventListener('mouseup', onEnd);
      });
    });
  }

  focusWindow(id) {
    const data = this.windows.get(id);
    if (!data) return;
    this.zIndex++;
    data.element.style.zIndex = this.zIndex;
    this.windows.forEach((w) => w.element.classList.remove('focused'));
    data.element.classList.add('focused');
    this.activeWindowId = id;
    const appName = document.getElementById('active-app-name');
    if (appName) appName.textContent = data.title;
  }

  minimizeWindow(id) {
    const data = this.windows.get(id);
    if (!data) return;
    data.element.classList.add('minimized');
    data.minimized = true;
    if (this.activeWindowId === id) {
      document.getElementById('active-app-name').textContent = '';
    }
  }

  toggleMaximize(id) {
    const data = this.windows.get(id);
    if (!data) return;
    if (data.maximized) {
      data.element.classList.remove('maximized');
      if (data.prevBounds) {
        data.element.style.left = data.prevBounds.left;
        data.element.style.top = data.prevBounds.top;
        data.element.style.width = data.prevBounds.width;
        data.element.style.height = data.prevBounds.height;
      }
      data.maximized = false;
    } else {
      data.prevBounds = {
        left: data.element.style.left,
        top: data.element.style.top,
        width: data.element.style.width,
        height: data.element.style.height
      };
      data.element.classList.add('maximized');
      data.maximized = true;
    }
  }

  closeWindow(id) {
    const data = this.windows.get(id);
    if (!data) return;
    if (data.onClose) data.onClose();
    data.element.remove();
    this.windows.delete(id);
    this.updateDockIndicators();
    if (this.activeWindowId === id) {
      document.getElementById('active-app-name').textContent = '';
      this.activeWindowId = null;
    }
  }

  updateDockIndicators() {
    const appTypes = new Set();
    this.windows.forEach(w => appTypes.add(w.appType));
    document.querySelectorAll('.dock-item').forEach(item => {
      const app = item.dataset.app;
      if (appTypes.has(app)) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  getWindow(id) {
    return this.windows.get(id);
  }
}

window.wm = new WindowManager();
