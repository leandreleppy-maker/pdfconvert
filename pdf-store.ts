"use client";

import { create } from "zustand";
import {
  PdfSource,
  LayoutSettings,
  PrintSettings,
  DEFAULT_LAYOUT,
  DEFAULT_PRINT,
  uid,
  loadPdfFile,
  applyLayout,
  buildPrintPdf,
  reorderPages,
  rotatePage,
  deletePages,
  extractPages,
  mergePdfs,
  splitPdf,
} from "@/lib/pdf-utils";

export type ViewName = "landing" | "login" | "dashboard" | "editor" | "print" | "merge" | "split";

export type PageThumb = {
  index: number;
  dataUrl: string | null;
  width: number;
  height: number;
  rotation: number;
  loading: boolean;
};

export type RecentDoc = {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  openedAt: number;
};

type PdfState = {
  // Navigation
  view: ViewName;
  setView: (v: ViewName) => void;

  // Auth
  user: { name: string; email: string } | null;
  login: (email: string, name?: string) => void;
  logout: () => void;

  // Loaded PDF(s)
  docs: PdfSource[]; // multiple for merge
  activeDocId: string | null;
  currentBytes: ArrayBuffer | null; // working bytes (after operations)
  pageOrder: number[]; // current order (indices into original)
  thumbs: PageThumb[];
  currentPageIndex: number; // active page in preview
  loadingThumbs: boolean;

  // History (for undo/redo)
  history: ArrayBuffer[];
  future: ArrayBuffer[];
  canUndo: boolean;
  canRedo: boolean;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Layout & print settings
  layout: LayoutSettings;
  print: PrintSettings;
  setLayout: (l: Partial<LayoutSettings>) => void;
  setPrint: (p: Partial<PrintSettings>) => void;

  // Recent docs (persisted in localStorage)
  recents: RecentDoc[];
  loadRecents: () => void;

  // Zoom
  zoom: number;
  setZoom: (z: number) => void;

  // Selected pages (for extract/delete)
  selectedPages: Set<number>;
  toggleSelectPage: (i: number) => void;
  clearSelection: () => void;

  // Actions
  importFiles: (files: File[]) => Promise<void>;
  setCurrentPage: (i: number) => void;
  setPageOrder: (newOrder: number[]) => void;
  rotatePage: (pageIndex: number, delta: 90 | 180 | 270) => Promise<void>;
  deleteSelected: () => Promise<void>;
  extractSelected: () => Promise<ArrayBuffer | null>;
  doMerge: () => Promise<void>;
  doSplit: (chunkSize: number) => Promise<Blob[]>;
  applyLayoutToBytes: () => Promise<ArrayBuffer>;
  buildPrintBytes: () => Promise<ArrayBuffer>;
  removeDoc: (id: string) => void;
  resetEditor: () => void;
};

const RECENTS_KEY = "pdfstudio_recents_v1";
const MAX_HISTORY = 30;

function loadRecentsFromStorage(): RecentDoc[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentDoc[];
  } catch {
    return [];
  }
}

function saveRecents(recents: RecentDoc[]) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

