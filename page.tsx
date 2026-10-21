"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/pdfstudio/shared/sidebar";
import { DashboardView } from "@/components/pdfstudio/dashboard/dashboard-view";
import { EditorView } from "@/components/pdfstudio/editor/editor-view";
import { PrintView } from "@/components/pdfstudio/print/print-view";
import { MergeView } from "@/components/pdfstudio/merge-split/merge-view";
import { SplitView } from "@/components/pdfstudio/merge-split/split-view";
import { LandingView } from "@/components/pdfstudio/landing/landing-view";
import { LoginView } from "@/components/pdfstudio/landing/login-view";
import { usePdfStore } from "@/store/pdf-store";

export default function Home() {
  const view = usePdfStore((s) => s.view);
  const loadRecents = usePdfStore((s) => s.loadRecents);

  useEffect(() => {
    loadRecents();
    // Restore user session from localStorage
    try {
      const raw = localStorage.getItem("pdfstudio_user");
      if (raw) {
        const u = JSON.parse(raw);
        usePdfStore.setState({ user: u });
        // If user was previously logged in, go to dashboard instead of landing
        if (usePdfStore.getState().view === "landing") {
          usePdfStore.setState({ view: "dashboard" });
        }
      }
    } catch {}
  }, [loadRecents]);

  // Landing & login are full-page views WITHOUT the sidebar (masked)
  if (view === "landing") return <LandingView />;
  if (view === "login") return <LoginView />;

  // App views WITH sidebar
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {view === "dashboard" && <DashboardView />}
        {view === "editor" && <EditorView />}
        {view === "print" && <PrintView />}
        {view === "merge" && <MergeView />}
        {view === "split" && <SplitView />}
      </main>
    </div>
  );
}
