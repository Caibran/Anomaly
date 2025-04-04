const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

// Initialize environment
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
app.allowRendererProcessReuse = true;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    backgroundColor: '#1e1e1e', // Dark background color
  });

  // Load the app 
  if (isDev) {
    console.log('Running in development mode');
    mainWindow.loadURL('http://localhost:3002');
  } else {
    // Production - load built files with a proper file URL format
    const indexPath = path.join(__dirname, 'build', 'index.html');
    const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;
    console.log('Loading URL:', fileUrl);
    mainWindow.loadURL(fileUrl);
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create the application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Create New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('create-new-file');
          }
        },
        { type: 'separator' },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory']
            });
            if (result.filePaths.length > 0) {
              mainWindow.webContents.send('open-directory', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Add event listeners for IPC events
ipcMain.on('open-directory-dialog', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.filePaths.length > 0) {
    mainWindow.webContents.send('open-directory', result.filePaths[0]);
  }
});

ipcMain.on('create-new-file-request', (event, targetDir) => {
  mainWindow.webContents.send('create-new-file-request', targetDir);
});

// Delete a directory recursively
function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive
        deleteFolderRecursive(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

// Normalize paths to handle Windows backslashes correctly
function normalizePath(filePath) {
  // Convert Windows backslashes to forward slashes for consistent path handling
  return filePath.replace(/\\/g, '/');
}

// Helper function to get all files in a directory recursively
function getAllFilesInDirectory(dirPath, allFiles = [], depth = 0) {
  // Limit recursion depth to prevent excessive traversal
  const MAX_DEPTH = 2;
  
  if (!dirPath || dirPath === '' || !fs.existsSync(dirPath) || depth > MAX_DEPTH) {
    return allFiles;
  }

  try {
    const normalizedDirPath = normalizePath(dirPath);
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dirPath, entry.name);
      const normalizedFullPath = normalizePath(fullPath);
      
      try {
        const stats = fs.statSync(fullPath);
        
        if (entry.isDirectory()) {
          // Add this directory to our results
          allFiles.push({
            name: entry.name,
            isDirectory: true,
            path: normalizedFullPath,
            extension: null,
            lastModified: stats.mtime.getTime(),
            size: stats.size,
            children: [] // Add a children array to hold subdirectory contents
          });
          
          // Recursively get subdirectory contents if not at max depth
          if (depth < MAX_DEPTH) {
            const subFiles = getAllFilesInDirectory(fullPath, [], depth + 1);
            // Store the subdirectory's contents in the children array
            const dirIndex = allFiles.findIndex(item => item.path === normalizedFullPath);
            if (dirIndex !== -1) {
              allFiles[dirIndex].children = subFiles;
            }
          }
        } else {
          // Add the file
          allFiles.push({
            name: entry.name,
            isDirectory: false,
            path: normalizedFullPath,
            extension: path.extname(entry.name),
            lastModified: stats.mtime.getTime(),
            size: stats.size
          });
        }
      } catch (err) {
        console.error(`Error processing ${fullPath}:`, err);
      }
    });
    
    return allFiles;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return allFiles;
  }
}

// File system operations
ipcMain.handle('open-directory-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.filePaths[0];
  } catch (error) {
    console.error('Error opening directory dialog:', error);
    return null;
  }
});

ipcMain.handle('read-directory', async (event, directoryPath) => {
  try {
    if (!directoryPath || directoryPath === '' || !fs.existsSync(directoryPath)) {
      console.error(`Directory does not exist or is empty: ${directoryPath}`);
      return [];
    }

    console.log(`Reading directory: ${directoryPath}`);
    
    // Use our recursive function to get all files and folders
    const allFiles = getAllFilesInDirectory(directoryPath, []);
    console.log(`Found ${allFiles.length} files and folders in ${directoryPath}`);
    
    return allFiles;
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    console.log(`Reading file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    return '';
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    if (!filePath) {
      throw new Error('No file path provided');
    }
    
    console.log(`Writing to file: ${filePath}`);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
});

ipcMain.handle('create-new-file', async (event, directoryPath, fileName) => {
  try {
    if (!directoryPath) {
      throw new Error('No directory selected');
    }
    
    if (!fs.existsSync(directoryPath)) {
      throw new Error(`Directory does not exist: ${directoryPath}`);
    }
    
    const filePath = path.join(directoryPath, fileName);
    const normalizedPath = normalizePath(filePath);
    console.log(`Creating new file: ${filePath}`);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      throw new Error('File already exists');
    }
    
    // Create empty file
    fs.writeFileSync(filePath, '', 'utf8');
    
    return {
      success: true,
      filePath: normalizedPath
    };
  } catch (error) {
    console.error('Error creating new file:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Create a new folder
ipcMain.handle('create-folder', async (event, parentPath, folderName) => {
  try {
    if (!parentPath) {
      throw new Error('No parent directory specified');
    }
    
    if (!fs.existsSync(parentPath)) {
      throw new Error(`Parent directory does not exist: ${parentPath}`);
    }
    
    const newFolderPath = path.join(parentPath, folderName);
    const normalizedPath = normalizePath(newFolderPath);
    console.log(`Creating new folder: ${newFolderPath}`);
    
    // Check if folder already exists
    if (fs.existsSync(newFolderPath)) {
      throw new Error('Folder already exists');
    }
    
    // Create the folder
    fs.mkdirSync(newFolderPath);
    
    return {
      success: true,
      folderPath: normalizedPath
    };
  } catch (error) {
    console.error('Error creating folder:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Delete a file
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    if (!filePath) {
      throw new Error('No file path provided');
    }
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    console.log(`Deleting file: ${filePath}`);
    fs.unlinkSync(filePath);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Delete a folder and all its contents
ipcMain.handle('delete-folder', async (event, folderPath) => {
  try {
    if (!folderPath) {
      throw new Error('No folder path provided');
    }
    
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder does not exist: ${folderPath}`);
    }
    
    console.log(`Deleting folder: ${folderPath}`);
    deleteFolderRecursive(folderPath);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting folder:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Add a new handler to read a specific directory
ipcMain.handle('read-subdirectory', async (event, directoryPath) => {
  try {
    if (!directoryPath || directoryPath === '' || !fs.existsSync(directoryPath)) {
      console.error(`Subdirectory does not exist or is empty: ${directoryPath}`);
      return [];
    }
    
    console.log(`Reading subdirectory: ${directoryPath}`);
    const files = [];
    
    const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(directoryPath, entry.name);
      const normalizedFullPath = normalizePath(fullPath);
      
      try {
        const stats = fs.statSync(fullPath);
        
        files.push({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          path: normalizedFullPath,
          extension: entry.isDirectory() ? null : path.extname(entry.name),
          lastModified: stats.mtime.getTime(),
          size: stats.size
        });
      } catch (err) {
        console.error(`Error processing ${fullPath}:`, err);
      }
    });
    
    return files;
  } catch (error) {
    console.error('Error reading subdirectory:', error);
    return [];
  }
}); 