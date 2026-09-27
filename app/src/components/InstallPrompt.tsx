import { useEffect, useState } from "react";

/**
 * PWA install affordance.
 *
 * - Chromium/Android/desktop: captures `beforeinstallprompt`, stores the
 *   event, and shows a small dismissible "Install this app" button that calls
 *   `.prompt()` on click.
 * - iOS Safari never fires `beforeinstallprompt`, so for iPhones we detect the
 *   platform from the UA and show a one-time "tap Share -> Add to Home Screen"
 *   tip instead.
 *
 * Dismissals are persisted in localStorage so neither variant nags on every
 * visit. No push notifications are involved - installability only.
 */

const DISMISS_KEY = "tr_install_prompt_dismissed";
const IOS_TIP_KEY = "tr_ios_install_tip_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Mac; detect touch-capable Macintosh as iPad.
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const standaloneDisplay = window.matchMedia("(display-mode: standalone)").matches;
  return standaloneDisplay || nav.standalone === true;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const dismissedInstall = localStorage.getItem(DISMISS_KEY) === "1";
    const dismissedIos = localStorage.getItem(IOS_TIP_KEY) === "1";

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!dismissedInstall) setShowInstall(true);
    }

    function onInstalled() {
      setInstalled(true);
      setShowInstall(false);
      setShowIosTip(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (!dismissedIos && isIos()) setShowIosTip(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
      }
      setShowInstall(false);
      setDeferred(null);
    } catch {
      setShowInstall(false);
    }
  }

  function dismissInstall() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShowInstall(false);
  }

  function dismissIosTip() {
    localStorage.setItem(IOS_TIP_KEY, "1");
    setShowIosTip(false);
  }

  if (installed || (!showInstall && !showIosTip)) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 20,
        zIndex: 2000,
        width: "calc(100% - 32px)",
        maxWidth: 440,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "var(--radius-xs)",
          background: "linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-teal))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFF",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
          {showInstall ? "Install this app" : "Add to Home Screen"}
        </div>
        <div style={{ fontSize: 12, color: "var(--color-ink-muted)", lineHeight: 1.4 }}>
          {showInstall
            ? "Get the Neuro TeleRehab app on your device for one-tap access."
            : "On iPhone: tap Share → Add to Home Screen."}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {showInstall && deferred && (
          <button
            className="btn btn-primary"
            style={{ padding: "6px 14px", fontSize: 13 }}
            onClick={handleInstall}
          >
            Install
          </button>
        )}
        <button
          className="btn btn-ghost"
          aria-label="Dismiss install prompt"
          style={{ padding: "6px 10px", fontSize: 13 }}
          onClick={showInstall ? dismissInstall : dismissIosTip}
        >
          Not now
        </button>
      </div>
    </div>
  );
}