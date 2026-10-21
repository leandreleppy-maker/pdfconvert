"use client";

import { useState } from "react";
import {
  Combine,
  Trash2,
  ArrowUpDown,
  Loader2,
  FileText,
  GripVertical,
} from "lucide-react";
import { usePdfStore } from "@/store/pdf-store";
import { FileDropzone } from "../shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { formatBytes, downloadBytes } from "@/lib/pdf-utils";
import { motion } from "framer-motion";

export function MergeView() {
  const docs = usePdfStore((s) => s.docs);
  const doMerge = usePdfStore((s) => s.doMerge);
  const removeDoc = usePdfStore((s) => s.removeDoc);
  const setView = usePdfStore((s) => s.setView);
  const [busy, setBusy] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleMerge = async () => {
    if (docs.length < 2) {
      toast.info("Importez au moins deux PDF pour les fusionner.");
      return;
    }
    setBusy(true);
    try {
      await doMerge();
      toast.success(`${docs.length} documents fusionnés avec succès.`);
      setView("editor");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de la fusion.");
    } finally {
      setBusy(false);
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= docs.length) return;
    const next = [...docs];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    usePdfStore.setState({ docs: next });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Combine className="h-6 w-6 text-primary" />
          Fusionner des PDF
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Importez plusieurs fichiers PDF, réorganisez-les par glisser-déposer,
          puis fusionnez-les en un seul document. L'ordre des pages suit l'ordre
          de la liste ci-dessous.
        </p>
      </div>

      <FileDropzone compact />

      {docs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Documents à fusionner ({docs.length})
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Glissez les poignées pour réordonner
            </p>
          </div>
          <div className="space-y-2">
            {docs.map((doc, idx) => (
              <motion.div
                key={doc.id}
                layout
                draggable
                onDragStart={() => setDraggedIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedIdx !== null && draggedIdx !== idx) {
                    move(draggedIdx, idx);
                  }
                  setDraggedIdx(null);
                }}
                className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow"
              >
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {idx + 1}. {doc.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {doc.pageCount} pages · {formatBytes(doc.size)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => move(idx, idx - 1)}
                    disabled={idx === 0}
                    className="h-8 w-8"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5 rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDoc(doc.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  Total : {docs.reduce((a, d) => a + d.pageCount, 0)} pages
                </p>
                <p className="text-xs text-muted-foreground">
                  Tous ces documents seront combinés dans l'ordre ci-dessus.
                </p>
              </div>
              <Button onClick={handleMerge} disabled={busy || docs.length < 2} className="gap-1.5">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Combine className="h-4 w-4" />}
                {busy ? "Fusion en cours…" : "Fusionner les documents"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
