"use client";

import { useState } from "react";
import {
  Scissors,
  Download,
  Loader2,
  FileText,
  Settings2,
} from "lucide-react";
import { usePdfStore } from "@/store/pdf-store";
import { FileDropzone } from "../shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { formatBytes, downloadBytes } from "@/lib/pdf-utils";

export function SplitView() {
  const docs = usePdfStore((s) => s.docs);
  const activeDocId = usePdfStore((s) => s.activeDocId);
  const currentBytes = usePdfStore((s) => s.currentBytes);
  const doSplit = usePdfStore((s) => s.doSplit);
  const setView = usePdfStore((s) => s.setView);

  const [chunkSize, setChunkSize] = useState(1);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ name: string; size: number; blob: Blob }[]>([]);

  const activeDoc = docs.find((d) => d.id === activeDocId);

  const handleSplit = async () => {
    if (!currentBytes) return;
    setBusy(true);
    setResults([]);
    try {
      const chunks = await doSplit(chunkSize);
      const baseName = (activeDoc?.name?.replace(/\.pdf$/i, "") ?? "document");
      const out = chunks.map((blob, i) => ({
        name: `${baseName}_partie_${i + 1}.pdf`,
        size: blob.size,
        blob,
      }));
      setResults(out);
      toast.success(`${chunks.length} fichier(s) généré(s).`);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec du découpage.");
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadAll = async () => {
    for (const r of results) {
      const buf = await r.blob.arrayBuffer();
      downloadBytes(buf, r.name);
      await new Promise((res) => setTimeout(res, 200));
    }
    toast.success(`${results.length} fichiers téléchargés.`);
  };

  if (!currentBytes || !activeDoc) {
    return (
      <div className="mx-auto max-w-3xl px-4 md:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            Découper un PDF
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importez un PDF pour le diviser en plusieurs fichiers. Vous pouvez
            séparer chaque page en un fichier distinct ou découper par groupes
            de pages.
          </p>
        </div>
        <FileDropzone />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scissors className="h-6 w-6 text-primary" />
          Découper un PDF
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Source : <strong>{activeDoc.name}</strong> · {activeDoc.pageCount} pages · {formatBytes(activeDoc.size)}
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Configuration du découpage</h3>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Pages par fichier</label>
            <p className="text-xs text-muted-foreground">
              Découpe en groupes de N pages. Pour séparer chaque page en un fichier
              individuel, choisissez 1.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 5, 10].map((n) => (
                <Button
                  key={n}
                  variant={chunkSize === n ? "default" : "outline"}
                  onClick={() => setChunkSize(n)}
                  className="flex flex-col"
                >
                  <span className="text-lg font-bold">{n}</span>
                  <span className="text-[10px]">page{n > 1 ? "s" : ""}/fichier</span>
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={activeDoc.pageCount}
                value={chunkSize}
                onChange={(e) => setChunkSize(Math.max(1, Number(e.target.value)))}
                className="h-9 w-24 rounded-md border px-3 text-sm"
              />
              <span className="text-xs text-muted-foreground">
                pages par fichier (max : {activeDoc.pageCount})
              </span>
            </div>
          </div>

          <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-xs space-y-1">
            <div className="font-medium text-primary">Aperçu</div>
            <div className="flex justify-between">
              <span>Pages totales</span>
              <span className="tabular-nums">{activeDoc.pageCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Pages par fichier</span>
              <span className="tabular-nums">{chunkSize}</span>
            </div>
            <div className="flex justify-between">
              <span>Fichiers générés</span>
              <span className="tabular-nums">{Math.ceil(activeDoc.pageCount / chunkSize)}</span>
            </div>
          </div>

          <Button onClick={handleSplit} disabled={busy} className="w-full gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
            {busy ? "Découpage en cours…" : "Découper le PDF"}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Résultats ({results.length})</h3>
            <Button onClick={handleDownloadAll} size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Tout télécharger
            </Button>
          </div>
          <div className="grid gap-2">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(r.size)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const buf = await r.blob.arrayBuffer();
                    downloadBytes(buf, r.name);
                  }}
                  className="gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Télécharger
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setView("editor");
            }}
            className="w-full"
          >
            Retour à l'éditeur
          </Button>
        </div>
      )}
    </div>
  );
}
