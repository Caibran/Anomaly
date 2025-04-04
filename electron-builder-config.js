/**
 * Electron Builder Configuration
 * This file contains the configuration for building the Electron app
 */
module.exports = {
  appId: 'com.anomaly.editor',
  productName: 'Anomaly Editor',
  copyright: `Copyright © ${new Date().getFullYear()}`,
  
  // Files to include in the build
  files: [
    'build/**/*',
    'standalone-main.js',
    'preload.js',
    'node_modules/**/*'
  ],
  
  // Directories configuration
  directories: {
    buildResources: 'assets',
    output: 'dist'
  },
  
  // Windows build configuration
  win: {
    target: [
      {
        target: 'portable',
        arch: ['x64']
      },
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: 'assets/icon.ico',
    // Ensure the app is properly signed if you have a certificate
    // certificateFile: 'path/to/certificate.pfx',
    // certificatePassword: process.env.CERTIFICATE_PASSWORD
  },
  
  // NSIS installer configuration (for Windows)
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Anomaly Editor',
    uninstallDisplayName: 'Anomaly Editor',
    artifactName: 'AnomalyEditor-Setup-${version}.${ext}'
  },
  
  // Portable configuration
  portable: {
    artifactName: 'AnomalyEditor-Portable-${version}.${ext}'
  },
  
  // Prevent including unnecessary files
  extraResources: [
    {
      from: 'assets',
      to: 'assets',
      filter: ['**/*']
    }
  ],
  
  // Compression settings
  compression: 'maximum',
  
  // Asar configuration (for packaging app files)
  asar: true,
  
  // Include all files from node_modules that are needed
  extraMetadata: {
    main: 'standalone-main.js'
  }
}; 