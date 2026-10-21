"use client";

import { useState } from "react";
import {
  Upload,
  FileEdit,
  Printer,
  Combine,
  Scissors,
  Shield,
  Zap,
  ArrowRight,
  Check,
  Sparkles,
  LogIn,
  Clock,
} from "lucide-react";
import { usePdfStore } from "@/store/pdf-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";

export function LandingView() {
  const setView = usePdfStore((s) => s.setView);
  const loadRecents = usePdfStore((s) => s.loadRecents);
  const recents = usePdfStore((s) => s.recents);
  const user = usePdfStore((s) => s.user);

  const features = [
    {
      icon: FileEdit,
      title: "Éditeur complet",
      desc: "Réorganisez, pivotez, supprimez et extrayez les pages par glisser-déposer.",
    },
    {
      icon: Printer,
      title: "Impression N-up",
      desc: "Imprimez 1, 2, 4, 6, 8 ou 16 pages par feuille avec marges et repères de coupe.",
    },
    {
      icon: Combine,
      title: "Fusion & découpe",
      desc: "Assemblez plusieurs PDF en un seul, ou découpez un PDF en plusieurs fichiers.",
    },
    {
      icon: Shield,
      title: "100% confidentiel",
      desc: "Vos fichiers restent dans votre navigateur. Aucun envoi vers un serveur.",
    },
  ];

  const steps = [
    { n: 1, title: "Importez votre PDF", desc: "Glissez-déposez ou parcourez vos fichiers." },
    { n: 2, title: "Modifiez la mise en page", desc: "Format, marges, en-têtes, ordre des pages." },
    { n: 3, title: "Préparez l'impression", desc: "Choisissez les pages par feuille et les marges." },
    { n: 4, title: "Téléchargez ou imprimez", desc: "PDF final ou boîte de dialogue du navigateur." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-background dark:via-blue-950/10 dark:to-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 dark:bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => setView("landing")}
            className="flex items-center gap-3"
          >
            <Image
              src="/logo.png"
              alt="PDF Studio"
              width={40}
              height={40}
              className="rounded-lg shadow-sm"
              priority
            />
            <div className="text-left">
              <div className="font-bold text-lg leading-tight text-foreground">PDF Studio</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Mise en page & impression
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setView("login")}>
              Se connecter
            </Button>
            <Button onClick={() => setView("login")} className="gap-1.5">
              Démarrer
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid lg:grid-cols-2 gap-10 items-center"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              Traitement 100% local · Aucun envoi serveur
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Mettez en page et imprimez vos{" "}
              <span className="text-primary">PDF</span> en toute confidentialité
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Importez vos documents, réorganisez les pages, choisissez le format
              et les marges, puis préparez l'impression en 1, 2, 4, 8 ou 16 pages
              par feuille. Tout se passe dans votre navigateur.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => setView(user ? "dashboard" : "login")}
                className="gap-2 text-base"
              >
                <LogIn className="h-5 w-5" />
                {user ? "Accéder à mon studio" : "Connexion gratuite"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setView("dashboard")}
                className="gap-2 text-base"
              >
                <Zap className="h-5 w-5" />
                Essayer sans compte
              </Button>
            </div>
            <div className="flex flex-wrap items gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                Sans inscription
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                Sans limite
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                Gratuit
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative aspect-square max-w-md mx-auto w-full"
          >
            <Image
              src="/logo.png"
              alt="PDF Studio Logo"
              fill
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-contain drop-shadow-2xl"
              priority
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Zap className="h-3 w-3" />
            Fonctionnalités
          </div>
          <h2 className="text-3xl font-bold">Tout ce dont vous avez besoin</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Un seul outil pour importer, modifier, mettre en page et imprimer vos PDF.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg hover:border-primary/40 transition-all">
                  <CardContent className="p-5 space-y-3">
                    <div className="inline-flex rounded-lg bg-primary/10 p-2.5 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-muted/30 border-y">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-16">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl font-bold">Comment ça marche ?</h2>
            <p className="text-muted-foreground">Quatre étapes simples, du fichier brut à l'impression finale.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="relative space-y-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-md">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent docs (if any) */}
      {recents.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 md:px-8 py-12">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Vos documents récents</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {recents.slice(0, 4).map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileEdit className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.pageCount} pages · {new Date(doc.openedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setView("login")}>
                    Ouvrir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-16">
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-8 md:p-12 text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">Prêt à mettre en page vos PDF ?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Connectez-vous pour accéder à votre studio personnel et à tous les outils.
            </p>
            <Button size="lg" onClick={() => setView("login")} className="gap-2 text-base">
              <LogIn className="h-5 w-5" />
              Accéder à PDF Studio
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="PDF Studio" width={24} height={24} className="rounded" />
            <span>© 2026 PDF Studio · Tous droits réservés</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Confidentialité garantie</span>
            <span>Traitement local</span>
            <span>FR</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
