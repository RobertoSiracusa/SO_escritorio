const VideoPlayerApp = {
  open() {
    const win = wm.createWindow('videoplayer', 'Reproductor de Video', '🎬', { width: 750, height: 500 });
    win.body.innerHTML = `
      <div class="videoplayer-app">
        <div class="video-toolbar">
          <button class="vp-open-btn">📂 Abrir Video</button>
          <button class="vp-import-btn">📥 Importar</button>
        </div>
        <div class="video-container">
          <div class="video-empty">Abre o importa un video para reproducir</div>
        </div>
      </div>
    `;

    const container = win.body.querySelector('.video-container');

    const playVideo = (src) => {
      container.innerHTML = `<video controls autoplay style="max-width:100%;max-height:100%;"><source src="${src}"></video>`;
    };

    win.body.querySelector('.vp-open-btn').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.addEventListener('change', async () => {
        if (input.files[0]) {
          const file = input.files[0];
          await window.electronAPI.fsCopyRealFile(file.path, '/Videos/' + file.name);
          const dataUrl = await window.electronAPI.fsReadFileBinary('/Videos/' + file.name);
          if (dataUrl) playVideo(dataUrl);
        }
      });
      input.click();
    });

    win.body.querySelector('.vp-import-btn').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.addEventListener('change', async () => {
        if (input.files[0]) {
          const file = input.files[0];
          await window.electronAPI.fsCopyRealFile(file.path, '/Videos/' + file.name);
          const dataUrl = await window.electronAPI.fsReadFileBinary('/Videos/' + file.name);
          if (dataUrl) playVideo(dataUrl);
        }
      });
      input.click();
    });
  },

  async openVideo(path) {
    const dataUrl = await window.electronAPI.fsReadFileBinary(path);
    if (!dataUrl) return;
    const name = path.split('/').pop();
    const win = wm.createWindow('videoplayer_view', `Video - ${name}`, '🎬', { width: 750, height: 500, allowMultiple: true });
    win.body.innerHTML = `
      <div class="videoplayer-app">
        <div class="video-container">
          <video controls autoplay style="max-width:100%;max-height:100%;"><source src="${dataUrl}"></video>
        </div>
      </div>
    `;
  }
};
