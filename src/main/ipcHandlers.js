const { ipcMain, dialog } = require('electron');
const { FileManager } = require('./fileManager');

function setupIPCHandlers() {
  ipcMain.handle('open-folder', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('read-dir', async (_, dirPath) => FileManager.readDir(dirPath));
  ipcMain.handle('read-file', async (_, filePath) => FileManager.readFile(filePath));
  ipcMain.handle('write-file', async (_, filePath, content) => FileManager.writeFile(filePath, content));
}

module.exports = { setupIPCHandlers };
