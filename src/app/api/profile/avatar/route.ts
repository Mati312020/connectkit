import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadBuffer, deleteFile } from "@/lib/storage/supabase-storage";
import { logServerEvent } from "@/lib/logger.server";
import prisma from "@/lib/prisma";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = "avatars";

// POST /api/profile/avatar — sube o reemplaza la foto de perfil del usuario
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("avatar") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
  }

  // ── Validaciones ──────────────────────────────────────────
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Usá JPG, PNG o WebP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "El archivo supera el límite de 5 MB." },
      { status: 400 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: user.id },
    select: { id: true, avatarUrl: true },
  });

  if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // ── Eliminar avatar anterior si existe ────────────────────
  if (dbUser.avatarUrl) {
    // Extraer el path relativo de la URL pública
    const prevPath = extractStoragePath(dbUser.avatarUrl, BUCKET);
    if (prevPath) {
      await deleteFile(BUCKET, prevPath).catch(() => null); // best-effort
    }
  }

  // ── Subir nuevo avatar ────────────────────────────────────
  const ext      = file.type.split("/")[1].replace("jpeg", "jpg");
  const path     = `${dbUser.id}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadBuffer(BUCKET, path, buffer, file.type);

  // Agregar cache-busting para que el browser no muestre la imagen anterior
  const avatarUrl = `${uploaded.publicUrl}?v=${Date.now()}`;

  await prisma.user.update({
    where: { id: dbUser.id },
    data:  { avatarUrl },
  });

  logServerEvent("PROFILE_UPDATED", {
    userId:   dbUser.id,
    metadata: { field: "avatarUrl", fileType: file.type, fileSize: file.size },
  });

  return NextResponse.json({ avatarUrl });
}

// DELETE /api/profile/avatar — elimina la foto de perfil
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: user.id },
    select: { id: true, avatarUrl: true },
  });

  if (!dbUser?.avatarUrl) {
    return NextResponse.json({ error: "No tenés foto de perfil" }, { status: 404 });
  }

  const prevPath = extractStoragePath(dbUser.avatarUrl, BUCKET);
  if (prevPath) await deleteFile(BUCKET, prevPath).catch(() => null);

  await prisma.user.update({
    where: { id: dbUser.id },
    data:  { avatarUrl: null },
  });

  return NextResponse.json({ success: true });
}

// Extrae el path relativo dentro del bucket a partir de la URL pública
function extractStoragePath(url: string, bucket: string): string | null {
  try {
    const urlObj = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx    = urlObj.pathname.indexOf(marker);
    if (idx === -1) return null;
    return urlObj.pathname.slice(idx + marker.length).split("?")[0];
  } catch {
    return null;
  }
}
