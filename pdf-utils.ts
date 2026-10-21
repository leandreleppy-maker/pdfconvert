/**
 * PDF utilities — PDF.js (preview) + pdf-lib (manipulation)
 * All operations run client-side. No file is sent to any server.
 */
"use client";

import {
  PDFDocument,
  degrees,
  StandardFonts,
  rgb,
  PageSizes,
  PDFFont,
  PDFPage,
} from "pdf-lib";

// Lazy-load pdfjs-dist only on the browser (avoids SSR "use legacy" warning)
let _pdfjs: typeof import("pdfjs-dist") | null = null;
async function getPdfjs() {
  if (_pdfjs) return _pdfjs;
  const mod = await import("pdfjs-dist");
  mod.GlobalWorkerOptions.workerSrc = "/pdf-worker/pdf.worker.min.mjs";
  _pdfjs = mod;
  return mod;
}

export type PdfSource = {
  id: string;
  name: string;
  size: number;
  /** Page count, populated after load */
  pageCount: number;
  /** ArrayBuffer of the original bytes */
  bytes: ArrayBuffer;
  /** pdf-lib document (lazy, reloaded when needed) */
  _doc?: PDFDocument;
};

export type ThumbnailData = {
  pageIndex: number;
  /** PNG data URL (or null while loading) */
  dataUrl: string | null;
  width: number;
  height: number;
  rotation: number;
};

/** Page size presets in pdf-lib points (1pt = 1/72 inch) */
export const PAGE_SIZE_PRESETS: Record<
  "A4" | "A3" | "A5" | "Letter" | "Legal",
  [number, number]
> = {
  A4: PageSizes.A4,
  A3: PageSizes.A3,
  A5: PageSizes.A5,
  Letter: PageSizes.Letter,
  Legal: PageSizes.Legal,
};

/**
 * Load a PDF File into a PdfSource object using pdf-lib.
 * Also returns the page count so the UI can show it before rendering thumbnails.
 */
export async function loadPdfFile(
  file: File,
  id: string
): Promise<PdfSource> {
  if (!file || file.type !== "application/pdf") {
    throw new Error(
      "Le fichier n'est pas un PDF valide. Veuillez importer un fichier .pdf."
    );
  }
  const bytes = await file.arrayBuffer();
  // pdf-lib requires a Buffer-like; ArrayBuffer works directly
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return {
    id,
    name: file.name,
    size: file.size,
    pageCount: doc.getPageCount(),
    bytes,
    _doc: doc,
  };
}

/**
 * Render a single page to a PNG data URL using PDF.js.
 * Used for thumbnails and the central preview.
 */
export async function renderPageToDataUrl(
  bytes: ArrayBuffer,
  pageIndex: number,
  scale = 0.5,
  rotation = 0
): Promise<ThumbnailData> {
  const pdfjsLib = await getPdfjs();
  const loadingTask = pdfjsLib.getDocument({
    data: bytes.slice(0),
    disableAutoFetch: false,
    disableStream: false,
  });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponible");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({
    canvasContext: ctx,
    viewport,
  } as any).promise;
  const dataUrl = canvas.toDataURL("image/png");
  // Cleanup is best-effort — don't fail the render if destroy doesn't exist
  try {
    await (pdf as any).destroy?.();
  } catch (e) {
    // Ignore
  }
  return {
    pageIndex,
    dataUrl,
    width: viewport.width,
    height: viewport.height,
    rotation,
  };
}

/**
 * Render many pages in parallel (with a small concurrency cap).
 */
export async function renderAllThumbnails(
  bytes: ArrayBuffer,
  pageCount: number,
  scale = 0.3,
  onProgress?: (i: number, data: ThumbnailData) => void
): Promise<ThumbnailData[]> {
  const results: ThumbnailData[] = [];
  const CONCURRENCY = 3;
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, pageCount) }, async () => {
    while (nextIndex < pageCount) {
      const i = nextIndex++;
      try {
        const data = await renderPageToDataUrl(bytes, i, scale);
        results[i] = data;
        onProgress?.(i, data);
      } catch (e) {
        console.error("Failed to render page", i, e);
        results[i] = { pageIndex: i, dataUrl: null, width: 0, height: 0, rotation: 0 };
        onProgress?.(i, results[i]);
      }
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Reorder pages: given a source ArrayBuffer and a new page order (array of original indices),
 * build a new PDF with that order.
 */
export async function reorderPages(
  bytes: ArrayBuffer,
  newOrder: number[]
): Promise<ArrayBuffer> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const dst = await PDFDocument.create();
  const copied = await dst.copyPages(src, newOrder);
  copied.forEach((p) => dst.addPage(p));
  return await dst.save();
}

/**
 * Rotate a single page (relative to its current rotation).
 */
export async function rotatePage(
  bytes: ArrayBuffer,
  pageIndex: number,
  delta: 90 | 180 | 270
): Promise<ArrayBuffer> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  const page = pages[pageIndex];
  if (!page) throw new Error("Page introuvable");
  const current = page.getRotation().angle;
  page.setRotation(degrees((current + delta) % 360));
  return await doc.save();
}

