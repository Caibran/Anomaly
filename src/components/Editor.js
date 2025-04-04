import React from 'react';

const Editor = ({ content, onChange }) => {
  const handleKeyDown = (e) => {
    // Handle tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      
      // Insert 2 spaces at the cursor position
      const newText = content.substring(0, start) + '  ' + content.substring(end);
      onChange(newText);
      
      // Move cursor after the inserted tab
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 10);
    }
  };

  return (
    <textarea
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1e1e1e',
        color: '#e0e0e0',
        border: 'none',
        padding: '20px',
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        resize: 'none',
        outline: 'none'
      }}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Type Markdown here..."
      spellCheck="false"
    />
  );
};

export default Editor; 