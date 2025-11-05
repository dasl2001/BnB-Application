/*
Denna fil hanterar alla CRUD-operationer för bokningar:
- Skapa ny bokning
- Läsa sina egna bokningar
- Uppdatera datum
- Ta bort bokning

Filens logik:
- Använder autentisering via Supabase och kopplar användaren (User)
  till Property via relationen Booking.
- Databasen (Postgres) har ett EXCLUDE-constraint eller trigger som
  hindrar att flera användare bokar samma boende under överlappande datum.
- RLS (Row Level Security) säkerställer att användare bara ser
  och ändrar sina egna bokningar.
*/

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { bookingCreate } from "@/lib/schemas";
import { calcTotalPrice } from "@/lib/price";
import { requireAuth, currentUserId, weekStart, weekEnd } from "../utils";
import type { Vars } from "../types";

export const bookings = new Hono<{ Variables: Vars }>();


/* GET /api/bookings — Hämta alla bokningar som tillhör inloggad användare */
bookings.get("/", async (c) => {
   /* Kontrollera att användaren är inloggad */
  const unauth = requireAuth(c);
  if (unauth) return unauth;

   /* Hämta Supabase-klient och användar-ID */
  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);

    /* Hämta bokningar som ägs av användaren */
  const { data, error } = await db
    .from("bookings")
    .select("*, properties(*)")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ bookings: data });
});


/* GET /api/bookings/:id — Hämta en specifik bokning (endast egen) */
bookings.get("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);
  const id = c.req.param("id");

    /* Kontrollera att bokningen tillhör den inloggade användaren */
  const { data, error } = await db
    .from("bookings")
    .select("*, properties(*)")
    .eq("id", id)
    .eq("user_id", user_id)
    .single();

  if (error || !data) return c.json({ error: "Bokningen finns inte" }, 404);
  return c.json({ booking: data });
});


/* POST /api/bookings — Skapa ny bokning (förhindrar överlapp & dubbelbokning) */
bookings.post("/", zValidator("json", bookingCreate), async (c) => {
    /* Kontrollera autentisering */
  const unauth = requireAuth(c);
  if (unauth) return unauth;

   /* Initiera databasklient och användarinfo */
  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);
  /* Hämta indata från klienten */
  const { property_id, check_in_date, check_out_date } = c.req.valid("json");

  /* Kontrollera att datum inte ligger bakåt i tiden */
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = new Date(check_in_date);
  const checkOut = new Date(check_out_date);

  if (checkIn < today)
    return c.json({ error: "Du kan inte boka datum som redan har passerat." }, 400);
  if (checkOut <= checkIn)
    return c.json({ error: "Utcheckningsdatum måste vara efter incheckning." }, 400);

  /* Hämta property och ägare */
  const { data: prop, error: pe } = await db
    .from("properties")
    .select("price_per_night, owner_id")
    .eq("id", property_id)
    .single();

    /* Hämta boendets information och kontrollera att man inte bokar sitt eget */
  if (pe || !prop) return c.json({ error: "Boendet kunde inte hittas." }, 404);
  if (prop.owner_id === user_id)
    return c.json({ error: "Du kan inte boka ditt eget boende." }, 400);

  /* Kontrollera egna överlappande bokningar (per användare) */
  const { data: myOverlap } = await db
    .from("bookings")
    .select("id")
    .eq("user_id", user_id)
    .not("check_out_date", "lte", check_in_date)
    .not("check_in_date", "gte", check_out_date);

  if (myOverlap && myOverlap.length > 0)
    return c.json({ error: "Du har redan en bokning som överlappar dessa datum." }, 400);

  /* Vecko-skydd: endast en bokning per vecka */
  const weekStartStr = weekStart(check_in_date);
  const weekEndStr = weekEnd(check_out_date);
  const { data: weekOverlapUser } = await db
    .from("bookings")
    .select("id")
    .eq("user_id", user_id)
    .not("check_out_date", "lte", weekStartStr)
    .not("check_in_date", "gte", weekEndStr);

  if (weekOverlapUser && weekOverlapUser.length > 0)
    return c.json({ error: "Du har redan en bokning samma vecka." }, 400);

  /* Räkna ut totalpris */
  const total_price = calcTotalPrice(
    Number(prop.price_per_night),
    check_in_date,
    check_out_date
  );

  /* Skapa bokning (DB skyddar mot överlapp mellan användare) */
  const { data, error } = await db
    .from("bookings")
    .insert({
      user_id,
      property_id,
      check_in_date,
      check_out_date,
      total_price,
    })
    .select("*, properties(*)")
    .single();

  /* Fångar constraint- eller triggerfel från databasen */
  if (error) {
    const msg = String(error.message || "");
    if (
      msg.includes("bookings_no_overlap_per_property") ||
      msg.includes("overlap") ||
      msg.includes("prevent_booking_overlap") ||
      msg.includes("Boendet är redan bokat")
    ) {
      return c.json({ error: "Datumen är redan bokade för detta boende." }, 400);
    }
    return c.json({ error: msg }, 400);
  }

  return c.json({ booking: data }, 201);
});


