// preload.js
const { contextBridge, ipcRenderer } = require('electron');

const fsListeners = new Map(); // map(callback -> wrapper)

contextBridge.exposeInMainWorld('api', {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  readDir: (dirPath) => ipcRenderer.invoke('read-dir', dirPath),

  mkdir: (dirPath) => ipcRenderer.invoke('mkdir', dirPath),
  copyFile: (source, destination) => ipcRenderer.invoke('copy-file', source, destination),
  copyDir: (source, destination) => ipcRenderer.invoke('copy-dir', source, destination),
  rename: (oldPath, newPath) => ipcRenderer.invoke('rename', oldPath, newPath),

  // 🔥 ajout pour suppression
  unlink: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  unlinkDir: (dirPath) => ipcRenderer.invoke('delete-dir', dirPath),

  // Watcher API
  watchDir: (dirPath) => ipcRenderer.invoke('watch-dir', dirPath),
  unwatchDir: (dirPath) => ipcRenderer.invoke('unwatch-dir', dirPath),

  // Events: onFsEvent / offFsEvent
  onFsEvent: (callback) => {
    if (typeof callback !== 'function') return;
    const wrapper = (_, data) => callback(data);
    fsListeners.set(callback, wrapper);
    ipcRenderer.on('fs-event', wrapper);
  },
  offFsEvent: (callback) => {
    const wrapper = fsListeners.get(callback);
    if (wrapper) {
      ipcRenderer.removeListener('fs-event', wrapper);
      fsListeners.delete(callback);
    }
  },

  runCommand: (cmd, cwd) => ipcRenderer.invoke('run-command', cmd, cwd)
});
