import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the minimal app-shell service worker (PWA installability only).
// It deliberately never caches API responses, so clinical/appointment/financial
// data is always fetched fresh.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      // Non-fatal: the app works fully without the SW (e.g. on http:// dev).
      console.warn("Service worker registration failed:", err);
    });
  });
}
