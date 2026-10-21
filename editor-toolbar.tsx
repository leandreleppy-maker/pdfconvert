"use client";

import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Printer,
  RotateCw,
  Trash2,
  Scissors,
  Maximize,
  Home,
  Save,
} from "lucide-react";
import { usePdfStore } from "@/store/pdf-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { downloadBytes, applyLayout, formatBytes } from "@/lib/pdf-utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditorToolbar() {
  const zoom = usePdfStore((s) => s.zoom);
  const setZoom = usePdfStore((s) => s.setZoom);
  const undo = usePdfStore((s) => s.undo);
  const redo = usePdfStore((s) => s.redo);
  const canUndo = usePdfStore((s) => s.canUndo);
  const canRedo = usePdfStore((s) => s.canRedo);
  const currentBytes = usePdfStore((s) => s.currentBytes);
  const docs = usePdfStore((s) => s.docs);
  const activeDocId = usePdfStore((s) => s.activeDocId);
  const applyLayoutToBytes = usePdfStore((s) => s.applyLayoutToBytes);
  const buildPrintBytes = usePdfStore((s) => s.buildPrintBytes);
  const setView = usePdfStore((s) => s.setView);
  const layout = usePdfStore((s) => s.layout);
  const print = usePdfStore((s) => s.print);
  const selectedPages = usePdfStore((s) => s.selectedPages);
  const deleteSelected = usePdfStore((s) => s.deleteSelected);
  const extractSelected = usePdfStore((s) => s.extractSelected);
  const rotatePage = usePdfStore((s) => s.rotatePage);
  const currentPageIndex = usePdfStore((s) => s.currentPageIndex);
  const clearSelection = usePdfStore((s) => s.clearSelection);

  const [exportDialog, setExportDialog] = useState(false);
  const [filename, setFilename] = useState("");
  const [busy, setBusy] = useState(false);

  const activeDoc = docs.find((d) => d.id === activeDocId);
  const hasDoc = !!currentBytes;

  const handleDownload = async () => {
    if (!currentBytes) return;
    setBusy(true);
    try {
      const out = await applyLayoutToBytes();
      const name = filename.trim() || activeDoc?.name?.replace(/\.pdf$/i, "") + "_mise_en_page.pdf" || "document.pdf";
      downloadBytes(out, name.endsWith(".pdf") ? name : `${name}.pdf`);
      toast.success("Téléchargement lancé.");
      setExportDialog(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'export.");
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadOriginal = () => {
    if (!currentBytes) return;
    const name = activeDoc?.name || "document.pdf";
    downloadBytes(currentBytes, name);
    toast.success("Document original téléchargé.");
  };

  const handlePrint = async () => {
    if (!currentBytes) return;
    setBusy(true);
    try {
      const out = await buildPrintBytes();
      const blobUrl = URL.createObjectURL(new Blob([out], { type: "application/pdf" }));
      const w = window.open(blobUrl, "_blank");
      if (!w) {
        toast.error("Pop-up bloqué. Autorisez les pop-ups pour imprimer.");
        return;
      }
      // Auto-trigger print
      w.addEventListener("load", () => {
        setTimeout(() => {
          w.focus();
          w.print();
        }, 500);
      });
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de la préparation d'impression.");
    } finally {
      setBusy(false);
    }
  };

  const handleExtract = async () => {
    if (selectedPages.size === 0) {
      toast.info("Sélectionnez d'abord des pages dans le panneau de gauche.");
      return;
    }
    setBusy(true);
    try {
      const out = await extractSelected();
      if (!out) {
        toast.info("Aucune page sélectionnée.");
        return;
      }
      const name = (activeDoc?.name?.replace(/\.pdf$/i, "") ?? "document") + "_extrait.pdf";
      downloadBytes(out, name);
      toast.success(`${selectedPages.size} pages extraites et téléchargées.`);
      clearSelection();
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'extraction.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (selectedPages.size === 0) {
      toast.info("Sélectionnez d'abord des pages.");
      return;
    }
    setBusy(true);
    try {
      await deleteSelected();
      toast.success(`${selectedPages.size} pages supprimées.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de la suppression.");
    } finally {
      setBusy(false);
    }
  };

  const handleRotate = async () => {
    setBusy(true);
    try {
      await rotatePage(currentPageIndex, 90);
      toast.success("Page pivotée de 90°.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de la rotation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <TooltipProvider delayDuration={250}>
      <div className="no-print sticky top-0 z-30 flex items-center gap-1 border-b bg-background/95 backdrop-blur px-3 py-2">
        <Button variant="ghost" size="icon" onClick={() => setView("dashboard")} className="md:hidden">
          <Home className="h-4 w-4" />
        </Button>
        <div className="hidden md:flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setView("dashboard")} >
            <Home className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-7" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Annuler</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rétablir</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-7" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleRotate} disabled={!hasDoc || busy}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Pivoter la page courante (90°)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={!hasDoc || selectedPages.size === 0 || busy}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Supprimer la sélection</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExtract}
              disabled={!hasDoc || selectedPages.size === 0 || busy}
            >
              <Scissors className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Extraire la sélection</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-7" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setZoom(zoom - 0.1)}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom arrière</TooltipContent>
          </Tooltip>
          <span className="w-12 text-center text-xs font-medium tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setZoom(zoom + 0.1)}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom avant</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setZoom(1)}>
                <Maximize className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Réinitialiser le zoom</TooltipContent>
          </Tooltip>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {activeDoc && (
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground mr-1">
              <span className="truncate max-w-[180px] font-medium text-foreground">
                {activeDoc.name}
              </span>
              <span>·</span>
              <span>{activeDoc.pageCount} p.</span>
              <span>·</span>
              <span>{formatBytes(activeDoc.size)}</span>
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleDownloadOriginal} disabled={!hasDoc}>
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Enregistrer l'original</TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportDialog(true)}
            disabled={!hasDoc || busy}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Télécharger</span>
          </Button>
          <Button size="sm" onClick={handlePrint} disabled={!hasDoc || busy} className="gap-1.5">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimer</span>
          </Button>
        </div>
      </div>

      {/* Export dialog */}
      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer en PDF</DialogTitle>
            <DialogDescription>
              Le PDF sera enregistré avec la mise en page actuelle. Vous pouvez
              choisir le nom du fichier de sortie.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="fname">Nom du fichier</Label>
            <Input
              id="fname"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={
                activeDoc?.name?.replace(/\.pdf$/i, "") + "_mise_en_page" || "document"
              }
            />
            <p className="text-xs text-muted-foreground">
              Format de page : <strong>{layout.pageSize}</strong> · Orientation :{" "}
              <strong>{layout.orientation === "portrait" ? "Portrait" : "Paysage"}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleDownload} disabled={busy}>
              {busy ? "Génération…" : "Télécharger le PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
