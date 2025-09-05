const { app } = require('electron');
const { AppWindow } = require('./windows');
const { setupIPCHandlers } = require('./ipcHandlers');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

app.whenReady().then(() => {
  setupIPCHandlers();          // installe les IPC
  mainWindow = new AppWindow(isDev).create();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
