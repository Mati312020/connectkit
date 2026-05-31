import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { appConfig } from "@/config/app.config";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar simple */}
      <header className="border-b px-4 h-16 flex items-center justify-between max-w-6xl mx-auto">
        <p className="font-bold text-lg" style={{ color: appConfig.theme.primaryColor }}>
          {appConfig.name}
        </p>
        <div className="flex gap-3">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Iniciar sesión
          </Link>
          <Link href="/register" className={buttonVariants()}>
            Registrarse
          </Link>
        </div>
      </header>

      <main>
        <Hero />
        <Features />
        <HowItWorks />
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {appConfig.name} — Construido con{" "}
          <a href="https://github.com/bytecraft" className="underline">
            ConnectKit
          </a>
        </p>
      </footer>
    </div>
  );
}
