const AntivirusApp = {
  open() {
    const win = wm.createWindow('antivirus', 'SimulOS Antivirus', '🛡️', { width: 550, height: 550 });
    let scanning = false;

    win.body.innerHTML = `
      <div class="antivirus-app">
        <div class="av-shield">🛡️</div>
        <div class="av-status safe">Sistema Protegido</div>
        <div class="av-detail">Última revisión: Nunca</div>
        <button class="av-scan-btn">Iniciar Escaneo Completo</button>
        <div class="av-progress" style="display:none;">
          <div class="av-progress-bar"></div>
        </div>
        <div class="av-log"></div>
      </div>
    `;

    const status = win.body.querySelector('.av-status');
    const detail = win.body.querySelector('.av-detail');
    const scanBtn = win.body.querySelector('.av-scan-btn');
    const progress = win.body.querySelector('.av-progress');
    const progressBar = win.body.querySelector('.av-progress-bar');
    const log = win.body.querySelector('.av-log');

    const addLog = (text) => {
      log.textContent += text + '\n';
      log.scrollTop = log.scrollHeight;
    };

    const fakeFiles = [
      '/System/kernel.bin', '/System/drivers/display.sys', '/System/drivers/audio.sys',
      '/System/drivers/network.sys', '/System/drivers/usb.sys', '/System/config/boot.cfg',
      '/System/config/security.dat', '/System/lib/libcore.so', '/System/lib/libcrypto.so',
      '/Users/admin/Documentos/', '/Users/admin/Imagenes/', '/Users/admin/Videos/',
      '/Users/admin/.config/settings.json', '/Users/admin/.cache/temp.dat',
      '/Applications/browser.app', '/Applications/terminal.app', '/Applications/calculator.app',
      '/tmp/session_001.tmp', '/tmp/cache_buffer.dat', '/var/log/system.log',
      '/var/log/auth.log', '/var/log/error.log', '/etc/hosts', '/etc/resolv.conf'
    ];

    const threats = [
      { name: 'Trojan.SimulOS.FakeAlert', risk: 'Medio', file: '/tmp/cache_buffer.dat' },
      { name: 'PUP.SimulOS.Adware', risk: 'Bajo', file: '/Users/admin/.cache/temp.dat' }
    ];

    scanBtn.addEventListener('click', async () => {
      if (scanning) return;
      scanning = true;
      scanBtn.disabled = true;
      status.className = 'av-status scanning';
      status.textContent = 'Escaneando...';
      progress.style.display = 'block';
      log.textContent = '';

      addLog('═══ SimulOS Antivirus — Escaneo Completo ═══');
      addLog(`Inicio: ${new Date().toLocaleString('es-ES')}\n`);

      let threatsFound = 0;
      const shouldFindThreats = Math.random() > 0.5;

      for (let i = 0; i < fakeFiles.length; i++) {
        const pct = ((i + 1) / fakeFiles.length * 100).toFixed(0);
        progressBar.style.width = pct + '%';
        detail.textContent = `Escaneando: ${fakeFiles[i]}`;
        addLog(`[${pct}%] Escaneando: ${fakeFiles[i]}`);

        if (shouldFindThreats) {
          const threat = threats.find(t => t.file === fakeFiles[i]);
          if (threat) {
            threatsFound++;
            addLog(`  ⚠️  AMENAZA DETECTADA: ${threat.name} (Riesgo: ${threat.risk})`);
            addLog(`      Archivo: ${threat.file}`);
            addLog(`      Acción: Puesto en cuarentena\n`);
          }
        }

        await new Promise(r => setTimeout(r, 150 + Math.random() * 200));
      }

      progressBar.style.width = '100%';
      addLog('\n═══ Escaneo Completado ═══');
      addLog(`Archivos escaneados: ${fakeFiles.length}`);
      addLog(`Amenazas encontradas: ${threatsFound}`);

      if (threatsFound > 0) {
        addLog(`Amenazas en cuarentena: ${threatsFound}`);
        addLog('\n✅ Todas las amenazas han sido neutralizadas.');
        status.className = 'av-status safe';
        status.textContent = 'Amenazas Neutralizadas';
      } else {
        addLog('\n✅ No se encontraron amenazas.');
        status.className = 'av-status safe';
        status.textContent = 'Sistema Limpio';
      }

      detail.textContent = `Última revisión: ${new Date().toLocaleString('es-ES')}`;
      scanning = false;
      scanBtn.disabled = false;
      setTimeout(() => { progress.style.display = 'none'; }, 2000);
    });
  }
};
