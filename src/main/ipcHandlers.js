// ipcHandlers.js
const { ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
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

  // generic rename (kept for backward compatibility)
  ipcMain.handle('rename', async (_, oldPath, newPath) => {
    try {
      // protect against accidental overwrite: fail if destination exists
      try {
        await fs.access(newPath);
        return { success: false, error: 'Destination already exists' };
      } catch (e) {
        // dest doesn't exist -> ok to rename
      }

      await fs.rename(oldPath, newPath);

      // notify all renderers about rename
      broadcastFsEvent({ type: 'rename', oldPath, newPath });

      // cleanup watchers that were pointing into oldPath (they must be re-watched by renderer if needed)
      cleanupWatchersForPath(oldPath);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // --- NEW: rename-file (same as rename but explicit) ---
  ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
    try {
      try {
        await fs.access(newPath);
        return { success: false, error: 'Destination already exists' };
      } catch (e) {
        // destination does not exist
      }

      await fs.rename(oldPath, newPath);

      // notify caller and other windows
      event.sender.send('fs-event', { type: 'rename', oldPath, newPath });
      broadcastFsEvent({ type: 'rename', oldPath, newPath }, event.sender.id);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // --- NEW: rename-dir (explicit) ---
  ipcMain.handle('rename-dir', async (event, oldPath, newPath) => {
    try {
      try {
        await fs.access(newPath);
        return { success: false, error: 'Destination already exists' };
      } catch (e) {
        // destination does not exist
      }

      await fs.rename(oldPath, newPath);

      // Notify renderer(s)
      event.sender.send('fs-event', { type: 'rename', oldPath, newPath });
      broadcastFsEvent({ type: 'rename', oldPath, newPath }, event.sender.id);

      // cleanup watchers that point to oldPath (or subpaths)
      cleanupWatchersForPath(oldPath);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // --- NEW: delete-file ---
  ipcMain.handle('delete-file', async (event, filePath) => {
    try {
      await fs.unlink(filePath);

      // notify the caller and other windows
      event.sender.send('fs-event', { type: 'unlink', path: filePath });
      broadcastFsEvent({ type: 'unlink', path: filePath }, event.sender.id);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // --- NEW: delete-dir (recursive) ---
  ipcMain.handle('delete-dir', async (event, dirPath) => {
    try {
      // fs.rm with recursive & force (Node 14.14+). If not available, use custom rm logic.
      if (typeof fs.rm === 'function') {
        await fs.rm(dirPath, { recursive: true, force: true });
      } else {
        // fallback: use rmdir with recursive true (older node)
        await fs.rmdir(dirPath, { recursive: true });
      }

      // Close any watchers observing this dir or subpaths
      cleanupWatchersForPath(dirPath);

      // notify renderer(s)
      event.sender.send('fs-event', { type: 'unlinkDir', path: dirPath });
      broadcastFsEvent({ type: 'unlinkDir', path: dirPath }, event.sender.id);

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

  ipcMain.handle('run-command', async (_, command, cwd) => {
    return new Promise((resolve) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: error.message, stdout, stderr });
          return;
        }
        resolve({ success: true, stdout, stderr });
      });
    });
  });

  ipcMain.handle('search-in-files', async (_, { query, directory }) => {
    if (!query || !directory) return [];
    const results = [];
    const ignoreDirs = new Set(['.git', 'node_modules', 'dist', 'build']);
    const ignoreExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.pdf', '.zip', '.rar', '.exe', '.dll']);

    async function search(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !ignoreDirs.has(entry.name)) {
            await search(fullPath);
          } else if (entry.isFile() && !ignoreExts.has(path.extname(entry.name).toLowerCase())) {
            try {
              const content = await fs.readFile(fullPath, 'utf-8');
              const lines = content.split('\n');
              lines.forEach((line, index) => {
                if (line.toLowerCase().includes(query.toLowerCase())) {
                  results.push({
                    filePath: fullPath,
                    lineNumber: index + 1,
                    lineContent: line.trim(),
                  });
                }
              });
            } catch (e) {
              // Ignore file read errors (e.g. binary files)
            }
          }
        }
      } catch (e) {
        // Ignore directory read errors
      }
    }

    await search(directory);
    return results;
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

/**
 * Helper: broadcast fs events to all renderer processes (except optionally excludeId)
 */
function broadcastFsEvent(payload, excludeId = null) {
  try {
    const allWebContents = require('electron').webContents.getAllWebContents();
    allWebContents.forEach(wc => {
      if (excludeId && wc.id === excludeId) return;
      try {
        wc.send('fs-event', payload);
      } catch (e) {
        // ignore
      }
    });
  } catch (e) {
    // ignore if webContents not available for whatever reason
  }
}

/**
 * Helper: cleanup any watchers that reference a path (exact or children).
 * If a watchedDir === target OR watchedDir is inside target OR target is inside watchedDir -> remove watcher.
 */
function cleanupWatchersForPath(targetPath) {
  for (const [key, entry] of Array.from(watchers.entries())) {
    const [, watchedDir] = key.split('::');
    if (!watchedDir) continue;

    const normalizedWatched = path.resolve(watchedDir);
    const normalizedTarget = path.resolve(targetPath);

    // Conditions:
    // - watcher is exactly the target
    // - watcher is inside the target (watched startsWith target + sep)
    // - target is inside watcher (target startsWith watched + sep) -> also remove since structure changed
    if (
      normalizedWatched === normalizedTarget ||
      normalizedWatched.startsWith(normalizedTarget + path.sep) ||
      normalizedTarget.startsWith(normalizedWatched + path.sep)
    ) {
      try {
        entry.cleanup && entry.cleanup();
      } catch (e) {
        try { entry.watcher && entry.watcher.close(); } catch (ee) {}
      }
      watchers.delete(key);
    }
  }
}

module.exports = { setupIPCHandlers };
