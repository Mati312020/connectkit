import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import prisma from "@/lib/prisma";

export default async function ProviderProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where:   { supabaseId: user.id },
    include: { providerProfile: true },
  });

  if (!dbUser) redirect("/login");

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      <Card>
        <CardHeader>
          <AvatarUpload
            currentUrl={dbUser.avatarUrl}
            userName={dbUser.name ?? dbUser.email}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-semibold text-lg">{dbUser.name ?? "Sin nombre"}</p>
            <p className="text-sm text-muted-foreground">{dbUser.email}</p>
            {dbUser.phone && (
              <p className="text-sm text-muted-foreground">{dbUser.phone}</p>
            )}
          </div>

          {dbUser.providerProfile?.isVerified && (
            <Badge>Verificado ✓</Badge>
          )}

          {dbUser.providerProfile?.bio && (
            <p className="text-sm">{dbUser.providerProfile.bio}</p>
          )}

          {(dbUser.providerProfile?.categories ?? []).length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {dbUser.providerProfile!.categories.map((cat) => (
                <Badge key={cat} variant="secondary">{cat}</Badge>
              ))}
            </div>
          )}

          {dbUser.providerProfile && (
            <p className="text-sm text-muted-foreground">
              ⭐ {dbUser.providerProfile.rating.toFixed(1)}{" "}
              ({dbUser.providerProfile.totalReviews} reseñas)
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
