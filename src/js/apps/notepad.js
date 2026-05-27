const NotepadApp = {
  _showDialog(container, title, placeholder = '') {
    return new Promise((resolve) => {
      let overlay = container.querySelector('.np-dialog-overlay');
      if (overlay) overlay.remove();

      overlay = document.createElement('div');
      overlay.className = 'fm-dialog-overlay np-dialog-overlay';
      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div class="fm-dialog">
          <div class="fm-dialog-title">${title}</div>
          <input class="fm-dialog-input" type="text" spellcheck="false" value="${placeholder}">
          <div class="fm-dialog-buttons">
            <button class="fm-dialog-cancel">Cancelar</button>
            <button class="fm-dialog-ok">Aceptar</button>
          </div>
        </div>
      `;
      container.appendChild(overlay);

      const input = overlay.querySelector('.fm-dialog-input');
      input.focus();
      input.select();

      const cleanup = () => { overlay.remove(); };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { cleanup(); resolve(input.value.trim()); }
        if (e.key === 'Escape') { cleanup(); resolve(null); }
      });
      overlay.querySelector('.fm-dialog-ok').addEventListener('click', () => {
        cleanup(); resolve(input.value.trim());
      });
      overlay.querySelector('.fm-dialog-cancel').addEventListener('click', () => {
        cleanup(); resolve(null);
      });
    });
  },

  open(content = '', filename = 'sin_titulo.txt') {
    const win = wm.createWindow('notepad', 'Bloc de Notas', '📝', { width: 650, height: 450, allowMultiple: true });
    let currentPath = null;

    win.body.innerHTML = `
      <div class="notepad-app" style="position:relative;">
        <div class="notepad-toolbar">
          <input class="notepad-filename" value="${filename}">
          <button class="np-new">Nuevo</button>
          <button class="np-open">Abrir</button>
          <button class="np-save">Guardar</button>
          <button class="np-save-as">Guardar Como</button>
        </div>
        <textarea class="notepad-textarea" spellcheck="false">${content}</textarea>
      </div>
    `;

    const app = win.body.querySelector('.notepad-app');
    const textarea = win.body.querySelector('.notepad-textarea');
    const filenameInput = win.body.querySelector('.notepad-filename');

    win.body.querySelector('.np-new').addEventListener('click', () => {
      textarea.value = '';
      filenameInput.value = 'sin_titulo.txt';
      currentPath = null;
    });

    win.body.querySelector('.np-open').addEventListener('click', async () => {
      const path = await this._showDialog(app, 'Ruta del archivo:', '/Documentos/nota.txt');
      if (path) {
        const fileContent = await window.electronAPI.fsReadFile(path);
        textarea.value = fileContent !== null ? fileContent : '';
        currentPath = path;
        filenameInput.value = path.split('/').pop();
      }
    });

    win.body.querySelector('.np-save').addEventListener('click', async () => {
      if (currentPath) {
        await window.electronAPI.fsWriteFile(currentPath, textarea.value);
      } else {
        const path = await this._showDialog(app, 'Guardar en:', '/Documentos/' + filenameInput.value);
        if (path) {
          await window.electronAPI.fsWriteFile(path, textarea.value);
          currentPath = path;
        }
      }
    });

    win.body.querySelector('.np-save-as').addEventListener('click', async () => {
      const path = await this._showDialog(app, 'Guardar como:', '/Documentos/' + filenameInput.value);
      if (path) {
        await window.electronAPI.fsWriteFile(path, textarea.value);
        currentPath = path;
        filenameInput.value = path.split('/').pop();
      }
    });
  },

  async openFile(path, name) {
    const content = await window.electronAPI.fsReadFile(path);
    const win = wm.createWindow('notepad', `Bloc de Notas - ${name}`, '📝', { width: 650, height: 450, allowMultiple: true });
    let currentPath = path;

    win.body.innerHTML = `
      <div class="notepad-app" style="position:relative;">
        <div class="notepad-toolbar">
          <input class="notepad-filename" value="${name}">
          <button class="np-save">Guardar</button>
          <button class="np-save-as">Guardar Como</button>
        </div>
        <textarea class="notepad-textarea" spellcheck="false">${content || ''}</textarea>
      </div>
    `;

    const app = win.body.querySelector('.notepad-app');
    const textarea = win.body.querySelector('.notepad-textarea');

    win.body.querySelector('.np-save').addEventListener('click', async () => {
      await window.electronAPI.fsWriteFile(currentPath, textarea.value);
    });

    win.body.querySelector('.np-save-as').addEventListener('click', async () => {
      const newPath = await this._showDialog(app, 'Guardar como:', currentPath);
      if (newPath) {
        await window.electronAPI.fsWriteFile(newPath, textarea.value);
        currentPath = newPath;
      }
    });
  }
};