/* PATCH /api/bookings/:id — Uppdatera datum i en egen bokning */
bookings.patch("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);
  const { id } = c.req.param();

  const body = await c.req.json().catch(() => null);
  const check_in_date: string | undefined = body?.check_in_date;
  const check_out_date: string | undefined = body?.check_out_date;
  if (!check_in_date || !check_out_date)
    return c.json({ error: "check_in_date och check_out_date krävs." }, 400);

  /* Validering av datum */
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = new Date(check_in_date);
  const checkOut = new Date(check_out_date);

  if (checkIn < today)
    return c.json({ error: "Du kan inte boka datum som redan har passerat." }, 400);
  if (checkOut <= checkIn)
    return c.json({ error: "Utcheckningsdatum måste vara efter incheckning." }, 400);

  /* Kontrollera att bokningen finns och ägs av användaren */
  const { data: booking, error: bErr } = await db
    .from("bookings")
    .select("id, user_id, property_id")
    .eq("id", id)
    .single();

  if (bErr || !booking) return c.json({ error: "Bokningen finns inte." }, 404);
  if (booking.user_id !== user_id)
    return c.json({ error: "Du saknar behörighet att ändra denna bokning." }, 403);

  /* Hämta property för att räkna om priset */
  const { data: prop, error: pErr } = await db
    .from("properties")
    .select("price_per_night")
    .eq("id", booking.property_id)
    .single();
  if (pErr || !prop)
    return c.json({ error: "Boendet saknas för denna bokning." }, 400);

  const total_price = calcTotalPrice(
    Number(prop.price_per_night),
    check_in_date,
    check_out_date
  );

  /* Uppdatera bokning */
  const { data: updated, error: uErr } = await db
    .from("bookings")
    .update({ check_in_date, check_out_date, total_price })
    .eq("id", id)
    .eq("user_id", user_id)
    .select("*, properties(*)")
    .single();

  /* Fångar samma typ av DB-fel här också */
  if (uErr) {
    const msg = String(uErr.message || "");
    if (
      msg.includes("bookings_no_overlap_per_property") ||
      msg.includes("overlap") ||
      msg.includes("prevent_booking_overlap") ||
      msg.includes("Boendet är redan bokat")
    ) {
      return c.json({ error: "Datumen är redan bokade för detta boende." }, 400);
    }
    return c.json({ error: msg }, 400);
  }

  return c.json({ booking: updated });
});


/* DELETE /api/bookings/:id — Ta bort egen bokning */
bookings.delete("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const db = c.get("supa");
  const auth = c.get("authUser")!;
  const user_id = await currentUserId(db, auth.id);
  const { id } = c.req.param();

   /* Kontrollera att bokningen finns och ägs av användaren */
  const { data: booking, error: rErr } = await db
    .from("bookings")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (rErr || !booking) return c.json({ error: "Bokningen finns inte." }, 404);
  if (booking.user_id !== user_id)
    return c.json({ error: "Du saknar behörighet att ta bort denna bokning." }, 403);

    /* Ta bort bokningen */
  const { error: dErr } = await db.from("bookings").delete().eq("id", id);
  if (dErr) return c.json({ error: dErr.message }, 400);
  return c.json({ ok: true });
});


