import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";
import { supa } from "@/lib/supabase";
import type { Vars } from "./types";


/*
Denna middleware körs automatiskt före alla Hono-rutter.
Den ansvarar för att:
Läsa användarens access-token (JWT) från cookie eller Authorization-headern
Skapa en Supabase-klient med rätt autentisering
Hämta inloggad användare via Supabase Auth
Spara `supa` (databas-klient) och `authUser` (inloggad användare) i context
På så sätt kan alla API-rutter (t.ex. /api/properties, /api/bookings) använda `c.get("supa")` och `c.get("authUser")` utan att behöva hantera tokens själva.
*/
export const supabaseMiddleware: MiddlewareHandler<{ Variables: Vars }> = async (c, next) => {

/*
Hämta Supabase JWT-token från cookies
Dessa sätts automatiskt av Supabase vid inloggning.
sb-access-token = access_token (kortlivad)
sb-refresh-token = refresh_token (långlivad)
*/
  const accessToken = getCookie(c, "sb-access-token");
  const refreshToken = getCookie(c, "sb-refresh-token");

/*
Fallback: om ingen cookie hittas, försök läsa från Authorization-headern
Exempel: Authorization: Bearer <token>
*/
  const authHeader = c.req.header("authorization");
  const jwt =
    accessToken ??
    (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined);

/*
Funktionen `supa(jwt)` skapar en instans som kan läsa/skriva mot databasen.
JWT-token skickas med i alla requests för att RLS (Row Level Security) i Supabase ska känna igen rätt användare via auth.uid().
*/
  const client = supa(jwt);

/*
Lägg även till tokens som headers (hjälper särskilt vid server-side miljöer)
Ställ in aktiv session manuellt (säkerställer att båda tokens används)
Detta gör att Supabase kan hämta en ny access token med refresh token vid behov.
*/
  if (jwt) {
    client.auth.setSession({
      access_token: jwt,
      refresh_token: refreshToken ?? "",
    });
  }

/*
Lägg till klienten i Hono:s context
Gör att du senare i valfri route kan använda:
onst db = c.get("supa");
*/
  c.set("supa", client);

/*
Hämta användardata via Supabase-auth
Om ingen är inloggad → sätt `authUser` till null
*/
  const { data } = await client.auth.getUser();
  c.set("authUser", data.user ? { id: data.user.id } : null);

/*
Fortsätt till nästa middleware eller route
*/
  await next();
};
