import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { formatCurrency } from "@/lib/utils";
import { appConfig } from "@/config/app.config";
import prisma from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProviderPublicPage({ params }: Props) {
  const { slug } = await params;

  const profile = await prisma.providerProfile.findUnique({
    where: { slug },
    include: {
      user: true,
      availability: { orderBy: { dayOfWeek: "asc" } },
      reviews: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!profile) notFound();

  const initials = (profile.user.name || profile.user.email).slice(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Header del proveedor */}
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{profile.user.name}</h1>
            {profile.isVerified && <Badge>Verificado ✓</Badge>}
          </div>
          <p className="text-muted-foreground">{profile.bio}</p>
          <div className="flex flex-wrap gap-2">
            {profile.categories.map((cat) => (
              <Badge key={cat} variant="secondary">{cat}</Badge>
            ))}
          </div>
          <p className="font-semibold text-lg">
            {formatCurrency(profile.hourlyRate * 100)}/h
          </p>
          <p className="text-sm text-muted-foreground">
            ⭐ {profile.rating.toFixed(1)} ({profile.totalReviews} reseñas)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendario de reserva */}
        <Card>
          <CardHeader>
            <CardTitle>Reservar turno</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingCalendar
              availability={profile.availability as any}
              onSelect={() => {}}
            />
          </CardContent>
        </Card>

        {/* Reseñas */}
        {profile.reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Reseñas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.reviews.map((r) => (
                <div key={r.id} className="border-b pb-3 last:border-0">
                  <div className="flex gap-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <span key={i}>⭐</span>
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
