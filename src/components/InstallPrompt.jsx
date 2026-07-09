import React, { useEffect, useState } from 'react';
import logo from '../assets/guardian-ng-logo.png';

const STORAGE_KEY = 'guardian_pwa_prompt_shown_v1';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const beforeHandler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // show modal only once per user (per version)
      const shown = localStorage.getItem(STORAGE_KEY);
      if (!shown) setVisible(true);
    };

    const installedHandler = () => {
      setVisible(false);
      setDeferredPrompt(null);
      localStorage.setItem(STORAGE_KEY, 'installed');
    };

    window.addEventListener('beforeinstallprompt', beforeHandler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeHandler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        localStorage.setItem(STORAGE_KEY, 'installed');
        setVisible(false);
      } else {
        // Respect user's decision but don't nag immediately
        localStorage.setItem(STORAGE_KEY, 'dismissed');
        setVisible(false);
      }
    } catch (err) {
      console.error('Install prompt failed', err);
      setVisible(false);
    }
  };

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[94%] max-w-md bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <img src={logo} alt="Guardian logo" className="h-20 w-20 rounded-full object-contain" />
          <h3 className="text-lg font-black text-gray-900">Install Guardian-NG</h3>
          <p className="text-sm text-gray-600 text-center">Add Guardian-NG to your device for quick access and offline resilience.</p>
          <div className="flex gap-3 w-full">
            <button onClick={handleInstall} className="flex-1 py-2 bg-[#0f5132] text-white rounded-xl font-bold">Install</button>
            <button onClick={handleClose} className="flex-1 py-2 border border-gray-200 rounded-xl">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
