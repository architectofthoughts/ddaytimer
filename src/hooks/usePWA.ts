import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

function isStandaloneMode(): boolean {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneMode());
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    const media = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => setIsInstalled(isStandaloneMode());

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('appinstalled', handleInstalled);
    media.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleInstalled);
      media.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
      return true;
    }

    return false;
  };

  const dismissNotice = () => {
    if (needRefresh) {
      setNeedRefresh(false);
    }
    if (offlineReady) {
      setOfflineReady(false);
    }
  };

  const applyUpdate = async () => {
    await updateServiceWorker(true);
  };

  return {
    isOnline,
    isInstalled,
    isInstallable: Boolean(installPrompt) && !isInstalled,
    needRefresh,
    offlineReady,
    installApp,
    dismissNotice,
    applyUpdate,
  };
}
