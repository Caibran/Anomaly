// wait-for-react.js
const http = require('http');
const { exec } = require('child_process');

let attempts = 0;
const maxAttempts = 30;
const checkInterval = 1000; // 1 second

console.log('Waiting for React server to start...');

function checkServerStatus() {
  attempts++;
  
  http.get('http://localhost:3002', (res) => {
    if (res.statusCode === 200) {
      console.log('React server is ready! Starting Electron...');
      // Start Electron
      const electron = exec('npm run electron-start');
      
      electron.stdout.on('data', (data) => {
        console.log(`Electron: ${data}`);
      });
      
      electron.stderr.on('data', (data) => {
        console.error(`Electron error: ${data}`);
      });
      
      electron.on('close', (code) => {
        console.log(`Electron process exited with code ${code}`);
        process.exit(code);
      });
    } else {
      retry();
    }
  }).on('error', () => {
    retry();
  });
}

function retry() {
  if (attempts < maxAttempts) {
    console.log(`Waiting for React server (attempt ${attempts}/${maxAttempts})...`);
    setTimeout(checkServerStatus, checkInterval);
  } else {
    console.error('React server did not start in time. Giving up.');
    process.exit(1);
  }
}

checkServerStatus(); 