import { lazy, Suspense, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppStateProvider, useAuth } from "./lib/AppContext";
import Layout from "./components/Layout";
import { getIndustryPref, marketingHomePath } from "./lib/industryPref";
import PendingClinicSetupResumer from "./components/PendingClinicSetupResumer";

// Every page is its own lazy-loaded chunk instead of one monolithic bundle —
// a first-time visitor to the marketing site never downloads the
// authenticated app's pages, and a returning logged-in user never downloads
// the marketing/signup pages. See the <Suspense> boundary in App() below,
// which covers every branch Routed() can return (both the pre-auth
// pathname checks and the authenticated <Routes>), so this is safe
// regardless of which one loads first.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AddCertificate = lazy(() => import("./pages/AddCertificate"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Team = lazy(() => import("./pages/Team"));
const ComplianceReport = lazy(() => import("./pages/ComplianceReport"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const ApiKeys = lazy(() => import("./pages/ApiKeys"));
const Auth = lazy(() => import("./pages/Auth"));
const Landing = lazy(() => import("./pages/Landing"));
const Industries = lazy(() => import("./pages/Industries"));
const IndustryChooser = lazy(() => import("./pages/IndustryChooser"));
const JoinTeam = lazy(() => import("./pages/JoinTeam"));
const ClinicSignup = lazy(() => import("./pages/ClinicSignup"));
const Billing = lazy(() => import("./pages/Billing"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-950">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Used inside <Layout> (see the inner <Suspense> below) instead of Spinner —
// Spinner's min-h-screen would blow away the header/nav every time someone
// navigates to a page whose lazy chunk hasn't loaded yet; this only fills
// the content area so the app's chrome stays put during in-app navigation.
function PageSpinner() {
  return (
    <div className="py-24 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Routed() {
  const { session, loading, authGating } = useAuth();
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

  // Mid-login industry check in flight (see Auth.tsx) — show a spinner
  // instead of whatever `session` momentarily is. Supabase flips `session`
  // truthy the instant signIn() succeeds, before Auth.tsx has had a chance
  // to verify the account belongs on this side of the homepage chooser;
  // without this, a rejected login could flash the real dashboard for a
  // moment before being signed back out.
  if (authGating) {
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
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddCertificate />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/team" element={<Team />} />
          <Route path="/team/report" element={<ComplianceReport />} />
          <Route path="/team/audit-log" element={<AuditLog />} />
          <Route path="/team/api-keys" element={<ApiKeys />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Suspense fallback={<Spinner />}>
        <Routed />
      </Suspense>
    </AppStateProvider>
  );
}
