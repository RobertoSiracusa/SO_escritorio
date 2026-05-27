const BrowserApp = {
  open(url = 'https://www.google.com') {
    const win = wm.createWindow('browser', 'Navegador Web', '🌐', { width: 1000, height: 650 });
    win.body.innerHTML = `
      <div class="browser-app">
        <div class="browser-toolbar">
          <button class="browser-back">←</button>
          <button class="browser-forward">→</button>
          <button class="browser-refresh">↻</button>
          <input class="browser-url" value="${url}" placeholder="Ingresa una URL...">
          <button class="browser-go">Ir</button>
        </div>
        <div class="browser-content">
          <webview src="${url}" style="width:100%;height:100%;"></webview>
        </div>
      </div>
    `;

    const webview = win.body.querySelector('webview');
    const urlInput = win.body.querySelector('.browser-url');

    const navigateTo = (targetUrl) => {
      let finalUrl = targetUrl;
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
          finalUrl = 'https://' + finalUrl;
        } else {
          finalUrl = 'https://www.google.com/search?q=' + encodeURIComponent(finalUrl);
        }
      }
      urlInput.value = finalUrl;
      webview.src = finalUrl;
    };

    win.body.querySelector('.browser-go').addEventListener('click', () => navigateTo(urlInput.value));
    urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') navigateTo(urlInput.value);
    });
    win.body.querySelector('.browser-back').addEventListener('click', () => webview.goBack());
    win.body.querySelector('.browser-forward').addEventListener('click', () => webview.goForward());
    win.body.querySelector('.browser-refresh').addEventListener('click', () => webview.reload());

    webview.addEventListener('did-navigate', (e) => {
      urlInput.value = e.url;
    });

    webview.addEventListener('did-navigate-in-page', (e) => {
      urlInput.value = e.url;
    });
  }
};
