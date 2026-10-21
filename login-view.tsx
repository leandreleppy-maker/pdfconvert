"use client";

import { useState } from "react";
import {
  ArrowLeft,
  LogIn,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  Check,
} from "lucide-react";
import { usePdfStore } from "@/store/pdf-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";

export function LoginView() {
  const setView = usePdfStore((s) => s.setView);
  const login = usePdfStore((s) => s.login);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Veuillez saisir un email valide.");
      return;
    }
    if (password.length < 4) {
      toast.error("Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      toast.error("Veuillez saisir votre nom.");
      return;
    }
    setBusy(true);
    // Mock auth — no real backend, just local session
    await new Promise((r) => setTimeout(r, 600));
    login(email, mode === "signup" ? name.trim() : undefined);
    toast.success(mode === "login" ? "Connexion réussie !" : "Compte créé avec succès !");
    setBusy(false);
    setView("dashboard");
  };

  const handleGuest = () => {
    login("invite@pdfstudio.local", "Invité");
    toast.success("Bienvenue en mode invité !");
    setView("dashboard");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left: form */}
      <div className="flex flex-col p-6 md:p-10">
        <button
          onClick={() => setView("landing")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </button>

        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md space-y-6"
          >
            <div className="text-center space-y-3">
              <Image
                src="/logo.png"
                alt="PDF Studio"
                width={64}
                height={64}
                className="mx-auto rounded-xl shadow-md"
                priority
              />
              <div>
                <h1 className="text-2xl font-bold">
                  {mode === "login" ? "Connexion" : "Créer un compte"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode === "login"
                    ? "Accédez à votre studio PDF personnel"
                    : "Inscription gratuite en 30 secondes"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jean Dupont"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={busy} className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                {busy
                  ? "Traitement…"
                  : mode === "login"
                    ? "Se connecter"
                    : "Créer mon compte"}
              </Button>
            </form>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-[11px] text-muted-foreground">
                OU
              </span>
            </div>

            <Button variant="outline" onClick={handleGuest} className="w-full gap-2">
              <Shield className="h-4 w-4" />
              Continuer en invité
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? "Pas encore de compte ? " : "Vous avez déjà un compte ? "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary font-medium hover:underline"
              >
                {mode === "login" ? "Inscrivez-vous" : "Connectez-vous"}
              </button>
            </p>

            <p className="text-center text-[11px] text-muted-foreground">
              🔒 Vos identifiants restent stockés localement sur votre appareil.
              Aucune donnée n'est envoyée à un serveur.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right: branding */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary to-blue-700 text-white p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
          <Image
            src="/logo.png"
            alt=""
            width={400}
            height={400}
            className="object-contain"
          />
        </div>
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="PDF Studio"
              width={48}
              height={48}
              className="rounded-lg shadow-md bg-white/10 backdrop-blur"
            />
            <div>
              <div className="font-bold text-xl">PDF Studio</div>
              <div className="text-xs text-white/80 uppercase tracking-wider">
                Mise en page & impression
              </div>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Vos PDF, votre studio, en toute confidentialité.
          </h2>
          <p className="text-white/90 max-w-md">
            Importez, modifiez, mettez en page et imprimez vos documents PDF
            directement dans votre navigateur. Aucune donnée ne quitte votre appareil.
          </p>
          <ul className="space-y-3">
            {[
              "Éditeur complet avec glisser-déposer",
              "Impression 1/2/4/8/16 pages par feuille",
              "Fusion et découpe de PDF",
              "100% confidentiel, traitement local",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-white/70">
          © 2026 PDF Studio · Tous droits réservés
        </div>
      </div>
    </div>
  );
}
