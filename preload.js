const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getCpuUsage: () => ipcRenderer.invoke('get-cpu-usage'),
  getMemUsage: () => ipcRenderer.invoke('get-mem-usage'),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  getInputDevices: () => ipcRenderer.invoke('get-input-devices'),
  getOutputDevices: () => ipcRenderer.invoke('get-output-devices'),
  getUsers: () => ipcRenderer.invoke('get-users'),
  saveUsers: (data) => ipcRenderer.invoke('save-users', data),
  fsReadDir: (path) => ipcRenderer.invoke('fs-read-dir', path),
  fsCreateDir: (path) => ipcRenderer.invoke('fs-create-dir', path),
  fsReadFile: (path) => ipcRenderer.invoke('fs-read-file', path),
  fsWriteFile: (path, content) => ipcRenderer.invoke('fs-write-file', path, content),
  fsReadFileBinary: (path) => ipcRenderer.invoke('fs-read-file-binary', path),
  fsDelete: (path) => ipcRenderer.invoke('fs-delete', path),
  fsCopyRealFile: (realPath, destPath) => ipcRenderer.invoke('fs-copy-real-file', realPath, destPath),
  fsGetRoot: () => ipcRenderer.invoke('fs-get-root'),
  getRealPath: (virtualPath) => ipcRenderer.invoke('get-real-path', virtualPath),
  loadDesktopState: (username) => ipcRenderer.invoke('load-desktop-state', username),
  saveDesktopState: (username, state) => ipcRenderer.invoke('save-desktop-state', username, state),
  quitApp: () => ipcRenderer.invoke('quit-app')
});
