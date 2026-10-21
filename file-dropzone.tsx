"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { usePdfStore } from "@/store/pdf-store";
import { formatBytes } from "@/lib/pdf-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Props = {
  compact?: boolean;
  className?: string;
  onAfterImport?: () => void;
};

export function FileDropzone({ compact = false, className, onAfterImport }: Props) {
  const [busy, setBusy] = useState(false);
  const importFiles = usePdfStore((s) => s.importFiles);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      setBusy(true);
      try {
        await importFiles(accepted);
        toast.success(
          accepted.length === 1
            ? `« ${accepted[0].name} » importé avec succès.`
            : `${accepted.length} documents importés.`
        );
        onAfterImport?.();
      } catch (e: any) {
        toast.error(e?.message ?? "Impossible de charger le fichier PDF.");
      } finally {
        setBusy(false);
      }
    },
    [importFiles, onAfterImport]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    maxSize: 200 * 1024 * 1024, // 200MB
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative cursor-pointer rounded-xl border-2 border-dashed transition-all",
        "flex flex-col items-center justify-center text-center",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/40 hover:bg-muted hover:border-primary/60",
        compact ? "p-6" : "p-10",
        busy && "pointer-events-none opacity-70",
        className
      )}
    >
      <input {...getInputProps()} />
      {busy ? (
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      ) : (
        <motion.div
          initial={false}
          animate={isDragActive ? { scale: 1.15 } : { scale: 1 }}
          className="rounded-full bg-primary/10 p-4"
        >
          <Upload className="h-8 w-8 text-primary" />
        </motion.div>
      )}
      <div className="mt-4 space-y-1">
        <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-lg")}>
          {isDragActive ? "Déposez vos fichiers ici" : "Glissez-déposez vos PDF"}
        </p>
        <p className="text-xs text-muted-foreground">
          ou <span className="text-primary font-medium underline">parcourez vos fichiers</span>
          {" · "}PDF uniquement · Max 200 Mo
        </p>
      </div>
      {isDragReject && (
        <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4" />
          Format non supporté
        </div>
      )}
    </div>
  );
}

export function RecentDocs() {
  const recents = usePdfStore((s) => s.recents);
  if (recents.length === 0) return null;

  return (
    <div className="space-y-2">
      {recents.slice(0, 5).map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{doc.name}</p>
            <p className="text-xs text-muted-foreground">
              {doc.pageCount} pages · {formatBytes(doc.size)} ·{" "}
              {new Date(doc.openedAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
