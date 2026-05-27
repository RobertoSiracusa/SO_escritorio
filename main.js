const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const si = require('systeminformation');
const fs = require('fs');

let mainWindow;

const USER_DATA_PATH = path.join(app.getPath('userData'), 'simulos_data');
const USERS_FILE = path.join(USER_DATA_PATH, 'users.json');
const FS_ROOT = path.join(USER_DATA_PATH, 'filesystem');

function ensureDataDirs() {
  if (!fs.existsSync(USER_DATA_PATH)) fs.mkdirSync(USER_DATA_PATH, { recursive: true });
  if (!fs.existsSync(FS_ROOT)) fs.mkdirSync(FS_ROOT, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({
      users: [
        { username: 'admin', password: 'admin', avatar: '👤', wallpaper: 'default' },
        { username: 'guest', password: '', avatar: '👻', wallpaper: 'default' }
      ],
      lastUser: 'admin'
    }));
  }
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    }
  });
  mainWindow.loadFile('src/index.html');
  mainWindow.setFullScreen(true);
}

app.whenReady().then(() => {
  ensureDataDirs();
  createWindow();
});

app.on('window-all-closed', () => app.quit());

// System info IPC handlers
ipcMain.handle('get-system-info', async () => {
  const [cpu, mem, graphics, osInfo, diskLayout, battery, networkInterfaces, blockDevices, usb] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.graphics(),
    si.osInfo(),
    si.diskLayout(),
    si.battery(),
    si.networkInterfaces(),
    si.blockDevices(),
    si.usb()
  ]);
  return { cpu, mem, graphics, osInfo, diskLayout, battery, networkInterfaces, blockDevices, usb };
});

ipcMain.handle('get-cpu-usage', async () => {
  const load = await si.currentLoad();
  return load;
});

ipcMain.handle('get-mem-usage', async () => {
  return await si.mem();
});

ipcMain.handle('get-processes', async () => {
  const procs = await si.processes();
  return procs;
});

ipcMain.handle('get-input-devices', async () => {
  return new Promise((resolve) => {
    exec('xinput list 2>/dev/null || echo "N/A"', (err, stdout) => {
      resolve(stdout || 'No input devices detected');
    });
  });
});

ipcMain.handle('get-output-devices', async () => {
  const [audio, graphics, printers] = await Promise.all([
    new Promise(res => exec('pactl list sinks short 2>/dev/null || echo "N/A"', (e, o) => res(o))),
    si.graphics(),
    new Promise(res => exec('lpstat -p 2>/dev/null || echo "No printers"', (e, o) => res(o)))
  ]);
  return { audio, graphics, printers };
});

// User management
ipcMain.handle('get-users', () => {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
});

ipcMain.handle('save-users', (event, data) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data));
  return true;
});

// Virtual filesystem
ipcMain.handle('fs-read-dir', (event, dirPath) => {
  const fullPath = path.join(FS_ROOT, dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    return [];
  }
  const items = fs.readdirSync(fullPath, { withFileTypes: true });
  return items.map(item => ({
    name: item.name,
    isDirectory: item.isDirectory(),
    path: path.join(dirPath, item.name),
    size: item.isDirectory() ? 0 : fs.statSync(path.join(fullPath, item.name)).size,
    modified: fs.statSync(path.join(fullPath, item.name)).mtime
  }));
});

ipcMain.handle('fs-create-dir', (event, dirPath) => {
  const fullPath = path.join(FS_ROOT, dirPath);
  fs.mkdirSync(fullPath, { recursive: true });
  return true;
});

ipcMain.handle('fs-read-file', (event, filePath) => {
  const fullPath = path.join(FS_ROOT, filePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
});

ipcMain.handle('fs-write-file', (event, filePath, content) => {
  const fullPath = path.join(FS_ROOT, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
  return true;
});

ipcMain.handle('fs-read-file-binary', (event, filePath) => {
  const fullPath = path.join(FS_ROOT, filePath);
  if (!fs.existsSync(fullPath)) return null;
  const buffer = fs.readFileSync(fullPath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.bmp': 'image/bmp', '.webp': 'image/webp',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'video/ogg',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
    '.pdf': 'application/pdf'
  };
  const mime = mimeTypes[ext] || 'application/octet-stream';
  return `data:${mime};base64,${buffer.toString('base64')}`;
});

ipcMain.handle('fs-delete', (event, itemPath) => {
  const fullPath = path.join(FS_ROOT, itemPath);
  if (!fs.existsSync(fullPath)) return false;
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    fs.rmSync(fullPath, { recursive: true });
  } else {
    fs.unlinkSync(fullPath);
  }
  return true;
});

ipcMain.handle('fs-copy-real-file', (event, realPath, destPath) => {
  const fullDest = path.join(FS_ROOT, destPath);
  const dir = path.dirname(fullDest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(realPath, fullDest);
  return true;
});

ipcMain.handle('fs-get-root', () => FS_ROOT);

ipcMain.handle('get-real-path', (event, virtualPath) => {
  return path.join(FS_ROOT, virtualPath);
});

// Desktop state persistence
ipcMain.handle('load-desktop-state', (event, username) => {
  const file = path.join(USER_DATA_PATH, `desktop_${username}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
});

ipcMain.handle('save-desktop-state', (event, username, state) => {
  const file = path.join(USER_DATA_PATH, `desktop_${username}.json`);
  fs.writeFileSync(file, JSON.stringify(state));
  return true;
});

ipcMain.handle('quit-app', () => {
  app.quit();
});