export const usePdfStore = create<PdfState>((set, get) => ({
  view: "landing",
  setView: (v) => set({ view: v }),

  user: null,
  login: (email, name) => {
    const finalName = name || email.split("@")[0] || "Utilisateur";
    set({ user: { name: finalName, email } });
    try {
      localStorage.setItem("pdfstudio_user", JSON.stringify({ name: finalName, email }));
    } catch {}
  },
  logout: () => {
    try { localStorage.removeItem("pdfstudio_user"); } catch {}
    set({ user: null, view: "landing" });
  },

  docs: [],
  activeDocId: null,
  currentBytes: null,
  pageOrder: [],
  thumbs: [],
  currentPageIndex: 0,
  loadingThumbs: false,

  history: [],
  future: [],
  canUndo: false,
  canRedo: false,
  pushHistory: () => {
    const { currentBytes, history } = get();
    if (!currentBytes) return;
    const next = [...history, currentBytes.slice(0)].slice(-MAX_HISTORY);
    set({ history: next, future: [], canUndo: next.length > 0, canRedo: false });
  },
  undo: () => {
    const { history, future, currentBytes } = get();
    if (history.length === 0 || !currentBytes) return;
    const prev = history[history.length - 1];
    const newFuture = [...future, currentBytes.slice(0)].slice(-MAX_HISTORY);
    const newHistory = history.slice(0, -1);
    set({
      currentBytes: prev,
      history: newHistory,
      future: newFuture,
      canUndo: newHistory.length > 0,
      canRedo: true,
    });
    void refreshThumbnailsFor(get, set, prev, get().pageOrder.length, get().currentPageIndex);
  },
  redo: () => {
    const { future, history, currentBytes } = get();
    if (future.length === 0 || !currentBytes) return;
    const next = future[future.length - 1];
    set({
      currentBytes: next,
      future: future.slice(0, -1),
      history: [...history, currentBytes.slice(0)].slice(-MAX_HISTORY),
      canUndo: true,
      canRedo: future.length - 1 > 0,
    });
    void refreshThumbnailsFor(get, set, next, get().pageOrder.length, get().currentPageIndex);
  },

  layout: { ...DEFAULT_LAYOUT },
  print: { ...DEFAULT_PRINT },
  setLayout: (l) => set({ layout: { ...get().layout, ...l } }),
  setPrint: (p) => set({ print: { ...get().print, ...p } }),

  recents: [],
  loadRecents: () => set({ recents: loadRecentsFromStorage() }),

  zoom: 1,
  setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(3, z)) }),

  selectedPages: new Set(),
  toggleSelectPage: (i) => {
    const s = new Set(get().selectedPages);
    if (s.has(i)) s.delete(i);
    else s.add(i);
    set({ selectedPages: s });
  },
  clearSelection: () => set({ selectedPages: new Set() }),

  importFiles: async (files) => {
    const newDocs: PdfSource[] = [];
    for (const f of files) {
      try {
        const doc = await loadPdfFile(f, uid());
        newDocs.push(doc);
        const recents = [
          {
            id: doc.id,
            name: doc.name,
            size: doc.size,
            pageCount: doc.pageCount,
            openedAt: Date.now(),
          },
          ...get().recents.filter((r) => r.name !== doc.name),
        ].slice(0, 20);
        set({ recents });
        saveRecents(recents);
      } catch (e) {
        console.error(e);
        throw e;
      }
    }
    const docs = [...get().docs, ...newDocs];
    const active = newDocs[0];
    set({
      docs,
      activeDocId: active?.id ?? null,
      currentBytes: active?.bytes ?? null,
      pageOrder: active ? Array.from({ length: active.pageCount }, (_, i) => i) : [],
      thumbs: [],
      currentPageIndex: 0,
      view: active ? "editor" : "dashboard",
      history: [],
      future: [],
      canUndo: false,
      canRedo: false,
    });
    if (active) {
      void refreshThumbnailsFor(get, set, active.bytes, active.pageCount, 0);
    }
  },

  setCurrentPage: (i) => set({ currentPageIndex: i }),

  setPageOrder: async (newOrder) => {
    const { currentBytes, pushHistory } = get();
    if (!currentBytes) return;
    pushHistory();
    const newBytes = await reorderPages(currentBytes, newOrder);
    set({ currentBytes: newBytes, pageOrder: newOrder });
    void refreshThumbnailsFor(get, set, newBytes, newOrder.length, get().currentPageIndex);
  },

  rotatePage: async (pageIndex, delta) => {
    const { currentBytes, pageOrder, pushHistory, currentPageIndex } = get();
    if (!currentBytes) return;
    pushHistory();
    const realIndex = pageOrder[pageIndex] ?? pageIndex;
    const newBytes = await rotatePage(currentBytes, realIndex, delta);
    set({ currentBytes: newBytes });
    void refreshThumbnailsFor(get, set, newBytes, pageOrder.length, currentPageIndex);
  },

  deleteSelected: async () => {
    const { currentBytes, selectedPages, pageOrder, pushHistory } = get();
    if (!currentBytes || selectedPages.size === 0) return;
    pushHistory();
    const realIndices = Array.from(selectedPages)
      .map((i) => pageOrder[i] ?? i)
      .sort((a, b) => a - b);
    const newBytes = await deletePages(currentBytes, realIndices);
    set({
      currentBytes: newBytes,
      pageOrder: Array.from({ length: pageOrder.length - selectedPages.size }, (_, i) => i),
      selectedPages: new Set(),
      currentPageIndex: 0,
    });
    void refreshThumbnailsFor(get, set, newBytes, pageOrder.length - selectedPages.size, 0);
  },

  extractSelected: async () => {
    const { currentBytes, selectedPages, pageOrder } = get();
    if (!currentBytes || selectedPages.size === 0) return null;
    const realIndices = Array.from(selectedPages)
      .map((i) => pageOrder[i] ?? i)
      .sort((a, b) => a - b);
    const extracted = await extractPages(currentBytes, realIndices);
    return extracted;
  },

  doMerge: async () => {
    const { docs, pushHistory } = get();
    if (docs.length < 2) throw new Error("Au moins deux documents sont nécessaires pour la fusion.");
    pushHistory();
    const merged = await mergePdfs(docs.map((d) => d.bytes));
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(merged, { ignoreEncryption: true });
    const newId = uid();
    set({
      currentBytes: merged,
      docs: [{ id: newId, name: "fusion.pdf", size: merged.byteLength, pageCount: doc.getPageCount(), bytes: merged }],
      activeDocId: newId,
      pageOrder: Array.from({ length: doc.getPageCount() }, (_, i) => i),
      thumbs: [],
      currentPageIndex: 0,
      view: "editor",
    });
    void refreshThumbnailsFor(get, set, merged, doc.getPageCount(), 0);
  },

  doSplit: async (chunkSize) => {
    const { currentBytes } = get();
    if (!currentBytes) return [];
    const chunks = await splitPdf(currentBytes, chunkSize);
    return chunks.map((b) => new Blob([b], { type: "application/pdf" }));
  },

  applyLayoutToBytes: async () => {
    const { currentBytes, layout, pageOrder } = get();
    if (!currentBytes) throw new Error("Aucun document chargé.");
    const indices = layout.applyToAll ? undefined : Array.from(get().selectedPages).map((i) => pageOrder[i] ?? i);
    const out = await applyLayout(currentBytes, layout, indices);
    return out;
  },

  buildPrintBytes: async () => {
    const { currentBytes, print } = get();
    if (!currentBytes) throw new Error("Aucun document chargé.");
    const out = await buildPrintPdf(currentBytes, print);
    return out;
  },

  removeDoc: (id) => {
    const docs = get().docs.filter((d) => d.id !== id);
    set({
      docs,
      activeDocId: docs[0]?.id ?? null,
      currentBytes: docs[0]?.bytes ?? null,
      pageOrder: docs[0] ? Array.from({ length: docs[0].pageCount }, (_, i) => i) : [],
      thumbs: [],
    });
    if (docs[0]) {
      void refreshThumbnailsFor(get, set, docs[0].bytes, docs[0].pageCount, 0);
    }
  },

  resetEditor: () =>
    set({
      docs: [],
      activeDocId: null,
      currentBytes: null,
      pageOrder: [],
      thumbs: [],
      currentPageIndex: 0,
      history: [],
      future: [],
      canUndo: false,
      canRedo: false,
      selectedPages: new Set(),
      view: "dashboard",
    }),
}));

async function refreshThumbnailsFor(
  get: () => PdfState,
  set: (p: Partial<PdfState>) => void,
  bytes: ArrayBuffer,
  pageCount: number,
  currentPageIndex = 0
) {
  set({ loadingThumbs: true, thumbs: [], currentPageIndex });
  const { renderAllThumbnails } = await import("@/lib/pdf-utils");
  const thumbs: PageThumb[] = Array.from({ length: pageCount }, (_, i) => ({
    index: i,
    dataUrl: null,
    width: 0,
    height: 0,
    rotation: 0,
    loading: true,
  }));
  set({ thumbs });
  await renderAllThumbnails(bytes, pageCount, 0.35, (i, data) => {
    const arr = get().thumbs.slice();
    arr[i] = {
      index: i,
      dataUrl: data.dataUrl,
      width: data.width,
      height: data.height,
      rotation: data.rotation,
      loading: false,
    };
    set({ thumbs: arr });
  });
  set({ loadingThumbs: false });
}
