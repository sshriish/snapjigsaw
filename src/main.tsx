import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for offline support.
//
// Also make sure that when a *new* service worker takes over an already-open
// tab (i.e. this isn't the very first install), we reload once so the tab
// picks up the new JS/CSS bundle instead of running the old code in memory
// against a freshly-cached index.html. Without this, returning visitors can
// get stuck on a stale build until they manually hard-refresh.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  let hasReloadedForUpdate = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasReloadedForUpdate) return;
    hasReloadedForUpdate = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.warn('Service worker registered successfully:', reg.scope);

        // Proactively check for a newer service worker whenever the tab
        // regains focus, so long-lived open tabs don't sit on an old build
        // indefinitely between visits.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update().catch(() => {
              // Ignore — a failed update check just means we keep the
              // current version until the next opportunity.
            });
          }
        });
      })
      .catch((err) => console.warn('Service worker registration failed:', err));
  });
}
