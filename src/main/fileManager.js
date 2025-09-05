const fs = require('fs').promises;
const path = require('path');

class FileManager {
  static async readFile(filePath) {
    // Ici tu peux sécuriser le chemin
    return fs.readFile(filePath, 'utf-8');
  }

  static async writeFile(filePath, content) {
    return fs.writeFile(filePath, content, 'utf-8');
  }

  static async readDir(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.map(e => ({ name: e.name, isDir: e.isDirectory() }));
  }
}

module.exports = { FileManager };
