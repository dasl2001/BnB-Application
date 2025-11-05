/*
Denna fil innehåller alla CRUD-rutter för boenden ("properties"):

Funktioner:
- Skapa, läsa, uppdatera och ta bort boenden
- Visa sina egna eller andras boenden
- Kontrollera bokningsstatus för ett boende
- Ladda upp bilder till Supabase Storage
- Automatisk borttag av bild från Storage när boendet raderas

 Säkerhet (RLS - Row Level Security):
- Endast ägaren kan ändra eller ta bort sina egna properties.
- Autentisering krävs via Supabase JWT.
*/

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { propertyCreate, propertyPatch } from "@/lib/schemas";
import { requireAuth, currentUserId } from "../utils";
import { supaAdmin } from "@/lib/supabase";
import type { Vars } from "../types";
import { z } from "zod";
/* Skapa router för /api/properties */
export const properties = new Hono<{ Variables: Vars }>();


/*GET /api/properties — Hämta alla properties (publikt tillgängligt)     */

properties.get("/", async (c) => {
  const db = c.get("supa");

  const { data, error } = await db
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ properties: data });
});


/* GET /api/properties/my — Hämta alla properties som tillhör inloggad användare */
properties.get("/my", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const db = c.get("supa");
  const auth = c.get("authUser");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const owner_id = await currentUserId(db, auth.id);

  const { data, error } = await db
    .from("properties")
    .select("*")
    .eq("owner_id", owner_id)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ properties: data });
});


/* GET /api/properties/others — Hämta andras (bokningsbara) boenden       */
properties.get("/others", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const db = c.get("supa");
  const auth = c.get("authUser");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const myId = await currentUserId(db, auth.id);
 /* Hämta alla boenden som inte tillhör den inloggade användaren */
  const { data, error } = await db
    .from("properties")
    .select("*")
    .neq("owner_id", myId)
    .eq("availability", true)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ properties: data });
});


/* POST /api/properties — Skapa nytt boende (hindrar dubbletter)           */
properties.post("/", zValidator("json", propertyCreate), async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const db = c.get("supa");
  const auth = c.get("authUser");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const owner_id = await currentUserId(db, auth.id);
  const body = c.req.valid("json");

  /* Normalisera värden för att upptäcka dubbletter (case-insensitivt) */
  const normalizedName = body.name.trim().toLowerCase();
  const normalizedImage = body.image_url?.trim().toLowerCase() ?? "";

  /* Hämta befintliga boenden för ägaren */
  const { data: existing, error: checkErr } = await db
    .from("properties")
    .select("id, name, image_url")
    .eq("owner_id", owner_id);

  if (checkErr) return c.json({ error: checkErr.message }, 400);

  /* Kontrollera om det redan finns ett boende med samma namn eller bild */
  const hasDuplicate = existing?.some((p) => {
    const sameName = p.name.trim().toLowerCase() === normalizedName;
    const sameImage =
      (p.image_url ?? "").trim().toLowerCase() === normalizedImage;
    return sameName || (normalizedImage && sameImage);
  });

  /* Om dubblett hittas — ta bort eventuell uppladdad bild från storage */
  if (hasDuplicate) {
    if (normalizedImage) {
      try {
        const bucket = "property-images";
        const path = normalizedImage.split("/property-images/")[1];
        if (path) await db.storage.from(bucket).remove([path]);
      } catch (e) {
        console.warn("Kunde inte ta bort bild vid dubblett:", e);
      }
    }
    return c.json(
      { error: "Du har redan en listning med samma namn eller bild." },
      400
    );
  }

  /* Skapa nytt boende */
  const { data, error } = await db
    .from("properties")
    .insert({ ...body, owner_id })
    .select("*")
    .single();

  /* Om skapandet misslyckas — ta bort uppladdad bild */
  if (error) {
    if (normalizedImage) {
      try {
        const bucket = "property-images";
        const path = normalizedImage.split("/property-images/")[1];
        if (path) await db.storage.from(bucket).remove([path]);
      } catch (e) {
        console.warn("Kunde inte ta bort bild vid unique-fel:", e);
      }
    }
    return c.json(
      { error: "Du har redan en listning med samma namn eller bild." },
      400
    );
  }

  return c.json({ property: data }, 201);
});


/* PATCH /api/properties/:id — Uppdatera boende (ägarkontroll)            */
properties.patch("/:id", zValidator("json", propertyPatch), async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const db = c.get("supa");
  const auth = c.get("authUser");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();
  const me = await currentUserId(db, auth.id);

  /* Kontrollera att användaren äger boendet */
  const { data: ownerRow } = await db
    .from("properties")
    .select("owner_id")
    .eq("id", id)
    .single();

  if (!ownerRow) return c.json({ error: "Property not found" }, 404);
  if (ownerRow.owner_id !== me) return c.json({ error: "Forbidden" }, 403);

  const patch = c.req.valid("json");

  /* Uppdatera boendet */
  const { data, error } = await db
    .from("properties")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ property: data });
});


