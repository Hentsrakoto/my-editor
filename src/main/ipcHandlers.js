const { ipcMain, dialog } = require('electron');
const { FileManager } = require('./fileManager');
const fs = require('fs').promises;
const path = require('path');

function setupIPCHandlers() {
  ipcMain.handle('open-folder', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('read-dir', async (_, dirPath) => FileManager.readDir(dirPath));
  ipcMain.handle('read-file', async (_, filePath) => FileManager.readFile(filePath));
  ipcMain.handle('write-file', async (_, filePath, content) => FileManager.writeFile(filePath, content));
  
  // Nouveaux gestionnaires pour les fonctionnalités ajoutées
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
}

// Fonction utilitaire pour copier un répertoire récursivement
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