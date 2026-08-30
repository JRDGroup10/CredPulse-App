import { useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppStateProvider, useAuth } from "./lib/AppContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AddCertificate from "./pages/AddCertificate";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Industries from "./pages/Industries";
import IndustryChooser from "./pages/IndustryChooser";
import { getIndustryPref, marketingHomePath } from "./lib/industryPref";
import JoinTeam from "./pages/JoinTeam";
import ClinicSignup from "./pages/ClinicSignup";
import Billing from "./pages/Billing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PendingClinicSetupResumer from "./components/PendingClinicSetupResumer";

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
  // Set when someone arrives via a team-invite link (see /join below) and
  // clicks "Create your account" — carried through to Auth.tsx so the
  // signup form can visibly confirm "you're joining X clinic" instead of
  // looking like a generic individual signup, even though the actual
  // linking happens automatically either way (see handle_new_user() in
  // organizations-schema.sql).
  const [joiningOrgName, setJoiningOrgName] = useState<string | null>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Legal pages are public and don't depend on auth state.
  if (pathname === "/terms") return <Terms />;
  if (pathname === "/privacy") return <Privacy />;

  // Split-screen industry chooser — always reachable here, regardless of any
  // remembered preference, so "Switch industry" links (see Landing.tsx and
  // Industries.tsx headers) always land on a real choice, not a redirect.
  if (pathname === "/choose") {
    return <IndustryChooser />;
  }

  if (loading) {
    return <Spinner />;
  }

  // Public marketing page for non-healthcare industries (construction,
  // school boards, policing) — same signup flows and same backend as
  // Landing.tsx, just different messaging. See Industries.tsx.
  if (pathname === "/industries") {
    return (
      <Industries
        onGetStarted={() => {
          setShowAuth("signup");
          navigate("/");
        }}
        onLogin={() => {
          setShowAuth("login");
          navigate("/");
        }}
      />
    );
  }

  // The public marketing homepage. Reachable from anywhere in the app (see the
  // home icon in Layout.tsx) without signing anyone out — it just shows a
  // different header/CTA depending on whether there's an active session.
  if (pathname === "/home") {
    return (
      <Landing
        loggedIn={!!session}
        onGetStarted={() => {
          setShowAuth("signup");
          navigate("/");
        }}
        onLogin={() => {
          setShowAuth("login");
          navigate("/");
        }}
      />
    );
  }

  // Landing page for the link in a team-invite email. Already-signed-in
  // visitors don't need this screen — the Dashboard's TeamInviteBanner
  // already handles them — so send those straight to "/".
  if (pathname === "/join") {
    if (session) {
      return <Navigate to="/" replace />;
    }
    return (
      <JoinTeam
        onGetStarted={(orgName) => {
          setJoiningOrgName(orgName);
          setShowAuth("signup");
          navigate("/");
        }}
        onLogin={() => {
          setShowAuth("login");
          navigate("/");
        }}
      />
    );
  }

  // Dedicated clinic/team signup wizard — deliberately separate from the
  // individual Auth flow above, since it collects a clinic name and a seat
  // plan instead of just an email/password. See ClinicSignup.tsx.
  if (pathname === "/signup/clinic") {
    if (session) {
      return <Navigate to="/" replace />;
    }
    return (
      <ClinicSignup
        onBack={() => navigate(marketingHomePath())}
        onLogin={() => {
          setShowAuth("login");
          navigate("/");
        }}
      />
    );
  }

  if (!session) {
    if (showAuth) {
      return (
        <Auth
          initialMode={showAuth}
          joiningOrgName={joiningOrgName ?? undefined}
          onBack={() => {
            setShowAuth(null);
            setJoiningOrgName(null);
            navigate(marketingHomePath());
          }}
        />
      );
    }
    // Fresh, undecided visitor — show the split-screen chooser instead of
    // assuming healthcare. Returning visitors who already picked a side
    // skip straight to their industry's page (still switchable via
    // "/choose" — see the header link on both Landing.tsx and Industries.tsx).
    const pref = getIndustryPref();
    if (!pref) {
      return <IndustryChooser />;
    }
    if (pref === "other") {
      return (
        <Industries
          onGetStarted={() => setShowAuth("signup")}
          onLogin={() => setShowAuth("login")}
        />
      );
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
      <PendingClinicSetupResumer />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddCertificate />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/team" element={<Team />} />
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
