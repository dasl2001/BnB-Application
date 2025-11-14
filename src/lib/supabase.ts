import { createClient } from "@supabase/supabase-js";
const need = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
};
export function supa(jwt?: string) {
  const url = need("NEXT_PUBLIC_SUPABASE_URL");
  const key = need("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, key, {
    global: { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} },
  });
}
export function supaAdmin() {
  const url = need("NEXT_PUBLIC_SUPABASE_URL");
  const key = need("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}




