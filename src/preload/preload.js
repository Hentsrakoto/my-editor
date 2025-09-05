// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  readDir: (dirPath) => ipcRenderer.invoke('read-dir', dirPath),

  // Opérations de fichiers/dossiers
  mkdir: (dirPath) => ipcRenderer.invoke('mkdir', dirPath),
  copyFile: (source, destination) => ipcRenderer.invoke('copy-file', source, destination),
  copyDir: (source, destination) => ipcRenderer.invoke('copy-dir', source, destination),
  rename: (oldPath, newPath) => ipcRenderer.invoke('rename', oldPath, newPath),
});
