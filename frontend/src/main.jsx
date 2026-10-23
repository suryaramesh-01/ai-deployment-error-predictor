import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
} catch (err) {
  console.error('Fatal mount error:', err);
  const fatalDiv = document.createElement('div');
  fatalDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:24px;background:#fee2e2;color:#991b1b;z-index:999999;font-family:monospace;font-size:14px;';
  fatalDiv.innerText = 'React Mount Error: ' + err.stack;
  document.body.appendChild(fatalDiv);
}
