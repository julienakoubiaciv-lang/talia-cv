import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initMonitoring } from './lib/monitoring';

// Initialise Sentry + PostHog (no-op si les env vars sont absentes)
initMonitoring();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
