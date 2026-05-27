const SettingsApp = {
  open() {
    const win = wm.createWindow('settings', 'Preferencias del Sistema', '⚙️', { width: 750, height: 500 });
    let activeSection = 'wallpaper';

    const render = () => {
      win.body.innerHTML = `
        <div class="settings-app">
          <div class="settings-sidebar">
            <div class="settings-sidebar-item ${activeSection === 'wallpaper' ? 'active' : ''}" data-section="wallpaper">🎨 Fondo de Pantalla</div>
            <div class="settings-sidebar-item ${activeSection === 'users' ? 'active' : ''}" data-section="users">👤 Usuarios</div>
            <div class="settings-sidebar-item ${activeSection === 'about' ? 'active' : ''}" data-section="about">ℹ️ Acerca de</div>
          </div>
          <div class="settings-content"></div>
        </div>
      `;

      win.body.querySelectorAll('.settings-sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
          activeSection = item.dataset.section;
          render();
        });
      });

      const content = win.body.querySelector('.settings-content');

      if (activeSection === 'wallpaper') {
        renderWallpaperSettings(content);
      } else if (activeSection === 'users') {
        renderUserSettings(content);
      } else if (activeSection === 'about') {
        renderAbout(content);
      }
    };

    const renderWallpaperSettings = (content) => {
      const wallpapers = Desktop.wallpapers;
      let html = `<div class="settings-section-title">Fondo de Pantalla</div><div class="wallpaper-grid">`;
      Object.entries(wallpapers).forEach(([key, value]) => {
        const selected = Desktop.user.wallpaper === key ? 'selected' : '';
        const names = {
          'default': 'Predeterminado', 'sunset': 'Atardecer', 'ocean': 'Océano',
          'forest': 'Bosque', 'aurora': 'Aurora', 'nebula': 'Nebulosa',
          'midnight': 'Medianoche', 'candy': 'Dulce', 'arctic': 'Ártico',
          'volcano': 'Volcán'
        };
        html += `<div class="wallpaper-option ${selected}" data-wp="${key}" style="background:${value};">${names[key] || key}</div>`;
      });
      html += '</div>';
      content.innerHTML = html;

      content.querySelectorAll('.wallpaper-option').forEach(opt => {
        opt.addEventListener('click', () => {
          Desktop.user.wallpaper = opt.dataset.wp;
          Desktop.applyWallpaper();
          Desktop.saveState();
          render();
        });
      });
    };

    const renderUserSettings = async (content) => {
      const data = await window.electronAPI.getUsers();
      let html = `<div class="settings-section-title">Gestión de Usuarios</div>`;

      data.users.forEach((user, idx) => {
        html += `
          <div class="settings-user-card">
            <div class="settings-user-avatar">${user.avatar}</div>
            <div class="settings-user-info">
              <div class="settings-user-name">${user.username}</div>
              <div style="opacity:0.5;font-size:11px;">Contraseña: ${user.password ? '••••' : '(sin contraseña)'}</div>
            </div>
            ${data.users.length > 1 ? `<button class="settings-btn danger" data-delete="${idx}">Eliminar</button>` : ''}
          </div>
        `;
      });

      html += `
        <div class="settings-user-section">
          <div style="font-weight:500;margin-bottom:8px;">Agregar Usuario</div>
          <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">
            <div>
              <div style="font-size:11px;opacity:0.5;margin-bottom:2px;">Nombre</div>
              <input class="settings-input" id="new-user-name" placeholder="usuario">
            </div>
            <div>
              <div style="font-size:11px;opacity:0.5;margin-bottom:2px;">Contraseña</div>
              <input class="settings-input" id="new-user-pass" type="password" placeholder="(opcional)">
            </div>
            <div>
              <div style="font-size:11px;opacity:0.5;margin-bottom:2px;">Avatar (emoji)</div>
              <input class="settings-input" id="new-user-avatar" placeholder="👤" style="width:60px;">
            </div>
            <button class="settings-btn" id="add-user-btn">Agregar</button>
          </div>
        </div>
      `;

      content.innerHTML = html;

      content.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const idx = parseInt(btn.dataset.delete);
          data.users.splice(idx, 1);
          await window.electronAPI.saveUsers(data);
          renderUserSettings(content);
        });
      });

      const addBtn = content.querySelector('#add-user-btn');
      if (addBtn) {
        addBtn.addEventListener('click', async () => {
          const name = content.querySelector('#new-user-name').value.trim();
          const pass = content.querySelector('#new-user-pass').value;
          const avatar = content.querySelector('#new-user-avatar').value.trim() || '👤';
          if (!name) return;
          if (data.users.some(u => u.username === name)) return;
          data.users.push({ username: name, password: pass, avatar, wallpaper: 'default' });
          await window.electronAPI.saveUsers(data);
          renderUserSettings(content);
        });
      }
    };

    const renderAbout = async (content) => {
      const info = await window.electronAPI.getSystemInfo();
      content.innerHTML = `
        <div class="settings-section-title">Acerca de este equipo</div>
        <div style="text-align:center;margin:20px 0;">
          <div style="font-size:50px;">🖥️</div>
          <div style="font-size:20px;font-weight:600;margin:8px 0;">SimulOS</div>
          <div style="opacity:0.5;">Versión 1.0.0</div>
        </div>
        <div style="max-width:400px;margin:0 auto;">
          <div class="device-item">
            <div class="device-name">Sistema Operativo</div>
            <div class="device-detail">${info.osInfo.distro} ${info.osInfo.release}</div>
          </div>
          <div class="device-item">
            <div class="device-name">Procesador</div>
            <div class="device-detail">${info.cpu.brand}</div>
          </div>
          <div class="device-item">
            <div class="device-name">Memoria</div>
            <div class="device-detail">${(info.mem.total / 1073741824).toFixed(0)} GB</div>
          </div>
          <div class="device-item">
            <div class="device-name">Gráficos</div>
            <div class="device-detail">${info.graphics.controllers.map(g => g.model).join(', ')}</div>
          </div>
          <div class="device-item">
            <div class="device-name">Hostname</div>
            <div class="device-detail">${info.osInfo.hostname}</div>
          </div>
        </div>
      `;
    };

    render();
  }
};
