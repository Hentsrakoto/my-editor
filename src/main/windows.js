const { BrowserWindow } = require('electron');
const path = require('path');

class AppWindow {
  constructor(isDev) {
    this.isDev = isDev;
    this.win = null;
  }

  create() {
    this.win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    if (this.isDev) {
      this.win.loadURL('http://localhost:5173');
      this.win.webContents.openDevTools();
    } else {
      this.win.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    return this.win;
  }
}

module.exports = { AppWindow };
