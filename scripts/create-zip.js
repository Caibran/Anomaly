const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const appName = 'Anomaly';
const version = '1.0.0';
const sourceDir = path.join(__dirname, '..', 'dist', `${appName}-win32-x64`);
const outputFile = path.join(__dirname, '..', 'dist', `${appName}-${version}-portable.zip`);

// Check if source directory exists
if (!fs.existsSync(sourceDir)) {
  console.error(`Error: Source directory ${sourceDir} does not exist.`);
  console.log('Please run "npm run package-simple" first to create the application package.');
  process.exit(1);
}

console.log(`Creating zip archive of ${appName} v${version}...`);
console.log(`Source: ${sourceDir}`);
console.log(`Output: ${outputFile}`);

// Create zip file using PowerShell (for Windows)
const powershellCmd = `
  If(Test-Path "${outputFile}") {
    Remove-Item "${outputFile}"
  }
  Add-Type -Assembly System.IO.Compression.FileSystem;
  [System.IO.Compression.ZipFile]::CreateFromDirectory("${sourceDir.replace(/\\/g, '\\\\')}", "${outputFile.replace(/\\/g, '\\\\')}");
`;

console.log('Running PowerShell command to create zip...');
exec(`powershell -Command "${powershellCmd}"`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Error: ${stderr}`);
    return;
  }
  
  console.log(`Successfully created ${outputFile}`);
  console.log('You can now distribute this zip file as a portable application.');
}); 