/**
 * Delete a set of pages (by index) and return new bytes.
 */
export async function deletePages(
  bytes: ArrayBuffer,
  indices: number[]
): Promise<ArrayBuffer> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const dst = await PDFDocument.create();
  const keep = src.getPages().map((_, i) => i).filter((i) => !indices.includes(i));
  const copied = await dst.copyPages(src, keep);
  copied.forEach((p) => dst.addPage(p));
  return await dst.save();
}

/**
 * Extract a set of pages into a new PDF.
 */
export async function extractPages(
  bytes: ArrayBuffer,
  indices: number[]
): Promise<ArrayBuffer> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const dst = await PDFDocument.create();
  const copied = await dst.copyPages(src, indices);
  copied.forEach((p) => dst.addPage(p));
  return await dst.save();
}

/**
 * Merge multiple PDFs in the given order. Output is a single ArrayBuffer.
 */
export async function mergePdfs(
  sources: ArrayBuffer[]
): Promise<ArrayBuffer> {
  const dst = await PDFDocument.create();
  for (const buf of sources) {
    const src = await PDFDocument.load(buf, { ignoreEncryption: true });
    const pages = await dst.copyPages(src, src.getPages().map((_, i) => i));
    pages.forEach((p) => dst.addPage(p));
  }
  return await dst.save();
}

/**
 * Split a PDF into chunks of `chunkSize` pages. Returns multiple ArrayBuffers.
 * If chunkSize <= 1, splits each page individually.
 */
export async function splitPdf(
  bytes: ArrayBuffer,
  chunkSize: number
): Promise<ArrayBuffer[]> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = src.getPageCount();
  const result: ArrayBuffer[] = [];
  for (let i = 0; i < total; i += chunkSize) {
    const dst = await PDFDocument.create();
    const indices = Array.from({ length: Math.min(chunkSize, total - i) }, (_, k) => i + k);
    const copied = await dst.copyPages(src, indices);
    copied.forEach((p) => dst.addPage(p));
    result.push(await dst.save());
  }
  return result;
}

export type LayoutSettings = {
  pageSize: "A4" | "A3" | "A5" | "Letter" | "Legal" | "custom";
  customWidth: number; // points
  customHeight: number; // points
  orientation: "portrait" | "landscape";
  marginTop: number; // points
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  showBorder: boolean;
  borderColor: { r: number; g: number; b: number };
  borderWidth: number;
  centerHorizontal: boolean;
  centerVertical: boolean;
  headerText: string;
  footerText: string;
  showPageNumber: boolean;
  showDate: boolean;
  applyToAll: boolean;
};

export const DEFAULT_LAYOUT: LayoutSettings = {
  pageSize: "A4",
  customWidth: 595.28,
  customHeight: 841.89,
  orientation: "portrait",
  marginTop: 36,
  marginBottom: 36,
  marginLeft: 36,
  marginRight: 36,
  showBorder: false,
  borderColor: { r: 0, g: 0, b: 0 },
  borderWidth: 1,
  centerHorizontal: true,
  centerVertical: false,
  headerText: "",
  footerText: "",
  showPageNumber: true,
  showDate: false,
  applyToAll: true,
};

/**
 * Apply layout settings to a PDF and return the resulting bytes.
 * - Re-paginates content into the chosen page size with the chosen margins.
 * - Adds header/footer text, page numbers, and date if requested.
 * - Centers content on the page if requested.
 * - Adds a border if requested.
 *
 * The approach: for each source page, create a new destination page of the
 * chosen size, embed the source page as an "image-like" embeddable page,
 * and place it according to layout settings.
 */
