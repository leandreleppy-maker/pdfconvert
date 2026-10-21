"use client";

import { usePdfStore } from "@/store/pdf-store";
import { useEffect, useRef, useState } from "react";
import { renderPageToDataUrl } from "@/lib/pdf-utils";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PreviewPanel() {
  const currentBytes = usePdfStore((s) => s.currentBytes);
  const currentPageIndex = usePdfStore((s) => s.currentPageIndex);
  const setCurrentPage = usePdfStore((s) => s.setCurrentPage);
  const zoom = usePdfStore((s) => s.zoom);
  const layout = usePdfStore((s) => s.layout);
  const thumbs = usePdfStore((s) => s.thumbs);

  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!currentBytes) {
      setRenderedUrl(null);
      return;
    }
    setLoading(true);
    setError(null);
    // Re-render at higher quality than thumbnail
    renderPageToDataUrl(currentBytes, currentPageIndex, Math.max(0.6, 0.9 * zoom))
      .then((data) => {
        if (!cancelled) {
          setRenderedUrl(data.dataUrl);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError("Impossible de prévisualiser cette page.");
          setLoading(false);
        }
        console.error(e);
      });
    return () => {
      cancelled = true;
    };
  }, [currentBytes, currentPageIndex, zoom]);

  if (!currentBytes) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Chargement du document…</p>
      </div>
    );
  }

  // Compute preview "page" size based on layout settings
  const pageDims = (() => {
    const presets: Record<string, [number, number]> = {
      A4: [595.28, 841.89],
      A3: [841.89, 1190.55],
      A5: [419.53, 595.28],
      Letter: [612, 792],
      Legal: [612, 1008],
      custom: [layout.customWidth, layout.customHeight],
    };
    let [w, h] = presets[layout.pageSize] ?? presets.A4;
    if (layout.orientation === "landscape") [w, h] = [h, w];
    return { w, h };
  })();

  const aspect = pageDims.h / pageDims.w;

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="flex-1 overflow-auto thin-scroll p-4 md:p-8 flex items-start justify-center">
        <div className="flex items-center gap-4">
          {/* Page navigation */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="hidden md:inline-flex sticky left-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div
            className="relative bg-white shadow-2xl shadow-black/15"
            style={{
              width: `min(70vw, ${pageDims.w * 0.6}px)`,
              aspectRatio: `${pageDims.w} / ${pageDims.h}`,
              maxWidth: "100%",
            }}
          >
            {/* Margin overlay (visualization) */}
            <MarginOverlay layout={layout} pageW={pageDims.w} pageH={pageDims.h} />

            {/* Page content */}
            <div className="absolute inset-0 flex items-center justify-center p-2 overflow-hidden">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : renderedUrl ? (
                <img
                  src={renderedUrl}
                  alt={`Page ${currentPageIndex + 1}`}
                  className="max-h-full max-w-full object-contain"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                  }}
                />
              ) : null}
            </div>

            {/* Header text preview */}
            {layout.headerText && (
              <div className="absolute top-1 left-0 right-0 text-center text-[8px] text-gray-600 truncate px-2">
                {layout.headerText}
              </div>
            )}
            {/* Footer text preview */}
            {layout.footerText && (
              <div className="absolute bottom-1 left-0 right-0 text-center text-[8px] text-gray-600 truncate px-2">
                {layout.footerText}
              </div>
            )}
            {layout.showPageNumber && (
              <div className="absolute bottom-3 left-0 right-0 text-center text-[7px] text-gray-500">
                Page {currentPageIndex + 1} / {thumbs.length}
              </div>
            )}
            {layout.showDate && (
              <div className="absolute top-1 right-1 text-[6px] text-gray-500">
                {new Date().toLocaleDateString("fr-FR")}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(Math.min(thumbs.length - 1, currentPageIndex + 1))}
            disabled={currentPageIndex >= thumbs.length - 1}
            className="hidden md:inline-flex"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="border-t bg-background px-3 py-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Page <strong className="text-foreground">{currentPageIndex + 1}</strong> sur{" "}
          <strong className="text-foreground">{thumbs.length}</strong>
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" /> Précédente
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(Math.min(thumbs.length - 1, currentPageIndex + 1))}
            disabled={currentPageIndex >= thumbs.length - 1}
          >
            Suivante <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MarginOverlay({
  layout,
  pageW,
  pageH,
}: {
  layout: ReturnType<typeof usePdfStore.getState>["layout"];
  pageW: number;
  pageH: number;
}) {
  // Convert pt margins to relative %
  const mtPct = (layout.marginTop / pageH) * 100;
  const mbPct = (layout.marginBottom / pageH) * 100;
  const mlPct = (layout.marginLeft / pageW) * 100;
  const mrPct = (layout.marginRight / pageW) * 100;

  return (
    <>
      {/* Margin guides */}
      <div
        className="absolute border border-dashed border-primary/30 pointer-events-none"
        style={{
          top: `${mtPct}%`,
          bottom: `${mbPct}%`,
          left: `${mlPct}%`,
          right: `${mrPct}%`,
        }}
      />
      {/* Border (if enabled) */}
      {layout.showBorder && (
        <div
          className="absolute border-2 pointer-events-none"
          style={{
            top: `${mtPct}%`,
            bottom: `${mbPct}%`,
            left: `${mlPct}%`,
            right: `${mrPct}%`,
            borderColor: "#000",
            borderWidth: `${layout.borderWidth}px`,
          }}
        />
      )}
    </>
  );
}
