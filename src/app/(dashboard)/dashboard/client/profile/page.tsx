import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import prisma from "@/lib/prisma";

export default async function ClientProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where:   { supabaseId: user.id },
    include: { clientProfile: true },
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
        <CardContent className="space-y-2 text-sm">
          <p className="font-semibold text-base">{dbUser.name ?? "Sin nombre"}</p>
          <p className="text-muted-foreground">{dbUser.email}</p>
          {dbUser.phone && (
            <p className="text-muted-foreground">{dbUser.phone}</p>
          )}
          {dbUser.clientProfile?.address && (
            <p>
              <span className="text-muted-foreground">Dirección:</span>{" "}
              {dbUser.clientProfile.address}
            </p>
          )}
          {dbUser.clientProfile?.notes && (
            <p>
              <span className="text-muted-foreground">Notas:</span>{" "}
              {dbUser.clientProfile.notes}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
