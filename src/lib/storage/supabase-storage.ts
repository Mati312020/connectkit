// Supabase Storage — helper para subir archivos desde el servidor
// Requiere SUPABASE_SERVICE_ROLE_KEY (nunca exponer al cliente)

import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const roleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !roleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas");
  }

  return createClient(url, roleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface UploadResult {
  path:       string;
  publicUrl:  string;
}

// Sube un Buffer al bucket indicado y retorna la URL pública
export async function uploadBuffer(
  bucket:   string,
  path:     string,
  buffer:   Buffer,
  mimeType: string
): Promise<UploadResult> {
  const supabase = getServiceClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType:  mimeType,
      upsert:       true, // sobreescribir si ya existe (reprocesos)
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return { path, publicUrl: data.publicUrl };
}

// Elimina un archivo del bucket
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase.storage.from(bucket).remove([path]);
}

// Genera una URL firmada (privada, expira en N segundos)
export async function getSignedUrl(
  bucket:  string,
  path:    string,
  expiresIn = 3600
): Promise<string> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data) throw new Error(`Signed URL failed: ${error?.message}`);
  return data.signedUrl;
}
