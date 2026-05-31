import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { appConfig } from "@/config/app.config";
import prisma from "@/lib/prisma";

export default async function ClientSearchPage() {
  const providers = await prisma.providerProfile.findMany({
    include: { user: true },
    where: { user: { status: "ACTIVE" } },
    orderBy: { rating: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Buscar {appConfig.roles.provider.plural}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Avatar>
                <AvatarFallback>
                  {(p.user.name || p.user.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm">{p.user.name || "Sin nombre"}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  ⭐ {p.rating.toFixed(1)} · {p.totalReviews} reseñas
                </p>
              </div>
              {p.isVerified && <Badge className="ml-auto text-xs">Verificado</Badge>}
            </CardHeader>
            <CardContent className="space-y-3">
              {p.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{p.bio}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {p.categories.slice(0, 3).map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {formatCurrency(p.hourlyRate * 100)}/h
                </span>
                <Link href={`/providers/${p.slug}`} className={buttonVariants({ size: "sm" })}>
                  Ver perfil
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
