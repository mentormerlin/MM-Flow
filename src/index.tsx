import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// The entry point for the application. It mounts the root React component
// into the DOM. StrictMode is enabled to help highlight potential
// problems in the codebase during development.
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);