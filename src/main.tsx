import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

let hasReloadedForUpdate = false;
if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !hasReloadedForUpdate) {
      hasReloadedForUpdate = true;
      window.location.reload();
    }
  });
}

// Register PWA service worker with periodic & foreground update checks for mobile/tablet PWAs
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    const triggerUpdate = () => {
      registration.update().catch(() => {});
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        triggerUpdate();
      }
    });

    window.setInterval(triggerUpdate, 10 * 60 * 1000);
  },
});

createRoot(document.getElementById('root')!).render(<App />);
