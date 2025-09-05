// ipcHandlers.js
const { ipcMain, dialog } = require('electron');
const { FileManager } = require('./fileManager');
const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');

const watchers = new Map(); // key = `${webContentsId}::${dirPath}`

function setupIPCHandlers() {
  ipcMain.handle('open-folder', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('read-dir', async (_, dirPath) => FileManager.readDir(dirPath));
  ipcMain.handle('read-file', async (_, filePath) => FileManager.readFile(filePath));
  ipcMain.handle('write-file', async (_, filePath, content) => FileManager.writeFile(filePath, content));

  ipcMain.handle('mkdir', async (_, dirPath) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-file', async (_, source, destination) => {
    try {
      await fs.copyFile(source, destination);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-dir', async (_, source, destination) => {
    try {
      await copyDirectory(source, destination);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('rename', async (_, oldPath, newPath) => {
    try {
      await fs.rename(oldPath, newPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // --- Watcher: per-folder, depth:0 (watch only immediate children) ---
  ipcMain.handle('watch-dir', (event, dirPath) => {
    if (!dirPath) return { success: false, error: 'No dirPath' };
    const wcId = event.sender.id;
    const key = `${wcId}::${dirPath}`;

    if (watchers.has(key)) return { success: true }; // déjà en place

    const watcher = chokidar.watch(dirPath, {
      ignoreInitial: true,
      persistent: true,
      depth: 0, // important — ne watcher que les enfants immédiats
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 10
      },
      ignored: ['**/node_modules/**', '**/.git/**'] // adapter si besoin
    });

    const sendEvent = (type, p) => {
      try {
        event.sender.send('fs-event', { type, path: p });
      } catch (err) {
        // webContents peut être fermé -> ignore
      }
    };

    watcher.on('add', p => sendEvent('add', p));
    watcher.on('addDir', p => sendEvent('addDir', p));
    watcher.on('unlink', p => sendEvent('unlink', p));
    watcher.on('unlinkDir', p => sendEvent('unlinkDir', p));
    watcher.on('change', p => sendEvent('change', p));
    watcher.on('error', err => sendEvent('error', { message: err.message }));

    const cleanup = () => {
      try { watcher.close(); } catch (e) {}
      watchers.delete(key);
    };
    // nettoyer si la fenêtre est détruite
    event.sender.once('destroyed', cleanup);

    watchers.set(key, { watcher, cleanup });
    return { success: true };
  });

  ipcMain.handle('unwatch-dir', async (event, dirPath) => {
    const wcId = event.sender.id;
    const key = `${wcId}::${dirPath}`;
    const entry = watchers.get(key);
    if (!entry) return { success: true };
    try {
      await entry.watcher.close();
    } catch (e) {}
    watchers.delete(key);
    return { success: true };
  });
}

// util copy dir
async function copyDirectory(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (let entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destPath);
    } else {
      await fs.copyFile(sourcePath, destPath);
    }
  }
}

module.exports = { setupIPCHandlers };
