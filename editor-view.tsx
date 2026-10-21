"use client";

import { usePdfStore } from "@/store/pdf-store";
import { EditorToolbar } from "./editor-toolbar";
import { ThumbnailsPanel } from "./thumbnails-panel";
import { PreviewPanel } from "./preview-panel";
import { SettingsPanel } from "./settings-panel";
import { FileDropzone } from "../shared/file-dropzone";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List, Settings2 } from "lucide-react";

export function EditorView() {
  const currentBytes = usePdfStore((s) => s.currentBytes);

  if (!currentBytes) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Éditeur PDF</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Importez un fichier PDF pour démarrer. Toutes les opérations sont
              réalisées localement dans votre navigateur.
            </p>
          </div>
          <FileDropzone />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] md:h-screen">
      <EditorToolbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: thumbnails (desktop) */}
        <aside className="hidden md:block w-64 shrink-0 border-r bg-card">
          <ThumbnailsPanel />
        </aside>

        {/* Center: preview */}
        <main className="flex-1 min-w-0">
          <PreviewPanel />
        </main>

        {/* Right: settings (desktop) */}
        <aside className="hidden lg:block w-80 shrink-0 border-l bg-card">
          <SettingsPanel />
        </aside>
      </div>

      {/* Mobile: thumbnails + settings as Sheets */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-30 flex gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <List className="h-4 w-4" />
              Pages
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <ThumbnailsPanel />
          </SheetContent>
        </Sheet>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 ml-auto">
              <Settings2 className="h-4 w-4" />
              Réglages
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0">
            <SettingsPanel />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
