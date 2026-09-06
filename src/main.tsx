import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
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
