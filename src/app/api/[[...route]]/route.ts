import { handle } from "hono/vercel";
/* 
  `handle` gör att Hono kan användas tillsammans med Vercels Edge Runtime.
  Det “wrappar” Hono-appen så att Next.js känner igen den som en API-handler
  (t.ex. GET, POST, PATCH osv).
*/
import { app } from "@/server/hono/app";
/* 
  `app` är vår huvud-Hono-instans som definierats i `app.ts`.
  Den har t.ex. global error handling och basePath `/api`.
*/
import { supabaseMiddleware } from "@/server/hono/middleware";
/*
  Middleware som körs på alla inkommande requests.
  Den hämtar ev. auth-token (cookie eller Bearer header),
  skapar en Supabase-klient med rätt session och lagrar den i context (c.set()).
  Detta gör att alla routes får tillgång till användarens `authUser` och `supa`-klient.
*/
import { auth } from "@/server/hono/routes/auth";
import { properties } from "@/server/hono/routes/properties";
import { bookings } from "@/server/hono/routes/bookings";
/* 
    Här importeras våra separata Hono-routermoduler (modulär struktur):
  - `auth` hanterar registrering, login, logout, och /me
  - `properties` hanterar CRUD för boenden
  - `bookings` hanterar CRUD för bokningar + prisberäkning
*/
export const runtime = "edge";
/* 
  Sätter Hono till att köras i Vercels Edge Runtime.
  Det innebär snabbare svarstid och bättre global skalning,
  men kräver att all kod är kompatibel (inga Node-specifika moduler).
*/

/*
  Detta gör att varje request först går genom `supabaseMiddleware` innan
  den hanteras av sin specifika route (auth, properties, bookings).
  Middleware injicerar `supa` och `authUser` i contexten (`c.set()`),
  så alla routes kan använda `c.get("supa")` för att anropa databasen.
*/
app.use("*", supabaseMiddleware);

/*
  Detta skapar följande API-endpoints:
  /api/auth/register
  /api/auth/login
  /api/auth/me
  /api/auth/logout
  /api/properties
  /api/properties/my
  /api/properties/:id
  /api/properties/upload-image
  /api/bookings
  /api/bookings/:id
  (samt flera stöd-rutter för datumkontroller, t.ex. /is-booked)
*/
app.route("/auth", auth);
app.route("/properties", properties);
app.route("/bookings", bookings);

/*
  Detta gör att Next.js känner till att alla HTTP-metoder (GET, POST osv)
  hanteras av samma Hono-app. Vercel matchar inkommande requests mot dessa exports.
  Exempel:
  - En POST till `/api/auth/login` → går till vår Hono-app → matchas av `auth.post("/login")`
  - En DELETE till `/api/properties/:id` → matchas av `properties.delete("/:id")`
*/
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
