import { useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AppStateProvider, useAuth } from "./lib/AppContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AddCertificate from "./pages/AddCertificate";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Billing from "./pages/Billing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-950">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Routed() {
  const { session, loading } = useAuth();
  const [showAuth, setShowAuth] = useState<"signup" | "login" | null>(null);
  const { pathname } = useLocation();

  // Legal pages are public and don't depend on auth state.
  if (pathname === "/terms") return <Terms />;
  if (pathname === "/privacy") return <Privacy />;

  if (loading) {
    return <Spinner />;
  }

  if (!session) {
    if (showAuth) {
      return <Auth initialMode={showAuth} />;
    }
    return (
      <Landing
        onGetStarted={() => setShowAuth("signup")}
        onLogin={() => setShowAuth("login")}
      />
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddCertificate />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Routed />
    </AppStateProvider>
  );
}
