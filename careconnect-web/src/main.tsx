import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import InstallPrompt from './components/InstallPrompt.tsx';
import { registerServiceWorker } from './pwa/registerSW.ts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* PWA install banner — non-modal, lives outside the router */}
    <InstallPrompt />
  </StrictMode>
);

// Register the service worker for offline app-shell support (production builds).
registerServiceWorker();