/* DELETE /api/properties/:id — Ta bort boende + bild via admin access     */
properties.delete("/:id", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const db = c.get("supa");
  const admin = supaAdmin(); // använd admin-klienten
  const auth = c.get("authUser");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();
  const me = await currentUserId(db, auth.id);

  /* Kontrollera att användaren äger boendet */
  const { data: property, error: findErr } = await db
    .from("properties")
    .select("owner_id, image_url")
    .eq("id", id)
    .single();

  if (findErr || !property) return c.json({ error: "Property not found" }, 404);
  if (property.owner_id !== me) return c.json({ error: "Forbidden" }, 403);

  /* Radera boendet först */
  const { error: delErr } = await db.from("properties").delete().eq("id", id);
  if (delErr) return c.json({ error: delErr.message }, 400);

  /* Radera tillhörande bild (nu via admin-klienten) */
  if (property.image_url) {
    try {
      const bucket = "property-images";
      const imageUrl = property.image_url;
      const match = imageUrl.match(/property-images\/([^?]+)/);
      const path = match ? match[1] : null;

      if (path) {
        const { error: storageErr } = await admin.storage
          .from(bucket)
          .remove([path]); // full behörighet

        if (storageErr) {
          console.warn("Kunde inte ta bort bild från storage:", storageErr);
        } else {
          console.log("Bild borttagen från storage:", path);
        }
      } else {
        console.warn(" Hittade ingen giltig sökväg i image_url:", imageUrl);
      }
    } catch (e) {
      console.warn(" Fel vid borttagning av bild:", e);
    }
  }

  return c.json({
    ok: true,
    message: "Boendet och tillhörande bild togs bort.",
  });
});




/* GET /api/properties/:id — Hämta ett specifikt boende                   */
properties.get("/:id", async (c) => {
  const db = c.get("supa");
  const { id } = c.req.param();

  const { data, error } = await db
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return c.json({ error: "Property not found" }, 404);
  return c.json({ property: data });
});


/* GET /api/properties/:id/is-booked — Kontrollera om boendet är bokat     */
const isBookedQuery = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

properties.get("/:id/is-booked", zValidator("query", isBookedQuery), async (c) => {
  const admin = supaAdmin();
  const { id } = c.req.param();
  const { from, to } = c.req.valid("query");

  /* Förhindra bokning av datum i dåtid */
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (from && new Date(from) < today) {
    return c.json(
      { error: "Du kan inte boka datum som redan har passerat." },
      400
    );
  }

  /* Grundfråga för att räkna bokningar */
  let q = admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("property_id", id);

  /* Lägg till intervallfilter om from/to anges */
  if (from && to)
    q = q.not("check_out_date", "lte", from).not("check_in_date", "gte", to);

  const { count, error } = await q;
  if (error) return c.json({ error: error.message }, 400);

  /* Returnera bokningsstatus */
  return c.json({
    is_booked: (count ?? 0) > 0,
    count: count ?? 0,
    scope: from && to ? { from, to } : null,
  });
});


/* POST /api/properties/upload-image — Ladda upp bild till Supabase Storage */
properties.post("/upload-image", async (c) => {
  const unauth = requireAuth(c);
  if (unauth) return unauth;

  const db = c.get("supa");
  const auth = c.get("authUser");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  /* Hämta filen från multipart-form-data */
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  /* Validera filtyp */
  if (!file) return c.json({ error: "Ingen fil vald" }, 400);
  if (!file.type.startsWith("image/"))
    return c.json({ error: "Endast bildfiler tillåts" }, 400);

  /* Rensa filnamn (säkerhetsmässigt) */
  const safeName = file.name.replace(/[^\w.\-]/g, "_").toLowerCase();
  const filename = `${auth.id}/${safeName}`;
  const bucket = "property-images";

  /* Kontrollera om samma fil redan finns */
  const { data: existing, error: listErr } = await db.storage
    .from(bucket)
    .list(auth.id);

  if (listErr) return c.json({ error: listErr.message }, 400);
  if (existing && existing.some((f) => f.name.toLowerCase() === safeName))
    return c.json({ error: "Du har redan laddat upp denna bild." }, 400);

  /* Ladda upp filen till Supabase Storage */
  const { error } = await db.storage.from(bucket).upload(filename, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    if (error.message.includes("exists"))
      return c.json({ error: "Du har redan laddat upp denna bild." }, 400);
    return c.json({ error: error.message }, 400);
  }

  /* Generera publik URL till bilden */
  const { data: publicUrl } = db.storage.from(bucket).getPublicUrl(filename);
  return c.json({ url: publicUrl.publicUrl });
});

