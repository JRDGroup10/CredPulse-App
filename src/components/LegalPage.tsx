import { Link } from "react-router-dom";
import { ReactNode } from "react";

export default function LegalPage({
  title,
  updated,
  children
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950">
      <header className="border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-sm">
              CP
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-50">CredPulse</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link to="/terms" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              Terms
            </Link>
            <Link to="/privacy" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              Privacy
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">{title}</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">Last updated: {updated}</p>
        <div className="prose-legal space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {children}
        </div>
      </main>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
