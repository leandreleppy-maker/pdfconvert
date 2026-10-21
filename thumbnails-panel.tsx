"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { usePdfStore } from "@/store/pdf-store";
import { RotateCw, Trash2, FileWarning, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function SortableThumb({ index, onRotate, onDelete }: { index: number; onRotate: (i: number) => void; onDelete: (i: number) => void }) {
  const thumbs = usePdfStore((s) => s.thumbs);
  const currentPageIndex = usePdfStore((s) => s.currentPageIndex);
  const setCurrentPage = usePdfStore((s) => s.setCurrentPage);
  const selectedPages = usePdfStore((s) => s.selectedPages);
  const toggleSelect = usePdfStore((s) => s.toggleSelectPage);

  const thumb = thumbs[index];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `thumb-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isActive = currentPageIndex === index;
  const isSelected = selectedPages.has(index);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-md border bg-card transition-all cursor-pointer",
        isActive ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/40",
        isSelected && !isActive && "border-primary/60"
      )}
      onClick={(e) => {
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          toggleSelect(index);
        } else {
          setCurrentPage(index);
        }
      }}
    >
      <div
        {...attributes}
        {...listeners}
        className="aspect-[3/4] w-full flex items-center justify-center bg-muted/40 rounded-t-md overflow-hidden"
      >
        {thumb?.loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : thumb?.dataUrl ? (
          <img
            src={thumb.dataUrl}
            alt={`Page ${index + 1}`}
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <FileWarning className="h-5 w-5" />
            <span className="text-[10px]">Erreur</span>
          </div>
        )}
      </div>

      {/* Page number */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[11px] font-medium tabular-nums">
          {index + 1}
        </span>
        {isSelected && (
          <span className="rounded-sm bg-primary px-1 text-[9px] text-primary-foreground">
            Sel
          </span>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onRotate(index);
          }}
        >
          <RotateCw className="h-3 w-3" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(index);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function ThumbnailsPanel() {
  const thumbs = usePdfStore((s) => s.thumbs);
  const loadingThumbs = usePdfStore((s) => s.loadingThumbs);
  const pageOrder = usePdfStore((s) => s.pageOrder);
  const setPageOrder = usePdfStore((s) => s.setPageOrder);
  const rotatePage = usePdfStore((s) => s.rotatePage);
  const deleteSelected = usePdfStore((s) => s.deleteSelected);
  const selectedPages = usePdfStore((s) => s.selectedPages);
  const docs = usePdfStore((s) => s.docs);
  const activeDocId = usePdfStore((s) => s.activeDocId);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    })
  );

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = Number((active.id as string).replace("thumb-", ""));
    const newIndex = Number((over.id as string).replace("thumb-", ""));
    const newOrder = arrayMove(pageOrder, oldIndex, newIndex);
    try {
      await setPageOrder(newOrder);
      toast.success("Pages réorganisées.");
    } catch (err: any) {
      toast.error("Échec du réordonnancement.");
    }
  };

  const handleRotate = async (i: number) => {
    try {
      await rotatePage(i, 90);
      toast.success(`Page ${i + 1} pivotée.`);
    } catch (e: any) {
      toast.error("Échec de la rotation.");
    }
  };

  const handleDelete = async (i: number) => {
    // Mark this single page as selected then delete
    usePdfStore.setState({ selectedPages: new Set([i]) });
    try {
      await deleteSelected();
      toast.success(`Page ${i + 1} supprimée.`);
    } catch (e: any) {
      toast.error("Échec de la suppression.");
    }
  };

  const activeDoc = docs.find((d) => d.id === activeDocId);
  if (!activeDoc) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Aucun document chargé.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <div>
          <h3 className="text-sm font-semibold">Pages</h3>
          <p className="text-[11px] text-muted-foreground">
            {pageOrder.length} page{pageOrder.length > 1 ? "s" : ""}
            {selectedPages.size > 0 && ` · ${selectedPages.size} sélectionnée(s)`}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll p-3">
        {loadingThumbs && thumbs.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={thumbs.map((_, i) => `thumb-${i}`)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-2">
                {thumbs.map((_, i) => (
                  <SortableThumb
                    key={i}
                    index={i}
                    onRotate={handleRotate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="rounded-md border bg-card p-1 opacity-80 shadow-xl">
                  <div className="aspect-[3/4] w-24 bg-muted/40 flex items-center justify-center">
                    <img
                      src={thumbs[Number(activeId.replace("thumb-", ""))]?.dataUrl ?? ""}
                      alt="Drag preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <div className="border-t p-3 text-[10px] text-muted-foreground">
        <p>
          <kbd className="rounded bg-muted px-1">Clic</kbd> sélectionner ·{" "}
          <kbd className="rounded bg-muted px-1">Maj+Clic</kbd> sélection multiple ·{" "}
          <kbd className="rounded bg-muted px-1">Glisser</kbd> réordonner
        </p>
      </div>
    </div>
  );
}
