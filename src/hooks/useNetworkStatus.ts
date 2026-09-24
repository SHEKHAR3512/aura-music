import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'aura_forced_offline';
const EVENT_KEY = 'aura_network_change';

function getInitialForcedOffline(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export interface NetworkStatus {
  isOnline: boolean;
  isSystemOnline: boolean;
  isForcedOffline: boolean;
  toggleForcedOffline: () => void;
  setForcedOffline: (val: boolean) => void;
}

export function useNetworkStatus(): NetworkStatus {
  const [isSystemOnline, setIsSystemOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [isForcedOffline, setIsForcedOfflineState] = useState<boolean>(getInitialForcedOffline);

  useEffect(() => {
    const handleOnline = () => setIsSystemOnline(true);
    const handleOffline = () => setIsSystemOnline(false);

    const handleCustomChange = () => {
      setIsForcedOfflineState(getInitialForcedOffline());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(EVENT_KEY, handleCustomChange);
    window.addEventListener('storage', handleCustomChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(EVENT_KEY, handleCustomChange);
      window.removeEventListener('storage', handleCustomChange);
    };
  }, []);

  const setForcedOffline = useCallback((val: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false');
      setIsForcedOfflineState(val);
      window.dispatchEvent(new Event(EVENT_KEY));
    } catch (e) {
      console.warn('Failed to save forced offline state:', e);
    }
  }, []);

  const toggleForcedOffline = useCallback(() => {
    setForcedOffline(!isForcedOffline);
  }, [isForcedOffline, setForcedOffline]);

  const isOnline = isSystemOnline && !isForcedOffline;

  return {
    isOnline,
    isSystemOnline,
    isForcedOffline,
    toggleForcedOffline,
    setForcedOffline,
  };
}
