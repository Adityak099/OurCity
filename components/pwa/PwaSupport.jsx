"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, X } from "lucide-react";

function subscribeToDisplayMode(onChange) {
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", onChange);

  return () => mediaQuery.removeEventListener("change", onChange);
}

function getDisplayModeSnapshot() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function getServerDisplayModeSnapshot() {
  return false;
}

export default function PwaSupport() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const [platform, setPlatform] = useState("other");
  const [showInstructions, setShowInstructions] = useState(false);
  const isStandalone = useSyncExternalStore(
    subscribeToDisplayMode,
    getDisplayModeSnapshot,
    getServerDisplayModeSnapshot,
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleInstalled = () => {
      setAppInstalled(true);
      setDeferredPrompt(null);
      setShowInstructions(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error(
          "OurCity service worker registration failed:",
          error?.name || "UnknownError",
        );
      });
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const userAgent = window.navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/i.test(userAgent);

    setPlatform(
      isIos ? "ios" : /Android/i.test(userAgent) ? "android" : "other",
    );

    if (!deferredPrompt) {
      setShowInstructions(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setAppInstalled(true);
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error(
        "OurCity install prompt failed:",
        error?.name || "UnknownError",
      );
      setShowInstructions(true);
    }
  };

  if (isStandalone || appInstalled) return null;

  return (
    <>
      <button
        type="button"
        className={`pwa-install-button ${
          deferredPrompt ? "pwa-install-available" : ""
        }`}
        onClick={handleInstall}
      >
        <Download size={17} />
        Install OurCity
      </button>

      {showInstructions && (
        <div
          className="pwa-dialog-backdrop"
          onClick={() => setShowInstructions(false)}
        >
          <section
            className="pwa-install-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="pwa-dialog-close"
              aria-label="Close install instructions"
              onClick={() => setShowInstructions(false)}
            >
              <X size={19} />
            </button>
            <h2 id="pwa-install-title">Install OurCity</h2>
            {platform === "ios" ? (
              <p>
                In Safari, tap <strong>Share</strong>, then choose{" "}
                <strong>Add to Home Screen</strong>.
              </p>
            ) : platform === "android" ? (
              <p>
                Open this site in Chrome, tap the menu, then choose{" "}
                <strong>Install app</strong> or <strong>Add to Home screen</strong>.
              </p>
            ) : (
              <p>
                Open your browser menu and choose <strong>Install OurCity</strong>{" "}
                or <strong>Add to Home Screen</strong>.
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
