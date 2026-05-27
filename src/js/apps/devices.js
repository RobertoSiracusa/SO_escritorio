const DevicesApp = {
  async open() {
    const win = wm.createWindow('devices', 'Dispositivos', '🔌', { width: 700, height: 500 });
    win.body.innerHTML = `<div class="devices-app"><div style="text-align:center;padding:40px;opacity:0.5;">Detectando dispositivos...</div></div>`;

    const container = win.body.querySelector('.devices-app');

    try {
      const [sysInfo, inputDevices, outputDevices] = await Promise.all([
        window.electronAPI.getSystemInfo(),
        window.electronAPI.getInputDevices(),
        window.electronAPI.getOutputDevices()
      ]);

      let html = '';

      // Input devices
      html += `<div class="device-category">
        <div class="device-category-title">🖱️ Dispositivos de Entrada</div>`;
      const inputLines = inputDevices.split('\n').filter(l => l.trim());
      if (inputLines.length > 0 && inputLines[0] !== 'N/A') {
        inputLines.forEach(line => {
          const clean = line.replace(/[⎡⎜⎣↳]/g, '').trim();
          if (clean) {
            html += `<div class="device-item">
              <div class="device-name">${clean}</div>
            </div>`;
          }
        });
      } else {
        html += `<div class="device-item"><div class="device-name">Teclado del sistema</div><div class="device-detail">Dispositivo estándar</div></div>`;
        html += `<div class="device-item"><div class="device-name">Mouse/Touchpad</div><div class="device-detail">Dispositivo estándar</div></div>`;
      }
      html += '</div>';

      // Output devices - Audio
      html += `<div class="device-category">
        <div class="device-category-title">🔊 Dispositivos de Salida de Audio</div>`;
      const audioLines = outputDevices.audio.split('\n').filter(l => l.trim());
      if (audioLines.length > 0 && audioLines[0] !== 'N/A') {
        audioLines.forEach(line => {
          const parts = line.trim().split('\t');
          html += `<div class="device-item">
            <div class="device-name">${parts[parts.length - 1] || line.trim()}</div>
            <div class="device-detail">Audio output</div>
          </div>`;
        });
      } else {
        html += `<div class="device-item"><div class="device-name">Salida de audio predeterminada</div></div>`;
      }
      html += '</div>';

      // Display devices
      html += `<div class="device-category">
        <div class="device-category-title">🖥️ Pantallas</div>`;
      sysInfo.graphics.displays.forEach(d => {
        html += `<div class="device-item">
          <div class="device-name">${d.model || 'Monitor'}</div>
          <div class="device-detail">${d.resolutionX}x${d.resolutionY} — ${d.connection || 'N/A'} — ${d.currentRefreshRate || '?'}Hz</div>
        </div>`;
      });
      html += '</div>';

      // GPUs
      html += `<div class="device-category">
        <div class="device-category-title">🎮 GPUs</div>`;
      sysInfo.graphics.controllers.forEach(gpu => {
        html += `<div class="device-item">
          <div class="device-name">${gpu.model}</div>
          <div class="device-detail">${gpu.vendor} — VRAM: ${gpu.vram || 'N/A'} MB</div>
        </div>`;
      });
      html += '</div>';

      // Network
      html += `<div class="device-category">
        <div class="device-category-title">🌐 Interfaces de Red</div>`;
      sysInfo.networkInterfaces.forEach(iface => {
        if (iface.ip4 || iface.ip6) {
          html += `<div class="device-item">
            <div class="device-name">${iface.iface} (${iface.type || 'unknown'})</div>
            <div class="device-detail">IPv4: ${iface.ip4 || 'N/A'} — MAC: ${iface.mac || 'N/A'} — Speed: ${iface.speed || '?'} Mbps</div>
          </div>`;
        }
      });
      html += '</div>';

      // Disks
      html += `<div class="device-category">
        <div class="device-category-title">💾 Almacenamiento</div>`;
      sysInfo.diskLayout.forEach(disk => {
        html += `<div class="device-item">
          <div class="device-name">${disk.name || disk.device}</div>
          <div class="device-detail">Tipo: ${disk.type} — Tamaño: ${(disk.size / 1073741824).toFixed(0)} GB — ${disk.interfaceType || 'N/A'}</div>
        </div>`;
      });
      html += '</div>';

      // USB
      if (sysInfo.usb && sysInfo.usb.length > 0) {
        html += `<div class="device-category">
          <div class="device-category-title">🔌 USB</div>`;
        sysInfo.usb.forEach(device => {
          html += `<div class="device-item">
            <div class="device-name">${device.name || 'USB Device'}</div>
            <div class="device-detail">ID: ${device.deviceId || 'N/A'} — ${device.manufacturer || ''}</div>
          </div>`;
        });
        html += '</div>';
      }

      container.innerHTML = html;
    } catch(e) {
      container.innerHTML = `<div style="padding:20px;color:#f55;">Error detectando dispositivos: ${e.message}</div>`;
    }
  }
};
