const GalleryApp = {
  open() {
    const win = wm.createWindow('gallery', 'Galería', '🖼️', { width: 750, height: 500 });
    win.body.innerHTML = `
      <div class="gallery-app">
        <div class="gallery-toolbar">
          <button class="gallery-import-btn">📥 Importar Imágenes</button>
          <button class="gallery-refresh-btn">↻ Actualizar</button>
        </div>
        <div class="gallery-grid"></div>
      </div>
    `;

    const grid = win.body.querySelector('.gallery-grid');

    const loadImages = async () => {
      grid.innerHTML = '';
      const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'];
      const dirs = ['/', '/Imagenes', '/Descargas', '/Documentos'];
      const allImages = [];

      for (const dir of dirs) {
        const items = await window.electronAPI.fsReadDir(dir);
        for (const item of items) {
          if (!item.isDirectory) {
            const ext = item.name.split('.').pop().toLowerCase();
            if (imageExts.includes(ext)) {
              allImages.push(item);
            }
          }
        }
      }

      if (allImages.length === 0) {
        grid.innerHTML = '<div class="gallery-empty">No hay imágenes. Importa algunas usando el botón de arriba.</div>';
        return;
      }

      for (const img of allImages) {
        const dataUrl = await window.electronAPI.fsReadFileBinary(img.path);
        if (dataUrl) {
          const thumb = document.createElement('div');
          thumb.className = 'gallery-thumb';
          thumb.innerHTML = `<img src="${dataUrl}" alt="${img.name}">`;
          thumb.addEventListener('click', () => this.showViewer(win, dataUrl, img.name));
          grid.appendChild(thumb);
        }
      }
    };

    win.body.querySelector('.gallery-import-btn').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      input.addEventListener('change', async () => {
        for (const file of input.files) {
          await window.electronAPI.fsCopyRealFile(file.path, '/Imagenes/' + file.name);
        }
        setTimeout(loadImages, 300);
      });
      input.click();
    });

    win.body.querySelector('.gallery-refresh-btn').addEventListener('click', loadImages);

    loadImages();
  },

  showViewer(win, dataUrl, name) {
    const viewer = document.createElement('div');
    viewer.className = 'gallery-viewer';
    viewer.innerHTML = `
      <img src="${dataUrl}" alt="${name}">
      <button class="gallery-viewer-close">✕</button>
    `;
    viewer.querySelector('.gallery-viewer-close').addEventListener('click', () => viewer.remove());
    viewer.addEventListener('click', (e) => {
      if (e.target === viewer) viewer.remove();
    });
    win.body.querySelector('.gallery-app').appendChild(viewer);
  },

  async openImage(path) {
    const dataUrl = await window.electronAPI.fsReadFileBinary(path);
    if (!dataUrl) return;
    const name = path.split('/').pop();
    const win = wm.createWindow('gallery_view', `Imagen - ${name}`, '🖼️', { width: 700, height: 500, allowMultiple: true });
    win.body.innerHTML = `
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111;">
        <img src="${dataUrl}" alt="${name}" style="max-width:100%;max-height:100%;object-fit:contain;">
      </div>
    `;
  }
};
