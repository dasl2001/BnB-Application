import { Hono } from "hono";
import type { Vars } from "./types";
import { ZodError } from "zod";

/*
Hono fungerar som ett litet, snabbt webbramverk för API-endpoints.
Här skapas en Hono-instans som är "root" för hela backendens API.
Alla rutter mountas senare härifrån, t.ex.:
app.route("/auth", auth);
app.route("/properties", properties);
app.route("/bookings", bookings);
basePath("/api") innebär att alla rutter automatiskt får prefixet /api/
så att ex. `auth` blir `/api/auth` osv.
*/
export const app = new Hono<{ Variables: Vars }>().basePath("/api"); // /auth -> /api/auth osv

/*
 Denna fångar upp alla fel som kastas i valfri route.
 Den returnerar ett JSON-svar istället för att krascha servern.
 */
app.onError((err, c) => {
  const cause = (err as Error & { cause?: unknown }).cause;

/*
Om felet orsakades av en Zod-validering (från zValidator)
*/
  if (cause instanceof ZodError) {
/*
Returnera tydligt felmeddelande med valideringsdetaljer
*/
    return c.json({ error: "Validation error", issues: cause.issues }, 400);
  }

/*
Annars, generellt serverfel
*/
  const message = err instanceof Error ? err.message : "Internal error";
  return c.json({ error: message ?? "Internal error" }, 500);
});

/*
En enkel "ping"-ruta som används för att testa att servern lever.
 När du besöker http://localhost:3000/api/__up så svarar den "ok".
*/
app.get("/__up", (c) => c.text("ok"));
