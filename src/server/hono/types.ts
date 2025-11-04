import type { SupabaseClient } from "@supabase/supabase-js";

/*
Variabler (context-variabler) som kan användas globalt i alla Hono-rutter.
 Dessa injiceras av vår middleware innan varje request.
 Detta gör att vi slipper importera Supabase-klienten eller authUser manuellt i varje route istället hämtas de via:
 const db = c.get("supa")
 const user = c.get("authUser")
 */
export type Vars = {

/*
Supabase-klient instans med korrekt autentisering.
Denna används i alla API-rutter för att anropa databasen.
*/
  supa: SupabaseClient;

/*
Inloggad användare (om någon).
Sätts i `supabaseMiddleware` genom:
const { data } = await client.auth.getUser()
Om ingen användare är inloggad → `null`
*/  
  authUser: { id: string } | null;
};
