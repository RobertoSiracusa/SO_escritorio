const FileManagerApp = {
  open(startPath = '/') {
    const win = wm.createWindow('filemanager', 'Gestor de Archivos', '📁', { width: 850, height: 550 });
    win.body.innerHTML = `
      <div class="filemanager-app">
        <div class="fm-sidebar">
          <div class="fm-sidebar-item" data-path="/">🏠 Inicio</div>
          <div class="fm-sidebar-item" data-path="/Documentos">📄 Documentos</div>
          <div class="fm-sidebar-item" data-path="/Imagenes">🖼️ Imágenes</div>
          <div class="fm-sidebar-item" data-path="/Videos">🎬 Videos</div>
          <div class="fm-sidebar-item" data-path="/Musica">🎵 Música</div>
          <div class="fm-sidebar-item" data-path="/Descargas">⬇️ Descargas</div>
        </div>
        <div class="fm-main">
          <div class="fm-toolbar">
            <button class="fm-back-btn">←</button>
            <button class="fm-forward-btn">→</button>
            <button class="fm-up-btn">↑</button>
            <input class="fm-path" readonly>
            <button class="fm-new-folder-btn">+ Carpeta</button>
            <button class="fm-new-file-btn">+ Archivo</button>
            <button class="fm-import-btn">📥 Importar</button>
          </div>
          <div class="fm-content"></div>
        </div>
        <div class="fm-dialog-overlay" style="display:none;">
          <div class="fm-dialog">
            <div class="fm-dialog-title"></div>
            <input class="fm-dialog-input" type="text" spellcheck="false">
            <div class="fm-dialog-buttons">
              <button class="fm-dialog-cancel">Cancelar</button>
              <button class="fm-dialog-ok">Aceptar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const state = { currentPath: startPath, history: [startPath], historyIndex: 0 };
    const content = win.body.querySelector('.fm-content');
    const pathInput = win.body.querySelector('.fm-path');

    const showDialog = (title, placeholder = '') => {
      return new Promise((resolve) => {
        const overlay = win.body.querySelector('.fm-dialog-overlay');
        const input = win.body.querySelector('.fm-dialog-input');
        const titleEl = win.body.querySelector('.fm-dialog-title');
        const okBtn = win.body.querySelector('.fm-dialog-ok');
        const cancelBtn = win.body.querySelector('.fm-dialog-cancel');

        titleEl.textContent = title;
        input.value = placeholder;
        overlay.style.display = 'flex';
        input.focus();
        input.select();

        const cleanup = () => {
          overlay.style.display = 'none';
          okBtn.replaceWith(okBtn.cloneNode(true));
          cancelBtn.replaceWith(cancelBtn.cloneNode(true));
          input.removeEventListener('keydown', onKey);
        };

        const onKey = (e) => {
          if (e.key === 'Enter') { cleanup(); resolve(input.value.trim()); }
          if (e.key === 'Escape') { cleanup(); resolve(null); }
        };
        input.addEventListener('keydown', onKey);

        win.body.querySelector('.fm-dialog-ok').addEventListener('click', () => {
          cleanup();
          resolve(input.value.trim());
        });
        win.body.querySelector('.fm-dialog-cancel').addEventListener('click', () => {
          cleanup();
          resolve(null);
        });
      });
    };

    const navigate = async (path) => {
      state.currentPath = path;
      pathInput.value = path;
      const items = await window.electronAPI.fsReadDir(path);
      renderItems(items);

      win.body.querySelectorAll('.fm-sidebar-item').forEach(item => {
        item.classList.toggle('active', item.dataset.path === path);
      });
    };

    const renderItems = (items) => {
      if (items.length === 0) {
        content.innerHTML = '<div class="fm-empty">Carpeta vacía</div>';
        return;
      }
      content.innerHTML = '';
      items.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return b.isDirectory - a.isDirectory;
        return a.name.localeCompare(b.name);
      });
      items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'fm-item';
        el.innerHTML = `
          <div class="fm-icon">${this.getFileIcon(item)}</div>
          <div class="fm-name">${item.name}</div>
        `;
        el.addEventListener('dblclick', () => {
          if (item.isDirectory) {
            state.history = state.history.slice(0, state.historyIndex + 1);
            state.history.push(item.path);
            state.historyIndex++;
            navigate(item.path);
          } else {
            this.openFile(item);
          }
        });
        el.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showFileContextMenu(e, item, () => navigate(state.currentPath));
        });
        content.appendChild(el);
      });
    };

    win.body.querySelector('.fm-back-btn').addEventListener('click', () => {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        navigate(state.history[state.historyIndex]);
      }
    });

    win.body.querySelector('.fm-forward-btn').addEventListener('click', () => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        navigate(state.history[state.historyIndex]);
      }
    });

    win.body.querySelector('.fm-up-btn').addEventListener('click', () => {
      const parts = state.currentPath.split('/').filter(Boolean);
      parts.pop();
      const parent = '/' + parts.join('/');
      navigate(parent);
    });

    win.body.querySelector('.fm-new-folder-btn').addEventListener('click', async () => {
      const name = await showDialog('Nombre de la carpeta:', 'Nueva Carpeta');
      if (name) {
        const fullPath = state.currentPath === '/' ? '/' + name : state.currentPath + '/' + name;
        await window.electronAPI.fsCreateDir(fullPath);
        await navigate(state.currentPath);
      }
    });

    win.body.querySelector('.fm-new-file-btn').addEventListener('click', async () => {
      const name = await showDialog('Nombre del archivo (con extensión):', 'nuevo.txt');
      if (name) {
        const fullPath = state.currentPath === '/' ? '/' + name : state.currentPath + '/' + name;
        await window.electronAPI.fsWriteFile(fullPath, '');
        await navigate(state.currentPath);
      }
    });

    win.body.querySelector('.fm-import-btn').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.addEventListener('change', async () => {
        for (const file of input.files) {
          const destPath = state.currentPath === '/' ? '/' + file.name : state.currentPath + '/' + file.name;
          await window.electronAPI.fsCopyRealFile(file.path, destPath);
        }
        await navigate(state.currentPath);
      });
      input.click();
    });

    win.body.querySelectorAll('.fm-sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        navigate(item.dataset.path);
      });
    });

    navigate(startPath);
  },

  getFileIcon(item) {
    if (item.isDirectory) return '📁';
    const ext = item.name.split('.').pop().toLowerCase();
    const icons = {
      txt: '📄', md: '📄', json: '📄', js: '📄', html: '📄', css: '📄',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', bmp: '🖼️', webp: '🖼️',
      mp4: '🎬', webm: '🎬', avi: '🎬', mkv: '🎬',
      mp3: '🎵', wav: '🎵', ogg: '🎵',
      pdf: '📕', doc: '📘', docx: '📘',
      zip: '📦', rar: '📦', tar: '📦'
    };
    return icons[ext] || '📄';
  },

  openFile(item) {
    const ext = item.name.split('.').pop().toLowerCase();
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
    const videoExts = ['mp4', 'webm', 'ogg'];

    if (imageExts.includes(ext)) {
      GalleryApp.openImage(item.path);
    } else if (videoExts.includes(ext)) {
      VideoPlayerApp.openVideo(item.path);
    } else {
      NotepadApp.openFile(item.path, item.name);
    }
  },

  showFileContextMenu(e, item, refreshFn) {
    let menu = document.getElementById('file-context-menu');
    if (menu) menu.remove();
    menu = document.createElement('div');
    menu.id = 'file-context-menu';
    menu.className = 'context-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.style.display = 'block';
    menu.innerHTML = `
      <div class="context-item" data-action="open">Abrir</div>
      <div class="context-item" data-action="delete">Eliminar</div>
    `;
    document.body.appendChild(menu);

    menu.querySelector('[data-action="open"]').addEventListener('click', () => {
      if (item.isDirectory) FileManagerApp.open(item.path);
      else this.openFile(item);
      menu.remove();
    });

    menu.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      await window.electronAPI.fsDelete(item.path);
      refreshFn();
      menu.remove();
    });

    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 10);
  }
};
