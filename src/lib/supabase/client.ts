import { createBrowserClient } from "@supabase/ssr";
import { appConfig } from "@/config/app.config";

export function createClient() {
  return createBrowserClient(
    appConfig.supabase.url,
    appConfig.supabase.anonKey
  );
}
