import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { appConfig } from "@/config/app.config";

export function Hero() {
  return (
    <section className="py-20 px-4 text-center">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          {appConfig.tagline}
        </h1>
        <p className="text-xl text-muted-foreground">
          Encontrá a la {appConfig.roles.provider.singular.toLowerCase()} ideal para tu{" "}
          {appConfig.roles.client.singular.toLowerCase()}. Reservas simples, pagos seguros.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            Empezar gratis
          </Link>
          <Link
            href="/dashboard/client/search"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Ver {appConfig.roles.provider.plural.toLowerCase()}
          </Link>
        </div>
      </div>
    </section>
  );
}
