const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Clean previous builds
console.log('Cleaning previous builds...');
try {
  // Delete dist directory if it exists
  if (fs.existsSync(path.join(__dirname, '..', 'dist'))) {
    fs.rmSync(path.join(__dirname, '..', 'dist'), { recursive: true, force: true });
  }
  
  // Delete release-builds directory if it exists
  if (fs.existsSync(path.join(__dirname, '..', 'release-builds'))) {
    fs.rmSync(path.join(__dirname, '..', 'release-builds'), { recursive: true, force: true });
  }
  
  // Delete standalone directory if it exists
  if (fs.existsSync(path.join(__dirname, '..', 'standalone'))) {
    fs.rmSync(path.join(__dirname, '..', 'standalone'), { recursive: true, force: true });
  }
} catch (err) {
  console.error('Error cleaning directories:', err);
}

// Create standalone directory structure
const standalonePath = path.join(__dirname, '..', 'standalone');
const resourcesPath = path.join(standalonePath, 'resources');
const appPath = path.join(resourcesPath, 'app');

console.log('Creating standalone package...');

// Create directories if they don't exist
if (!fs.existsSync(standalonePath)) {
  fs.mkdirSync(standalonePath, { recursive: true });
}

if (!fs.existsSync(resourcesPath)) {
  fs.mkdirSync(resourcesPath, { recursive: true });
}

if (!fs.existsSync(appPath)) {
  fs.mkdirSync(appPath, { recursive: true });
}

// Copy main application files
const filesToCopy = ['main.js', 'preload.js', '.env'];
filesToCopy.forEach(file => {
  if (fs.existsSync(path.join(__dirname, '..', file))) {
    console.log(`Copying ${file}...`);
    fs.copyFileSync(
      path.join(__dirname, '..', file),
      path.join(appPath, file)
    );
  }
});

// Copy launch.bat to standalone directory
if (fs.existsSync(path.join(__dirname, '..', 'launch.bat'))) {
  console.log('Copying launch.bat...');
  fs.copyFileSync(
    path.join(__dirname, '..', 'launch.bat'),
    path.join(standalonePath, 'launch.bat')
  );
}

// Copy build folder (React app)
console.log('Copying build folder...');
const buildDir = path.join(__dirname, '..', 'build');
const buildDestDir = path.join(appPath, 'build');

// Create build destination directory if it doesn't exist
if (!fs.existsSync(buildDestDir)) {
  fs.mkdirSync(buildDestDir, { recursive: true });
}

// Function to copy directory recursively
function copyDirRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Copy build folder recursively
copyDirRecursive(buildDir, buildDestDir);

// Create package.json for the standalone app
const packageJson = {
  name: "anomaly",
  version: "1.0.0",
  main: "main.js",
  private: true,
  dependencies: {
    "electron-is-dev": "^3.0.1",
    "electron-store": "^10.0.1",
    "marked": "^15.0.7",
    "showdown": "^2.1.0",
    "path-browserify": "^1.0.1"
  }
};

fs.writeFileSync(
  path.join(appPath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Copy node_modules that are needed
console.log('Copying required node_modules...');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const nodeModulesDestPath = path.join(appPath, 'node_modules');

// Create node_modules destination directory if it doesn't exist
if (!fs.existsSync(nodeModulesDestPath)) {
  fs.mkdirSync(nodeModulesDestPath, { recursive: true });
}

// Copy all required node_modules
const requiredModules = [
  'electron-is-dev',
  'electron-store',
  'marked',
  'showdown',
  'path-browserify'
];

requiredModules.forEach(moduleName => {
  const modulePath = path.join(nodeModulesPath, moduleName);
  const moduleDestPath = path.join(nodeModulesDestPath, moduleName);
  
  if (fs.existsSync(modulePath)) {
    if (!fs.existsSync(moduleDestPath)) {
      fs.mkdirSync(moduleDestPath, { recursive: true });
    }
    copyDirRecursive(modulePath, moduleDestPath);
    
    // Special handling for modules with dependencies
    const modulePackageJsonPath = path.join(modulePath, 'package.json');
    if (fs.existsSync(modulePackageJsonPath)) {
      try {
        const modulePackageJson = JSON.parse(fs.readFileSync(modulePackageJsonPath, 'utf8'));
        const dependencies = modulePackageJson.dependencies || {};
        
        Object.keys(dependencies).forEach(dep => {
          const depPath = path.join(nodeModulesPath, dep);
          const depDestPath = path.join(nodeModulesDestPath, dep);
          
          if (fs.existsSync(depPath) && !fs.existsSync(depDestPath)) {
            console.log(`Copying dependency: ${dep}`);
            fs.mkdirSync(depDestPath, { recursive: true });
            copyDirRecursive(depPath, depDestPath);
          }
        });
      } catch (err) {
        console.error(`Error processing dependencies for ${moduleName}:`, err);
      }
    }
  } else {
    console.warn(`Module not found: ${moduleName}`);
  }
});

// Create a README file with instructions
const readmeContent = `# Anomaly - Markdown Editor

## How to Run
1. Double-click on "launch.bat" to start the application
2. Alternatively, you can directly run "Anomaly.exe"

## Notes
- This is a portable application; no installation is needed
- All files and folders in this directory are required to run the application
`;

fs.writeFileSync(
  path.join(standalonePath, 'README.txt'),
  readmeContent
);

// Execute electron-packager to create the executable
console.log('Creating executable with electron-packager...');
const electronPackagerCmd = `npx electron-packager . Anomaly --platform=win32 --arch=x64 --out=release-builds --overwrite --prune=true --asar --ignore=node_modules/.bin|node_modules/electron|node_modules/electron-builder`;

// Use the exec function to run the command
exec(electronPackagerCmd, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing electron-packager: ${error}`);
    console.log("Attempting to proceed with partial build...");
  }
  
  console.log(`electron-packager output: ${stdout}`);
  
  if (stderr) {
    console.error(`electron-packager stderr: ${stderr}`);
  }
  
  // Copy the executable files to the standalone directory
  console.log('Copying electron executable files to standalone directory...');
  const electronExePath = path.join(__dirname, '..', 'release-builds', 'Anomaly-win32-x64');
  
  if (fs.existsSync(electronExePath)) {
    // Get all files in the electron package root directory
    const files = fs.readdirSync(electronExePath);
    
    files.forEach(file => {
      const filePath = path.join(electronExePath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory() && file !== 'resources') {
        // Copy entire directory (like locales)
        const destDir = path.join(standalonePath, file);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        copyDirRecursive(filePath, destDir);
      } else if (stats.isFile()) {
        // Copy the file
        fs.copyFileSync(filePath, path.join(standalonePath, file));
      }
    });
    
    // Also copy resources (if we're using asar packaging)
    const resourcesSrcPath = path.join(electronExePath, 'resources');
    if (fs.existsSync(resourcesSrcPath)) {
      const resourcesDestPath = path.join(standalonePath, 'resources');
      if (!fs.existsSync(resourcesDestPath)) {
        fs.mkdirSync(resourcesDestPath, { recursive: true });
      }
      copyDirRecursive(resourcesSrcPath, resourcesDestPath);
    }
    
    console.log('Standalone application created successfully!');
    console.log(`Standalone directory: ${standalonePath}`);
    console.log('You can distribute this folder as a portable application.');
  } else {
    console.error('Electron executable directory not found!');
    console.log('You may need to manually create the executable using:');
    console.log('npx electron-packager . Anomaly --platform=win32 --arch=x64 --out=release-builds --overwrite --prune=true --asar');
  }
}); 