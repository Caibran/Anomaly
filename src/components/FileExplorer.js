import React, { useState, useEffect } from 'react';

const FileExplorer = ({ currentDirectory, onFileSelect, selectedFile, fileTree, onRefresh, onOpenDirectory, onCreateNewFile }) => {
  const [expandedDirs, setExpandedDirs] = useState({});
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  
  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0, item: null });
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Auto-refresh when directory changes - but only once
  useEffect(() => {
    if (currentDirectory && fileTree.length === 0) {
      onRefresh();
    }
  }, [currentDirectory, fileTree.length, onRefresh]);
  
  const getFileIcon = (file) => {
    if (file.isDirectory) {
      return expandedDirs[file.path] ? '📂' : '📁';
    } else if (file.extension === '.md') {
      return '📝';
    } else {
      return '📄';
    }
  };

  const handleItemClick = async (item) => {
    if (item.isDirectory) {
      // Toggle folder expansion
      setExpandedDirs(prev => ({
        ...prev,
        [item.path]: !prev[item.path]
      }));
    } else {
      onFileSelect(item);
    }
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      item: item
    });
  };

  const handleCreateNewFile = (parentDir) => {
    setContextMenu({ visible: false, x: 0, y: 0, item: null });
    // Use a string path to avoid object clone error
    onCreateNewFile(parentDir);
  };

  const handleCreateNewFolder = (parentDir) => {
    setContextMenu({ visible: false, x: 0, y: 0, item: null });
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      window.electron.ipcRenderer.createFolder(parentDir, folderName)
        .then(result => {
          if (result.success) {
            onRefresh();
          } else {
            alert(`Failed to create folder: ${result.error}`);
          }
        })
        .catch(err => {
          alert(`Error creating folder: ${err.message}`);
        });
    }
  };

  const handleDeleteItem = (item) => {
    setContextMenu({ visible: false, x: 0, y: 0, item: null });
    const confirmDelete = window.confirm(`Are you sure you want to delete ${item.name}?`);
    if (confirmDelete) {
      if (item.isDirectory) {
        window.electron.ipcRenderer.deleteFolder(item.path)
          .then(result => {
            if (result.success) {
              onRefresh();
            } else {
              alert(`Failed to delete folder: ${result.error}`);
            }
          })
          .catch(err => {
            alert(`Error deleting folder: ${err.message}`);
          });
      } else {
        window.electron.ipcRenderer.deleteFile(item.path)
          .then(result => {
            if (result.success) {
              onRefresh();
            } else {
              alert(`Failed to delete file: ${result.error}`);
            }
          })
          .catch(err => {
            alert(`Error deleting file: ${err.message}`);
          });
      }
    }
  };

  // Render a folder and its contents if expanded
  const renderFolder = (item, level = 0) => {
    const isExpanded = expandedDirs[item.path] || false;
    
    return (
      <div key={item.path}>
        <div
          className={selectedFile?.path === item.path ? 'selected' : ''}
          onClick={() => handleItemClick(item)}
          onContextMenu={(e) => handleContextMenu(e, item)}
          style={{
            padding: '4px 8px',
            paddingLeft: `${8 + level * 16}px`,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: '2px',
            borderRadius: '3px',
            backgroundColor: selectedFile?.path === item.path ? '#37373d' : 'transparent',
            '&:hover': {
              backgroundColor: '#2a2a2a'
            }
          }}
        >
          <span style={{ marginRight: '6px' }}>{getFileIcon(item)}</span>
          <span style={{ flexGrow: 1 }}>{item.name}</span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, item);
            }}
            style={{ opacity: 0.5, cursor: 'pointer' }}
          >
            ⋮
          </span>
        </div>
        
        {isExpanded && (
          <div style={{ marginLeft: `${16}px` }}>
            {!item.children || item.children.length === 0 ? (
              <div style={{ padding: '4px 8px', color: '#888', fontStyle: 'italic', fontSize: '12px' }}>
                Empty folder
              </div>
            ) : (
              item.children
                .sort((a, b) => {
                  // Sort directories first, then files alphabetically
                  if (a.isDirectory && !b.isDirectory) return -1;
                  if (!a.isDirectory && b.isDirectory) return 1;
                  return a.name.localeCompare(b.name);
                })
                .map(subItem => (
                  subItem.isDirectory ? 
                    renderFolder(subItem, level + 1) :
                    renderFile(subItem, level + 1)
                ))
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Render a single file
  const renderFile = (item, level = 0) => {
    return (
      <div
        key={item.path}
        className={selectedFile?.path === item.path ? 'selected' : ''}
        onClick={() => handleItemClick(item)}
        onContextMenu={(e) => handleContextMenu(e, item)}
        style={{
          padding: '4px 8px',
          paddingLeft: `${8 + level * 16}px`,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: '2px',
          borderRadius: '3px',
          backgroundColor: selectedFile?.path === item.path ? '#37373d' : 'transparent',
          '&:hover': {
            backgroundColor: '#2a2a2a'
          }
        }}
      >
        <span style={{ marginRight: '6px' }}>{getFileIcon(item)}</span>
        <span style={{ flexGrow: 1 }}>{item.name}</span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e, item);
          }}
          style={{ opacity: 0.5, cursor: 'pointer' }}
        >
          ⋮
        </span>
      </div>
    );
  };

  // Function to render the file list
  const renderFileList = () => {
    if (!fileTree || fileTree.length === 0) {
      return <div style={{padding: '16px', textAlign: 'center', color: '#888'}}>This folder is empty</div>;
    }

    return (
      <div>
        {fileTree
          .sort((a, b) => {
            // Sort directories first, then files alphabetically
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
          })
          .map(item => (
            item.isDirectory ? renderFolder(item) : renderFile(item)
          ))}
      </div>
    );
  };

  return (
    <div style={{ 
      width: '250px', 
      backgroundColor: '#1e1e1e',
      borderRight: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      flexShrink: 0
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #333',
        backgroundColor: '#252526'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px' }}>Files</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => onRefresh()}
            title="Refresh files"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 4px',
              borderRadius: '3px'
            }}
          >
            🔄
          </button>
          <button 
            onClick={() => currentDirectory && handleCreateNewFile(currentDirectory)}
            title="Create new file"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 4px',
              borderRadius: '3px'
            }}
          >
            ➕
          </button>
        </div>
      </div>
      
      <div style={{ 
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '8px 0'
      }}>
        {!currentDirectory && (
          <div style={{padding: '16px', textAlign: 'center', color: '#888'}}>
            <p>No folder opened</p>
            <button 
              onClick={onOpenDirectory}
              style={{
                marginTop: '8px',
                backgroundColor: '#0e639c',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Open Folder
            </button>
          </div>
        )}
        
        {currentDirectory && fileTree && renderFileList()}
        
        {contextMenu.visible && (
          <div style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: '#252526',
            border: '1px solid #333',
            borderRadius: '4px',
            width: '150px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
            zIndex: 100
          }}>
            {contextMenu.item?.isDirectory && (
              <>
                <div 
                  onClick={() => handleCreateNewFile(contextMenu.item.path)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2a2d2e'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>New File</span>
                </div>
                <div 
                  onClick={() => handleCreateNewFolder(contextMenu.item.path)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2a2d2e'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>New Folder</span>
                </div>
              </>
            )}
            <div 
              onClick={() => handleDeleteItem(contextMenu.item)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#f14c4c'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(241, 76, 76, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span>Delete</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer; 