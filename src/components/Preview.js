import React, { useEffect, useState } from 'react';
import showdown from 'showdown';

const Preview = ({ markdown }) => {
  const [html, setHtml] = useState('');
  
  useEffect(() => {
    if (!markdown) {
      setHtml('');
      return;
    }
    
    // Create and configure the showdown converter
    const converter = new showdown.Converter({
      tables: true,
      simplifiedAutoLink: true,
      strikethrough: true,
      tasklists: true,
      simpleLineBreaks: true,
      openLinksInNewWindow: true,
      emoji: true,
      underline: true
    });
    
    // Set options for better rendering
    showdown.setOption('ghCompatibleHeaderId', true);
    showdown.setOption('parseImgDimensions', true);
    showdown.setOption('metadata', true);
    
    try {
      // Process custom blockquote syntax
      let processedMarkdown = markdown;
      
      // Process triple-level blockquotes - must process these first
      processedMarkdown = processedMarkdown.replace(/^>>>\s(.*)$/gm, '> > > $1');
      
      // Process double-level blockquotes
      processedMarkdown = processedMarkdown.replace(/^>>\s(.*)$/gm, '> > $1');
      
      // Convert markdown to HTML
      const renderedHtml = converter.makeHtml(processedMarkdown);
      setHtml(renderedHtml);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      setHtml(`<p class="error">Error rendering markdown: ${error.message}</p>`);
    }
  }, [markdown]);
  
  // Basic styles for the preview container
  const previewStyles = {
    padding: '20px',
    height: '100%',
    overflow: 'auto',
    backgroundColor: '#1e1e1e',
    color: '#e0e0e0',
    lineHeight: '1.6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  };

  // Fallback for empty content
  if (!markdown) {
    return (
      <div style={previewStyles}>
        <p style={{ color: '#777', textAlign: 'center', marginTop: '50px' }}>
          No content to preview
        </p>
      </div>
    );
  }

  return (
    <div style={previewStyles}>
      <div 
        className="markdown-preview"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style jsx="true">{`
        .markdown-preview {
          line-height: 1.6;
        }
        
        .markdown-preview h1, .markdown-preview h2 {
          border-bottom: 1px solid #333;
          padding-bottom: 0.3em;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        
        .markdown-preview h1 { font-size: 2em; color: #fff; }
        .markdown-preview h2 { font-size: 1.5em; color: #fff; }
        .markdown-preview h3 { font-size: 1.25em; color: #fff; margin-top: 24px; margin-bottom: 16px; }
        .markdown-preview h4 { font-size: 1em; color: #fff; margin-top: 24px; margin-bottom: 16px; }
        .markdown-preview h5 { font-size: 0.875em; color: #fff; margin-top: 24px; margin-bottom: 16px; }
        .markdown-preview h6 { font-size: 0.85em; color: #999; margin-top: 24px; margin-bottom: 16px; }
        
        .markdown-preview a {
          color: #61afef;
          text-decoration: none;
        }
        
        .markdown-preview a:hover {
          text-decoration: underline;
        }
        
        .markdown-preview p {
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        .markdown-preview blockquote {
          border-left: 4px solid #444;
          padding-left: 16px;
          margin: 0 0 16px 0;
          color: #999;
        }
        
        .markdown-preview blockquote blockquote {
          margin-left: 0;
          margin-top: 8px;
          border-left-color: #666;
        }
        
        .markdown-preview blockquote blockquote blockquote {
          border-left-color: #888;
        }
        
        .markdown-preview ul, .markdown-preview ol {
          padding-left: 2em;
          margin-bottom: 16px;
          margin-top: 0;
        }
        
        .markdown-preview li {
          margin-bottom: 4px;
        }
        
        .markdown-preview li + li {
          margin-top: 4px;
        }
        
        .markdown-preview code {
          background-color: #2c2c2c;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
          font-size: 85%;
        }
        
        .markdown-preview pre {
          background-color: #2c2c2c;
          padding: 16px;
          overflow: auto;
          border-radius: 3px;
          margin-bottom: 16px;
        }
        
        .markdown-preview pre code {
          background-color: transparent;
          padding: 0;
          display: block;
          overflow-x: auto;
          line-height: 1.5;
          white-space: pre;
        }
        
        .markdown-preview hr {
          height: 0.25em;
          padding: 0;
          margin: 24px 0;
          background-color: #333;
          border: 0;
        }
        
        .markdown-preview del {
          color: #999;
          text-decoration: line-through;
        }
        
        .markdown-preview em, .markdown-preview i {
          font-style: italic;
        }
        
        .markdown-preview strong, .markdown-preview b {
          font-weight: 600;
          color: #e6e6e6;
        }
        
        .markdown-preview img {
          max-width: 100%;
          height: auto;
        }
        
        .error {
          color: #f14c4c;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default Preview; 