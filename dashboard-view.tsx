"use client";

import { useEffect } from "react";
import {
  Upload,
  FilePlus,
  FileEdit,
  Printer,
  Combine,
  Scissors,
  Shield,
  Zap,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { usePdfStore } from "@/store/pdf-store";
import { FileDropzone, RecentDocs } from "../shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export function DashboardView() {
  const setView = usePdfStore((s) => s.setView);
  const loadRecents = usePdfStore((s) => s.loadRecents);
  const recents = usePdfStore((s) => s.recents);
  const docs = usePdfStore((s) => s.docs);

  useEffect(() => {
    loadRecents();
  }, [loadRecents]);

  const tools = [
    {
      id: "editor" as const,
      label: "Éditeur PDF",
      description: "Réorganiser, pivoter, supprimer, extraire les pages",
      icon: FileEdit,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      id: "print" as const,
      label: "Préparer l'impression",
      description: "Imprimer 1, 2, 4, 8 ou 16 pages par feuille",
      icon: Printer,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      id: "merge" as const,
      label: "Fusionner",
      description: "Assembler plusieurs PDF en un seul",
      icon: Combine,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      id: "split" as const,
      label: "Découper",
      description: "Séparer un PDF en plusieurs fichiers",
      icon: Scissors,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-8 py-8 space-y-10">
      {/* Hero header */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            100% confidentiel · Traitement local
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Mettez en page et imprimez vos PDF
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Importez vos documents, modifiez l'ordre des pages, choisissez le format
            et les marges, puis préparez l'impression en 1, 2, 4, 8 ou 16 pages
            par feuille. Aucun fichier ne quitte votre navigateur.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="overflow-hidden border-primary/30 hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Importer un PDF</h3>
                    <p className="text-xs text-muted-foreground">
                      Démarrez avec un fichier existant
                    </p>
                  </div>
                </div>
                <FileDropzone compact />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-emerald-500 p-2 text-white">
                  <FilePlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Créer un document</h3>
                  <p className="text-xs text-muted-foreground">
                    Démarrez un nouveau projet PDF vierge
                  </p>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Un document A4 vierge sera créé. Vous pourrez y importer d'autres pages ensuite.
                </p>
                <Button onClick={() => setView("editor")} className="mt-2">
                  Ouvrir l'éditeur
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* Tools */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Outils de mise en page</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                onClick={() => setView(tool.id)}
                disabled={tool.id !== "editor" && tool.id !== "merge" && docs.length === 0}
                className="group relative text-left rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className={`mb-3 inline-flex rounded-lg p-2 ${tool.bg}`}>
                  <Icon className={`h-5 w-5 ${tool.color}`} />
                </div>
                <h3 className="font-medium">{tool.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {tool.description}
                </p>
                {tool.id !== "editor" && tool.id !== "merge" && docs.length === 0 && (
                  <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
                    Importez un PDF d'abord
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Recents */}
      {recents.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Documents récents</h2>
          </div>
          <RecentDocs />
        </section>
      )}

      {/* Privacy banner */}
      <section className="rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-500 p-2 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
              Vos documents restent privés
            </h3>
            <p className="text-sm text-emerald-800 dark:text-emerald-200 max-w-2xl">
              PDF Studio effectue toutes les opérations directement dans votre
              navigateur grâce à pdf-lib et PDF.js. Aucun envoi vers un serveur,
              aucun stockage distant. Vos fichiers temporaires sont libérés dès
              que vous fermez l'onglet.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
