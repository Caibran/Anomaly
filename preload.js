const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    // Methods needed for IPC communication
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, callback) => {
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
    },
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    // Invoke methods
    openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
    readDirectory: (directoryPath) => ipcRenderer.invoke('read-directory', directoryPath),
    readSubdirectory: (directoryPath) => ipcRenderer.invoke('read-subdirectory', directoryPath),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
    createNewFile: (directoryPath, fileName) => ipcRenderer.invoke('create-new-file', directoryPath, fileName),
    createFolder: (parentPath, folderName) => ipcRenderer.invoke('create-folder', parentPath, folderName),
    deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
    deleteFolder: (folderPath) => ipcRenderer.invoke('delete-folder', folderPath),
  }
}); 