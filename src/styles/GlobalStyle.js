import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    background-color: ${props => props.theme.background};
    color: ${props => props.theme.text};
    overflow: hidden;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.scrollbarTrack};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.scrollbarThumb};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Markdown specific styles */
  .markdown-preview {
    padding: 16px;
    line-height: 1.5;
    overflow: auto;

    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      color: ${props => props.theme.text};
    }

    h1 {
      font-size: 2em;
      border-bottom: 1px solid ${props => props.theme.border};
      padding-bottom: 0.3em;
    }

    h2 {
      font-size: 1.5em;
      border-bottom: 1px solid ${props => props.theme.border};
      padding-bottom: 0.3em;
    }

    h3 {
      font-size: 1.25em;
    }

    p {
      margin-top: 0;
      margin-bottom: 16px;
    }

    a {
      color: ${props => props.theme.accent};
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      padding: 0.2em 0.4em;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      font-size: 85%;
    }

    pre {
      background-color: #2d2d2d;
      border-radius: 3px;
      padding: 16px;
      overflow: auto;
      margin-top: 0;
      margin-bottom: 16px;
    }

    pre code {
      background-color: transparent;
      padding: 0;
    }

    blockquote {
      border-left: 4px solid ${props => props.theme.accent};
      padding-left: 16px;
      color: ${props => props.theme.text};
      margin: 0 0 16px;
    }

    ul, ol {
      padding-left: 2em;
      margin-top: 0;
      margin-bottom: 16px;
    }

    img {
      max-width: 100%;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
    }

    table th, table td {
      border: 1px solid ${props => props.theme.border};
      padding: 6px 13px;
    }

    table th {
      font-weight: 600;
    }

    table tr {
      background-color: ${props => props.theme.background};
      border-top: 1px solid ${props => props.theme.border};
    }

    table tr:nth-child(2n) {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
`;

export default GlobalStyle; 