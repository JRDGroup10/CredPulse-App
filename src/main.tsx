import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { ThemeProvider } from "./lib/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { initErrorMonitoring, reportError } from "./lib/errorMonitoring";
import "./index.css";

initErrorMonitoring();

// ErrorBoundary (below) only catches errors thrown during React's own
// render/lifecycle — it can't see an error thrown inside an event handler
// or a rejected Promise, which is where most of this app's actual bugs
// live (every store.ts call is async). This catches those too, so a
// forgotten .catch() reports the error instead of just vanishing.
window.addEventListener("unhandledrejection", (event) => {
  reportError(event.reason, { source: "unhandledrejection" });
});

// Every route below is lazy-loaded (see App.tsx), so its JS chunk is only
// fetched the first time someone navigates there. If we ship a new deploy
// while a user still has an old tab open, that tab's index.html references
// chunk hashes that no longer exist on the server — navigating to a route
// it hasn't loaded yet then fails with "Failed to fetch dynamically
// imported module" instead of rendering. Vite dispatches this event when
// that happens; the fix is just to get the user onto the current build.
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

// Registered manually (injectRegister: false in vite.config.ts) so a
// registration failure reports through our own error monitoring with
// context instead of surfacing as an unhandled promise rejection.
if ("serviceWorker" in navigator) {
  registerSW({
    immediate: true,
    onRegisterError(error) {
      reportError(error, { source: "sw-register" });
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