export async function applyLayout(
  bytes: ArrayBuffer,
  settings: LayoutSettings,
  pageIndices?: number[]
): Promise<ArrayBuffer> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const dst = await PDFDocument.create();
  const font = await dst.embedFont(StandardFonts.Helvetica);
  const fontBold = await dst.embedFont(StandardFonts.HelveticaBold);

  const pageDims = computePageDims(settings);
  const indices = pageIndices ?? src.getPages().map((_, i) => i);

  for (let i = 0; i < indices.length; i++) {
    const origIdx = indices[i];
    const newPage = dst.addPage([pageDims.w, pageDims.h]);

    // Embed the original page into the destination
    const embedded = await dst.embedPage(src.getPage(origIdx)!);

    // Compute available area (within margins)
    const availW = pageDims.w - settings.marginLeft - settings.marginRight;
    const availH = pageDims.h - settings.marginTop - settings.marginBottom;

    // Scale to fit (preserve aspect ratio)
    const scale = Math.min(availW / embedded.width, availH / embedded.height);
    const drawW = embedded.width * scale;
    const drawH = embedded.height * scale;

    let x = settings.marginLeft;
    let y = settings.marginBottom;
    if (settings.centerHorizontal) x = (pageDims.w - drawW) / 2;
    if (settings.centerVertical) y = (pageDims.h - drawH) / 2;

    newPage.drawPage(embedded, {
      x,
      y,
      xScale: scale,
      yScale: scale,
    });

    // Border
    if (settings.showBorder) {
      newPage.drawRectangle({
        x: settings.marginLeft,
        y: settings.marginBottom,
        width: availW,
        height: availH,
        borderColor: rgb(settings.borderColor.r, settings.borderColor.g, settings.borderColor.b),
        borderWidth: settings.borderWidth,
        color: rgb(1, 1, 1),
        opacity: 0,
      });
    }

    // Header
    if (settings.headerText) {
      drawText(
        newPage,
        settings.headerText,
        pageDims.w / 2,
        pageDims.h - settings.marginTop / 2,
        font,
        9,
        rgb(0, 0, 0),
        "center"
      );
    }

    // Footer
    if (settings.footerText) {
      drawText(
        newPage,
        settings.footerText,
        pageDims.w / 2,
        settings.marginBottom / 2,
        font,
        9,
        rgb(0, 0, 0),
        "center"
      );
    }

    if (settings.showPageNumber) {
      drawText(
        newPage,
        `Page ${i + 1} / ${indices.length}`,
        pageDims.w / 2,
        settings.marginBottom / 2 - 12,
        font,
        9,
        rgb(0.3, 0.3, 0.3),
        "center"
      );
    }

    if (settings.showDate) {
      const today = new Date().toLocaleDateString("fr-FR");
      drawText(
        newPage,
        today,
        pageDims.w - settings.marginRight,
        pageDims.h - settings.marginTop / 2,
        font,
        8,
        rgb(0.4, 0.4, 0.4),
        "right"
      );
    }
  }

  return await dst.save();
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  align: "left" | "center" | "right"
) {
  const tWidth = font.widthOfTextAtSize(text, size);
  let drawX = x;
  if (align === "center") drawX = x - tWidth / 2;
  if (align === "right") drawX = x - tWidth;
  page.drawText(text, { x: drawX, y, size, font, color });
}

function computePageDims(settings: LayoutSettings): { w: number; h: number } {
  let w: number;
  let h: number;
  if (settings.pageSize === "custom") {
    w = settings.customWidth;
    h = settings.customHeight;
  } else {
    const [pw, ph] = PAGE_SIZE_PRESETS[settings.pageSize];
    w = pw;
    h = ph;
  }
  if (settings.orientation === "landscape") {
    return { w: h, h: w };
  }
  return { w, h };
}

export type PageLayoutInfo = { w: number; h: number };

export function getLayoutDims(settings: LayoutSettings): PageLayoutInfo {
  return computePageDims(settings);
}

export type PrintSettings = {
  pagesPerSheet: 1 | 2 | 4 | 6 | 8 | 16;
  paperSize: "A4" | "A3" | "A5" | "Letter" | "Legal";
  orientation: "portrait" | "landscape";
  pageGap: number; // points between thumbnails
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  colorMode: "color" | "grayscale";
  duplex: boolean;
  pageRange: "all" | "custom";
  customRange: string; // e.g., "1-3, 5, 8-10"
  showCutLines: boolean;
};

