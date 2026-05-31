// Script de setup inicial de Supabase Storage
// Crear los buckets requeridos por ConnectKit.
//
// Uso:
//   1. Copiar .env.example → .env.local y completar las variables
//   2. node scripts/setup-storage.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Cargar .env.local manualmente (sin dotenv como dependencia)
function loadEnv() {
  try {
    const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of envFile.split("\n")) {
      const [key, ...val] = line.split("=");
      if (key && !key.startsWith("#") && val.length) {
        process.env[key.trim()] = val.join("=").trim();
      }
    }
  } catch {
    // .env.local no existe → usar las vars del entorno actual
  }
}

loadEnv();

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const roleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !roleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas.");
  console.error("   Asegurate de tener .env.local configurado.");
  process.exit(1);
}

const supabase = createClient(url, roleKey, { auth: { persistSession: false } });

const BUCKETS = [
  {
    id:               "avatars",
    public:           true,
    fileSizeLimit:    5 * 1024 * 1024,  // 5 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    id:               "invoices",
    public:           true,
    fileSizeLimit:    10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ["application/pdf"],
  },
];

async function main() {
  console.log("🚀 ConnectKit — Setup de Supabase Storage\n");

  for (const bucket of BUCKETS) {
    const { error } = await supabase.storage.createBucket(bucket.id, {
      public:           bucket.public,
      fileSizeLimit:    bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    });

    if (error?.message?.includes("already exists")) {
      console.log(`✓ Bucket "${bucket.id}" ya existía`);
    } else if (error) {
      console.error(`✗ Error en bucket "${bucket.id}": ${error.message}`);
    } else {
      console.log(`✓ Bucket "${bucket.id}" creado`);
    }
  }

  console.log("\n✅ Storage listo.");
  console.log("\nPróximos pasos:");
  console.log("  1. Configurar Auth redirect URLs en Supabase Dashboard:");
  console.log(`     https://supabase.com/dashboard/project/_/auth/url-configuration`);
  console.log("     Agregar: <tu-dominio>/api/auth/callback");
  console.log("     Agregar: http://localhost:3000/api/auth/callback");
  console.log("  2. Ejecutar: npx prisma migrate deploy");
  console.log("  3. Deploy en Render");
}

main().catch(console.error);
