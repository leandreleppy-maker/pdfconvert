"use client";

import { useState, useEffect } from "react";
import {
  Printer,
  Download,
  Loader2,
  Palette,
  Grid3x3,
  RotateCw,
  Copy,
  Eye,
  FileWarning,
} from "lucide-react";
import { usePdfStore } from "@/store/pdf-store";
import { FileDropzone } from "../shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  buildPrintPdf,
  downloadBytes,
  parsePageRange,
  formatBytes,
  PAGE_SIZE_PRESETS,
} from "@/lib/pdf-utils";
import { PdfSource } from "@/lib/pdf-utils";
import { motion } from "framer-motion";

export function PrintView() {
  const currentBytes = usePdfStore((s) => s.currentBytes);
  const print = usePdfStore((s) => s.print);
  const setPrint = usePdfStore((s) => s.setPrint);
  const docs = usePdfStore((s) => s.docs);
  const activeDocId = usePdfStore((s) => s.activeDocId);
  const buildPrintBytes = usePdfStore((s) => s.buildPrintBytes);
  const pageOrder = usePdfStore((s) => s.pageOrder);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeDoc = docs.find((d) => d.id === activeDocId);

  // Rebuild the preview whenever print settings change
  useEffect(() => {
    if (!currentBytes) return;
    let cancelled = false;
    setBuilding(true);
    const t = setTimeout(async () => {
      try {
        const out = await buildPrintPdf(currentBytes, print);
        if (cancelled) return;
        const blobUrl = URL.createObjectURL(new Blob([out], { type: "application/pdf" }));
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return blobUrl;
        });
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message ?? "Échec de l'aperçu.");
      } finally {
        if (!cancelled) setBuilding(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [currentBytes, print]);

  if (!currentBytes || !activeDoc) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Préparer l'impression</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Importez un PDF pour configurer votre impression. Choisissez le
              nombre de pages par feuille, les marges, la couleur et le recto-verso.
            </p>
          </div>
          <FileDropzone />
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    setBusy(true);
    try {
      const out = await buildPrintBytes();
      const name = (activeDoc.name?.replace(/\.pdf$/i, "") ?? "document") + "_impression.pdf";
      downloadBytes(out, name);
      toast.success("PDF prêt à imprimer téléchargé.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de la génération.");
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = async () => {
    setBusy(true);
    try {
      const out = await buildPrintBytes();
      const blobUrl = URL.createObjectURL(new Blob([out], { type: "application/pdf" }));
      const w = window.open(blobUrl, "_blank");
      if (!w) {
        toast.error("Pop-up bloqué. Autorisez les pop-ups pour imprimer.");
        return;
      }
      w.addEventListener("load", () => {
        setTimeout(() => {
          w.focus();
          w.print();
        }, 500);
      });
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      toast.success("Boîte de dialogue d'impression ouverte.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de la préparation.");
    } finally {
      setBusy(false);
    }
  };

  const selectedPagesCount =
    print.pageRange === "all"
      ? pageOrder.length
      : parsePageRange(print.customRange, pageOrder.length).length;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            Préparer l'impression
          </h1>
          <p className="text-[11px] text-muted-foreground">
            {activeDoc.name} · {pageOrder.length} pages · {formatBytes(activeDoc.size)}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={busy}>
            <Download className="h-4 w-4 mr-1.5" />
            Télécharger
          </Button>
          <Button onClick={handlePrint} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Printer className="h-4 w-4 mr-1.5" />}
            Imprimer
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: settings */}
        <aside className="w-80 shrink-0 border-r bg-card overflow-y-auto thin-scroll">
          <PrintSettingsPanel
            print={print}
            setPrint={setPrint}
            totalPages={pageOrder.length}
            selectedPagesCount={selectedPagesCount}
          />
        </aside>

        {/* Right: preview */}
        <main className="flex-1 bg-muted/30 overflow-hidden flex flex-col">
          <div className="border-b px-3 py-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              Aperçu fidèle du résultat
            </span>
            <span className="text-muted-foreground">
              {building ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Construction…
                </span>
              ) : (
                `${print.pagesPerSheet} page(s) par feuille`
              )}
            </span>
          </div>
          <div className="flex-1 overflow-auto thin-scroll p-4">
            {previewUrl ? (
              <div className="mx-auto" style={{ maxWidth: "100%" }}>
                <iframe
                  src={previewUrl}
                  title="Aperçu d'impression"
                  className="w-full bg-white shadow-2xl rounded-sm"
                  style={{
                    height: "80vh",
                    border: "none",
                  }}
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function PrintSettingsPanel({
  print,
  setPrint,
  totalPages,
  selectedPagesCount,
}: {
  print: ReturnType<typeof usePdfStore.getState>["print"];
  setPrint: ReturnType<typeof usePdfStore.getState>["setPrint"];
  totalPages: number;
  selectedPagesCount: number;
}) {
  const sheets = Math.ceil(selectedPagesCount / print.pagesPerSheet);
  return (
    <div className="p-3 space-y-5">
      {/* Pages per sheet */}
      <section className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <Grid3x3 className="h-3.5 w-3.5 text-primary" />
          Pages par feuille
        </Label>
        <ToggleGroup
          type="single"
          value={String(print.pagesPerSheet)}
          onValueChange={(v) => v && setPrint({ pagesPerSheet: Number(v) as any })}
          className="grid grid-cols-3 gap-1"
        >
          {[1, 2, 4, 6, 8, 16].map((n) => (
            <ToggleGroupItem key={n} value={String(n)} className="text-xs">
              {n}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="grid grid-cols-3 gap-1 text-[10px] text-center text-muted-foreground">
          <span>1×</span>
          <span>2×</span>
          <span>4×</span>
          <span>6×</span>
          <span>8×</span>
          <span>16×</span>
        </div>
      </section>

      {/* Paper size */}
      <section className="space-y-2">
        <Label className="text-xs">Format de papier</Label>
        <Select
          value={print.paperSize}
          onValueChange={(v) => {
            const newSize = v as any;
            // Smart suggestion: A3 naturally fits 2 A4 pages → switch to 2/sheet + landscape
            // (A3 landscape = 2× A4 portrait side-by-side)
            if (newSize === "A3" && print.pagesPerSheet === 1) {
              setPrint({ paperSize: newSize, pagesPerSheet: 2, orientation: "landscape" });
            } else if (newSize === "A4" && print.paperSize === "A3" && print.pagesPerSheet === 2) {
              setPrint({ paperSize: newSize, pagesPerSheet: 1, orientation: "portrait" });
            } else {
              setPrint({ paperSize: newSize });
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(PAGE_SIZE_PRESETS).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {print.paperSize === "A3" && print.pagesPerSheet === 2 && (
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded p-1.5">
            ✓ A3 paysage = 2 pages A4 côte à côte (configuration idéale)
          </p>
        )}
        {print.paperSize === "A3" && print.pagesPerSheet !== 2 && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400">
            Astuce : A3 = 2× A4, essayez « 2 pages par feuille »
          </p>
        )}
      </section>

      {/* Orientation */}
      <section className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <RotateCw className="h-3.5 w-3.5 text-primary" />
          Orientation
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={print.orientation === "portrait" ? "default" : "outline"}
            size="sm"
            onClick={() => setPrint({ orientation: "portrait" })}
            className="flex flex-col items-center gap-1 h-14"
          >
            <div className="border-2 border-current rounded-sm w-4 h-6" />
            <span className="text-[10px]">Portrait</span>
          </Button>
          <Button
            variant={print.orientation === "landscape" ? "default" : "outline"}
            size="sm"
            onClick={() => setPrint({ orientation: "landscape" })}
            className="flex flex-col items-center gap-1 h-14"
          >
            <div className="border-2 border-current rounded-sm w-6 h-4" />
            <span className="text-[10px]">Paysage</span>
          </Button>
        </div>
      </section>

      {/* Page range */}
      <section className="space-y-2">
        <Label className="text-xs">Pages à imprimer</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={print.pageRange === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setPrint({ pageRange: "all" })}
          >
            Toutes ({totalPages})
          </Button>
          <Button
            variant={print.pageRange === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setPrint({ pageRange: "custom" })}
          >
            Plage…
          </Button>
        </div>
        {print.pageRange === "custom" && (
          <Input
            value={print.customRange}
            onChange={(e) => setPrint({ customRange: e.target.value })}
            placeholder="Ex. 1-3, 5, 8-10"
            className="text-xs"
          />
        )}
        {print.pageRange === "custom" && (
          <p className="text-[10px] text-muted-foreground">
            {selectedPagesCount} page(s) sélectionnée(s) · {sheets} feuille(s)
          </p>
        )}
      </section>

      {/* Margins */}
      <section className="space-y-3">
        <Label className="text-xs">Marges d'impression</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Haut", key: "marginTop" as const },
            { label: "Bas", key: "marginBottom" as const },
            { label: "Gauche", key: "marginLeft" as const },
            { label: "Droite", key: "marginRight" as const },
          ].map((m) => (
            <div key={m.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px]">{m.label}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {print[m.key]}pt · {(print[m.key] / 72 * 25.4).toFixed(1)}mm
                </span>
              </div>
              <Slider
                value={[print[m.key]]}
                onValueChange={([v]) => setPrint({ [m.key]: v } as any)}
                min={0}
                max={72}
                step={1}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => setPrint({ marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 })}>
            Aucune
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPrint({ marginTop: 14, marginBottom: 14, marginLeft: 14, marginRight: 14 })}>
            Étroite
          </Button>
        </div>
      </section>

      {/* Gap between pages */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Espace entre pages</Label>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {print.pageGap}pt · {(print.pageGap / 72 * 25.4).toFixed(1)}mm
          </span>
        </div>
        <Slider
          value={[print.pageGap]}
          onValueChange={([v]) => setPrint({ pageGap: v })}
          min={0}
          max={36}
          step={1}
        />
      </section>

      {/* Cut lines */}
      <section className="flex items-center justify-between">
        <Label className="text-xs">Repères de coupe</Label>
        <Switch
          checked={print.showCutLines}
          onCheckedChange={(v) => setPrint({ showCutLines: v })}
        />
      </section>

      {/* Color */}
      <section className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-primary" />
          Mode couleur
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={print.colorMode === "color" ? "default" : "outline"}
            size="sm"
            onClick={() => setPrint({ colorMode: "color" })}
          >
            Couleur
          </Button>
          <Button
            variant={print.colorMode === "grayscale" ? "default" : "outline"}
            size="sm"
            onClick={() => setPrint({ colorMode: "grayscale" })}
          >
            N&B
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Le mode N&B sera appliqué par l'imprimante via la boîte de dialogue.
        </p>
      </section>

      {/* Duplex */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs flex items-center gap-1.5">
            <Copy className="h-3.5 w-3.5 text-primary" />
            Recto-verso
          </Label>
          <Switch
            checked={print.duplex}
            onCheckedChange={(v) => setPrint({ duplex: v })}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Si votre imprimante le permet, le recto-verso sera activé lors de l'impression.
        </p>
      </section>

      {/* Summary */}
      <section className="rounded-md bg-primary/5 border border-primary/20 p-3 space-y-1 text-[11px]">
        <div className="font-medium text-primary text-xs">Récapitulatif</div>
        <div className="flex justify-between">
          <span>Pages à imprimer</span>
          <span className="tabular-nums">{selectedPagesCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Pages par feuille</span>
          <span className="tabular-nums">{print.pagesPerSheet}</span>
        </div>
        <div className="flex justify-between">
          <span>Feuilles requises</span>
          <span className="tabular-nums">{sheets}</span>
        </div>
        <div className="flex justify-between">
          <span>Feuilles (recto-verso)</span>
          <span className="tabular-nums">{print.duplex ? Math.ceil(sheets / 2) : sheets}</span>
        </div>
      </section>
    </div>
  );
}