export const DEFAULT_PRINT: PrintSettings = {
  pagesPerSheet: 1,
  paperSize: "A4",
  orientation: "portrait",
  pageGap: 10,
  marginTop: 14,
  marginBottom: 14,
  marginLeft: 14,
  marginRight: 14,
  colorMode: "color",
  duplex: false,
  pageRange: "all",
  customRange: "",
  showCutLines: false,
};

/**
 * Parse a page range string like "1-3, 5, 8-10" into an array of 0-based indices.
 */
export function parsePageRange(range: string, total: number): number[] {
  const out: number[] = [];
  const parts = range.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
        if (i >= 1 && i <= total) out.push(i - 1);
      }
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= total) out.push(n - 1);
    }
  }
  return Array.from(new Set(out)).sort((a, b) => a - b);
}

/**
 * Build a "print-ready" PDF: each sheet contains N source pages laid out in a grid,
 * with chosen margins, gaps, and orientation. The returned PDF can be opened via
 * the browser's print dialog (also exposed as a Blob URL).
 */
export async function buildPrintPdf(
  bytes: ArrayBuffer,
  settings: PrintSettings
): Promise<ArrayBuffer> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = src.getPageCount();
  const indices =
    settings.pageRange === "custom" && settings.customRange.trim()
      ? parsePageRange(settings.customRange, total)
      : src.getPages().map((_, i) => i);
  if (indices.length === 0) throw new Error("Aucune page sélectionnée pour l'impression.");

  const dst = await PDFDocument.create();
  const font = await dst.embedFont(StandardFonts.Helvetica);

  const [pw0, ph0] = PAGE_SIZE_PRESETS[settings.paperSize];
  const sheetW = settings.orientation === "portrait" ? pw0 : ph0;
  const sheetH = settings.orientation === "portrait" ? ph0 : pw0;

  const cols = computeGridCols(settings.pagesPerSheet);
  const rows = Math.ceil(settings.pagesPerSheet / cols);

  // Available area for thumbnails
  const availW = sheetW - settings.marginLeft - settings.marginRight;
  const availH = sheetH - settings.marginTop - settings.marginBottom;
  const cellW = (availW - settings.pageGap * (cols - 1)) / cols;
  const cellH = (availH - settings.pageGap * (rows - 1)) / rows;

  // Slice pages into chunks of N
  for (let i = 0; i < indices.length; i += settings.pagesPerSheet) {
    const sheet = dst.addPage([sheetW, sheetH]);
    const chunk = indices.slice(i, i + settings.pagesPerSheet);

    for (let j = 0; j < chunk.length; j++) {
      const col = j % cols;
      const row = Math.floor(j / cols);
      const x = settings.marginLeft + col * (cellW + settings.pageGap);
      // PDF origin is bottom-left
      const y = sheetH - settings.marginTop - (row + 1) * cellH - row * settings.pageGap;

      const embedded = await dst.embedPage(src.getPage(chunk[j])!);
      const scale = Math.min(cellW / embedded.width, cellH / embedded.height);
      const drawW = embedded.width * scale;
      const drawH = embedded.height * scale;
      // Center inside the cell
      const dx = x + (cellW - drawW) / 2;
      const dy = y + (cellH - drawH) / 2;
      sheet.drawPage(embedded, { x: dx, y: dy, xScale: scale, yScale: scale });

      if (settings.showCutLines) {
        sheet.drawRectangle({
          x,
          y,
          width: cellW,
          height: cellH,
          borderColor: rgb(0.6, 0.6, 0.6),
          borderWidth: 0.5,
          color: rgb(1, 1, 1),
          opacity: 0,
          dashArray: [4, 4],
        });
      }
    }
  }

  return await dst.save();
}

function computeGridCols(n: 1 | 2 | 4 | 6 | 8 | 16): number {
  switch (n) {
    case 1: return 1;
    case 2: return 2;
    case 4: return 2;
    case 6: return 3;
    case 8: return 4;
    case 16: return 4;
    default: return 1;
  }
}

/**
 * Trigger a download for an ArrayBuffer as a PDF.
 */
export function downloadBytes(bytes: ArrayBuffer, filename: string) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Open a PDF in a new tab for printing (uses the browser's native viewer + print).
 */
export function openPrintDialog(bytes: ArrayBuffer) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    // Pop-ups blocked — fallback to download
    downloadBytes(bytes, "impression.pdf");
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
