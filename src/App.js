import React, { useState, useEffect, useCallback } from 'react';
import Editor from './components/Editor';
import FileExplorer from './components/FileExplorer';
import Preview from './components/Preview';
// Import styles if needed
// import './App.css';

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [currentContent, setCurrentContent] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [targetFolder, setTargetFolder] = useState('');
  const [fileTree, setFileTree] = useState([]);
  const [currentDirectory, setCurrentDirectory] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Load current directory from electron store if available
  useEffect(() => {
    window.electron.ipcRenderer.on('open-directory', (directory) => {
      handleOpenDirectory(directory);
    });

    window.electron.ipcRenderer.on('create-new-file', () => {
      handleCreateNewFile();
    });
    
    window.electron.ipcRenderer.on('create-new-file-request', (targetDir) => {
      handleCreateNewFileRequest(targetDir);
    });

    return () => {
      window.electron.ipcRenderer.removeAllListeners('open-directory');
      window.electron.ipcRenderer.removeAllListeners('create-new-file');
      window.electron.ipcRenderer.removeAllListeners('create-new-file-request');
    };
  }, []);

  const handleOpenDirectory = async (directory) => {
    try {
      let selectedDirectory = directory;
      
      if (!selectedDirectory) {
        selectedDirectory = await window.electron.ipcRenderer.openDirectoryDialog();
        if (!selectedDirectory) return;
      }
      
      // Reset current file when changing directory
      setCurrentFile(null);
      setCurrentContent('');
      
      // Set the current directory
      setCurrentDirectory(selectedDirectory);
      setFileTree([]);
      
      // Initial loading of the file tree
      setIsLoading(true);
      try {
        const files = await window.electron.ipcRenderer.readDirectory(selectedDirectory);
        setFileTree(files);
      } catch (err) {
        console.error('Failed to read directory:', err);
        setError('Failed to read directory');
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error opening directory:", error);
      setError("Failed to open directory");
    }
  };

  // Memoize the refreshFileTree function to prevent infinite loops
  const refreshFileTree = useCallback(async (directory) => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setIsLoading(true);
    try {
      const files = await window.electron.ipcRenderer.readDirectory(directory || currentDirectory);
      setFileTree(files);
    } catch (err) {
      console.error('Failed to read directory:', err);
      setError('Failed to read directory');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentDirectory, isRefreshing]);

  const handleFileSelect = async (file) => {
    if (file && !file.isDirectory) {
      // If there are unsaved changes, ask for confirmation
      if (!isSaved) {
        const confirm = window.confirm('You have unsaved changes. Do you want to continue without saving?');
        if (!confirm) return;
      }
      
      setIsLoading(true);
      try {
        const content = await window.electron.ipcRenderer.readFile(file.path);
        setCurrentFile(file);
        setCurrentContent(content);
        setIsSaved(true);
      } catch (err) {
        console.error('Failed to read file:', err);
        setError('Failed to read file');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleContentChange = (newContent) => {
    setCurrentContent(newContent);
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (!currentFile) return;
    
    setIsLoading(true);
    try {
      await window.electron.ipcRenderer.writeFile(currentFile.path, currentContent);
      setIsSaved(true);
    } catch (err) {
      console.error('Failed to save file:', err);
      setError('Failed to save file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewFile = () => {
    // Set target folder to current directory
    setTargetFolder(currentDirectory);
    setShowNewFileDialog(true);
    setNewFileName('');
  };

  const handleCreateNewFileRequest = (targetDir) => {
    // Set target folder to requested directory
    // Ensure targetDir is a string
    const safeTargetDir = typeof targetDir === 'string' ? targetDir : currentDirectory;
    setTargetFolder(safeTargetDir);
    setShowNewFileDialog(true);
    setNewFileName('');
  };

  const handleCreateNewFileSubmit = async () => {
    if (!newFileName) return;
    
    // Make sure filename has .md extension
    const fileName = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
    const targetDir = targetFolder || currentDirectory;
    
    try {
      const result = await window.electron.ipcRenderer.createNewFile(targetDir, fileName);
      
      if (result.success) {
        await refreshFileTree(currentDirectory);
        setShowNewFileDialog(false);
        
        // Open the newly created file
        const newFile = {
          path: result.filePath,
          name: fileName,
          isDirectory: false,
          extension: '.md'
        };
        
        handleFileSelect(newFile);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Failed to create file:', err);
      setError('Failed to create file');
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <FileExplorer 
        currentDirectory={currentDirectory}
        fileTree={fileTree}
        selectedFile={currentFile}
        onFileSelect={handleFileSelect}
        onRefresh={() => refreshFileTree(currentDirectory)}
        onOpenDirectory={() => handleOpenDirectory()}
        onCreateNewFile={handleCreateNewFileRequest}
      />
      
      <div style={{
        flex: 1,
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {!currentFile ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: '#252526'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '400', marginBottom: '16px' }}>Welcome to Anomaly</h2>
            <p style={{ fontSize: '16px', color: '#a0a0a0', marginBottom: '24px' }}>Open a folder and select a file to edit or create a new file.</p>
            {!currentDirectory && (
              <button 
                onClick={handleOpenDirectory}
                style={{
                  backgroundColor: '#0e639c',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Open Folder
              </button>
            )}
            {currentDirectory && (
              <button 
                onClick={handleCreateNewFile}
                style={{
                  backgroundColor: '#0e639c',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Create New File
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '50%',
              height: '100%',
              borderRight: '1px solid #333',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: '#252526',
                borderBottom: '1px solid #333'
              }}>
                <span style={{ fontSize: '13px', color: '#cccccc' }}>
                  {currentFile?.name} {!isSaved && '*'}
                </span>
                <button 
                  onClick={handleSave}
                  disabled={isSaved}
                  style={{
                    backgroundColor: isSaved ? '#333' : '#0e639c',
                    color: isSaved ? '#777' : 'white',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    cursor: isSaved ? 'not-allowed' : 'pointer'
                  }}
                >
                  Save
                </button>
              </div>
              <Editor content={currentContent} onChange={handleContentChange} />
            </div>
            <Preview markdown={currentContent} />
          </>
        )}
        
        {showNewFileDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#252526',
              borderRadius: '4px',
              width: '400px',
              boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '500',
                padding: '16px',
                borderBottom: '1px solid #333'
              }}>
                Create New File in {typeof targetFolder === 'string' ? targetFolder.split('/').pop() : 'Current Directory'}
              </h2>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="filename.md"
                autoFocus
                style={{
                  margin: '16px',
                  padding: '8px',
                  backgroundColor: '#1e1e1e',
                  color: '#eee',
                  border: '1px solid #444',
                  borderRadius: '3px',
                  outline: 'none'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '12px 16px',
                borderTop: '1px solid #333',
                gap: '8px'
              }}>
                <button 
                  onClick={() => setShowNewFileDialog(false)}
                  style={{
                    backgroundColor: '#3a3a3a',
                    color: '#eee',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateNewFileSubmit}
                  style={{
                    backgroundColor: '#0e639c',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#f14c4c',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            zIndex: 1100
          }}>
            {error}
            <button 
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 