"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutTemplate,
  Frame,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  FileText,
  Calendar,
  Hash,
  RotateCw,
} from "lucide-react";
import { usePdfStore } from "@/store/pdf-store";
import { PAGE_SIZE_PRESETS, getLayoutDims } from "@/lib/pdf-utils";
import { toast } from "sonner";
import { useState } from "react";

const PAGE_SIZES = ["A4", "A3", "A5", "Letter", "Legal", "custom"] as const;

export function SettingsPanel() {
  const layout = usePdfStore((s) => s.layout);
  const setLayout = usePdfStore((s) => s.setLayout);
  const applyLayoutToBytes = usePdfStore((s) => s.applyLayoutToBytes);
  const selectedPages = usePdfStore((s) => s.selectedPages);
  const [applying, setApplying] = useState(false);

  const dims = getLayoutDims(layout);

  const handleApply = async () => {
    setApplying(true);
    try {
      await applyLayoutToBytes();
      toast.success("Mise en page appliquée à l'aperçu.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'application de la mise en page.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-3 py-2.5">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-primary" />
          Réglages de mise en page
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Format · marges · en-têtes · bordures
        </p>
      </div>

      <Tabs defaultValue="page" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2 grid grid-cols-3">
          <TabsTrigger value="page" className="text-xs">Page</TabsTrigger>
          <TabsTrigger value="margins" className="text-xs">Marges</TabsTrigger>
          <TabsTrigger value="header" className="text-xs">En-tête</TabsTrigger>
        </TabsList>

        <TabsContent value="page" className="flex-1 overflow-y-auto thin-scroll p-3 pt-2 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Format de page</Label>
            <Select
              value={layout.pageSize}
              onValueChange={(v) => setLayout({ pageSize: v as any })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "custom" ? "Personnalisé" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {layout.pageSize === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Largeur (pt)</Label>
                <Input
                  type="number"
                  value={layout.customWidth}
                  onChange={(e) => setLayout({ customWidth: Number(e.target.value) })}
                  min={100}
                  max={5000}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hauteur (pt)</Label>
                <Input
                  type="number"
                  value={layout.customHeight}
                  onChange={(e) => setLayout({ customHeight: Number(e.target.value) })}
                  min={100}
                  max={5000}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Orientation</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={layout.orientation === "portrait" ? "default" : "outline"}
                size="sm"
                onClick={() => setLayout({ orientation: "portrait" })}
                className="flex flex-col items-center gap-1 h-16"
              >
                <div className="border-2 border-current rounded-sm w-5 h-7" />
                <span className="text-[10px]">Portrait</span>
              </Button>
              <Button
                variant={layout.orientation === "landscape" ? "default" : "outline"}
                size="sm"
                onClick={() => setLayout({ orientation: "landscape" })}
                className="flex flex-col items-center gap-1 h-16"
              >
                <div className="border-2 border-current rounded-sm w-7 h-5" />
                <span className="text-[10px]">Paysage</span>
              </Button>
            </div>
          </div>

          <div className="rounded-md bg-muted/60 p-2 text-[11px] text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Dimensions finales</span>
              <span className="tabular-nums">{Math.round(dims.w)} × {Math.round(dims.h)} pt</span>
            </div>
            <div className="flex justify-between">
              <span>≈</span>
              <span className="tabular-nums">
                {(dims.w / 72 * 25.4).toFixed(0)} × {(dims.h / 72 * 25.4).toFixed(0)} mm
              </span>
            </div>
          </div>

          {/* Centering */}
          <div className="space-y-2">
            <Label className="text-xs">Alignement du contenu</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs flex items-center gap-1.5">
                  <AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />
                  Centrer horizontalement
                </span>
                <Switch
                  checked={layout.centerHorizontal}
                  onCheckedChange={(v) => setLayout({ centerHorizontal: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs flex items-center gap-1.5">
                  <AlignVerticalJustifyCenter className="h-3.5 w-3.5" />
                  Centrer verticalement
                </span>
                <Switch
                  checked={layout.centerVertical}
                  onCheckedChange={(v) => setLayout({ centerVertical: v })}
                />
              </div>
            </div>
          </div>

          {/* Border */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1.5">
                <Frame className="h-3.5 w-3.5" />
                Bordure de page
              </Label>
              <Switch
                checked={layout.showBorder}
                onCheckedChange={(v) => setLayout({ showBorder: v })}
              />
            </div>
            {layout.showBorder && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-12">Épaisseur</span>
                  <Slider
                    value={[layout.borderWidth]}
                    onValueChange={([v]) => setLayout({ borderWidth: v })}
                    min={0.5}
                    max={5}
                    step={0.5}
                  />
                  <span className="text-[11px] tabular-nums w-10 text-right">
                    {layout.borderWidth}pt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-12">Couleur</span>
                  <input
                    type="color"
                    value={`#${[layout.borderColor.r, layout.borderColor.g, layout.borderColor.b]
                      .map((c) => Math.round(c * 255).toString(16).padStart(2, "0"))
                      .join("")}`}
                    onChange={(e) => {
                      const hex = e.target.value;
                      const r = parseInt(hex.slice(1, 3), 16) / 255;
                      const g = parseInt(hex.slice(3, 5), 16) / 255;
                      const b = parseInt(hex.slice(5, 7), 16) / 255;
                      setLayout({ borderColor: { r, g, b } });
                    }}
                    className="h-7 w-12 rounded border cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Apply scope */}
          <div className="space-y-2">
            <Label className="text-xs">Application</Label>
            <div className="flex items-center justify-between">
              <span className="text-xs">Toutes les pages</span>
              <Switch
                checked={layout.applyToAll}
                onCheckedChange={(v) => setLayout({ applyToAll: v })}
              />
            </div>
            {!layout.applyToAll && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                {selectedPages.size} page(s) sélectionnée(s) seront mises en page.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="margins" className="flex-1 overflow-y-auto thin-scroll p-3 pt-2 space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Réglez chaque marge en points (1 pt ≈ 0,35 mm).
          </p>
          <MarginSlider label="Marge haut" value={layout.marginTop} onChange={(v) => setLayout({ marginTop: v })} />
          <MarginSlider label="Marge bas" value={layout.marginBottom} onChange={(v) => setLayout({ marginBottom: v })} />
          <MarginSlider label="Marge gauche" value={layout.marginLeft} onChange={(v) => setLayout({ marginLeft: v })} />
          <MarginSlider label="Marge droite" value={layout.marginRight} onChange={(v) => setLayout({ marginRight: v })} />
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setLayout({ marginTop: 14, marginBottom: 14, marginLeft: 14, marginRight: 14 })}>
              Étroites (0,5 cm)
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLayout({ marginTop: 36, marginBottom: 36, marginLeft: 36, marginRight: 36 })}>
              Normales (1,3 cm)
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLayout({ marginTop: 72, marginBottom: 72, marginLeft: 56, marginRight: 56 })}>
              Larges (2,5 cm)
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLayout({ marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 })}>
              Aucune marge
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="header" className="flex-1 overflow-y-auto thin-scroll p-3 pt-2 space-y-3">
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Texte d'en-tête
            </Label>
            <Input
              value={layout.headerText}
              onChange={(e) => setLayout({ headerText: e.target.value })}
              placeholder="Ex. Mon document"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Texte de pied de page
            </Label>
            <Input
              value={layout.footerText}
              onChange={(e) => setLayout({ footerText: e.target.value })}
              placeholder="Ex. © 2026 Mon Entreprise"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                Numéro de page
              </Label>
              <Switch
                checked={layout.showPageNumber}
                onCheckedChange={(v) => setLayout({ showPageNumber: v })}
              />
            </div>
            {layout.showPageNumber && (
              <p className="text-[10px] text-muted-foreground">
                Affiché en bas de page au format « Page X / N ».
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Date d'impression
              </Label>
              <Switch
                checked={layout.showDate}
                onCheckedChange={(v) => setLayout({ showDate: v })}
              />
            </div>
            {layout.showDate && (
              <p className="text-[10px] text-muted-foreground">
                Affichée en haut à droite.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="border-t p-3 space-y-2">
        <Button onClick={handleApply} disabled={applying} className="w-full gap-1.5">
          <RotateCw className={`h-4 w-4 ${applying ? "animate-spin" : ""}`} />
          {applying ? "Application…" : "Appliquer la mise en page"}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">
          La mise en page est appliquée à l'aperçu et au PDF exporté.
        </p>
      </div>
    </div>
  );
}

function MarginSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs">{label}</span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {value} pt · {(value / 72 * 25.4).toFixed(1)} mm
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={144}
        step={1}
      />
    </div>
  );
}
