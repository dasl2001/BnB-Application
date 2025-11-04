import type { Context } from "hono";
import type { Vars } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js"; 

/*
Kontrollera om vi kör i utvecklingsläge eller produktion
*/
export const isDev = process.env.NODE_ENV !== "production";

/*
Rensar strängar från onödiga specialtecken, osynliga unicode-tecken och mellanslag
*/
export const clean = (v: string) =>
  String(v ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\u2060\u00A0]/g, "")
    .trim();

/*
Formaterar ett datum till ISO-format (YYYY-MM-DD)
*/
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/*
Beräknar måndag i den vecka som ett datum tillhör (används vid "veckoskydd")
*/
export function weekStart(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const diffToMon = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diffToMon);
  return isoDate(d);
}

/*
Beräknar söndag i samma vecka som ett datum (6 dagar efter måndag)
*/
export function weekEnd(dateStr: string) {
  const start = new Date(weekStart(dateStr) + "T00:00:00");
  start.setDate(start.getDate() + 6);
  return isoDate(start);
}

/*
Kräver att användaren är inloggad.
Hämtar authUser från context (som sätts i vår middleware). 
Om ingen användare finns -> returnerar ett 401-svar.
Annars returneras `null` vilket signalerar "OK".
 */
export function requireAuth(c: Context<{ Variables: Vars }>) {
  const u = c.get("authUser");
  if (!u) return c.json({ error: "Unauthorized" }, 401);
  return null;
}

/*
Hämtar den interna användarens databas-ID (user.id) baserat på Supabase-auth ID:t.
Detta används för att koppla ihop tabellerna:
users.auth_user_id  ←→  Supabase user.id
Vi lagrar relationen i vår egen `users`-tabell för att enklare kunna använda foreign keys.
 */
export async function currentUserId(
  db: SupabaseClient,
  authUserId: string
): Promise<string> {
  const { data, error } = await db
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (error || !data) {
    throw new Error("User mapping missing");
  }
  return data.id as string;
}

