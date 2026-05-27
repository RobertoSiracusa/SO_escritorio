const LoginManager = {
  currentUser: null,

  async init() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    await this.showUserList();
    this.setupEvents();
  },

  updateClock() {
    const now = new Date();
    const timeEl = document.getElementById('login-time');
    const dateEl = document.getElementById('login-date');
    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('es-ES', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  },

  async showUserList() {
    const data = await window.electronAPI.getUsers();
    const list = document.getElementById('user-list');
    list.innerHTML = '';
    data.users.forEach(user => {
      const card = document.createElement('div');
      card.className = 'user-card';
      card.innerHTML = `
        <div class="avatar">${user.avatar}</div>
        <div class="username">${user.username}</div>
      `;
      card.addEventListener('click', () => this.selectUser(user));
      list.appendChild(card);
    });
  },

  selectUser(user) {
    document.getElementById('user-list').style.display = 'none';
    document.getElementById('login-form').style.display = 'flex';
    document.getElementById('login-avatar').textContent = user.avatar;
    document.getElementById('login-username').textContent = user.username;
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').textContent = '';
    this._selectedUser = user;

    if (!user.password) {
      this.doLogin(user);
    } else {
      document.getElementById('login-password').focus();
    }
  },

  doLogin(user) {
    this.currentUser = user;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('desktop').style.display = 'block';
    Desktop.init(user);
  },

  setupEvents() {
    document.getElementById('login-btn').addEventListener('click', () => {
      const pass = document.getElementById('login-password').value;
      if (this._selectedUser.password === pass) {
        this.doLogin(this._selectedUser);
      } else {
        document.getElementById('login-error').textContent = 'Contraseña incorrecta';
      }
    });

    document.getElementById('login-password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') document.getElementById('login-btn').click();
    });

    document.getElementById('login-back').addEventListener('click', () => {
      document.getElementById('user-list').style.display = 'flex';
      document.getElementById('login-form').style.display = 'none';
    });

    document.getElementById('shutdown-btn').addEventListener('click', () => {
      window.electronAPI.quitApp();
    });
  },

  async logout() {
    document.getElementById('desktop').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('user-list').style.display = 'flex';
    document.getElementById('login-form').style.display = 'none';
    wm.windows.forEach((_, id) => wm.closeWindow(id));
    this.currentUser = null;
    await this.showUserList();
  }
};

document.addEventListener('DOMContentLoaded', () => LoginManager.init());
