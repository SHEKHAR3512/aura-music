export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('AURA Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('Service Worker registration skipped or failed:', error);
        });
    });
  }
}
