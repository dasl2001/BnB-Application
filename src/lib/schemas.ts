/*
Zod-scheman för validering
Denna fil innehåller alla datavalideringsregler som används i backend (Hono API).
Fördelar:
äkerställer korrekt och sanerad indata
Ger tydliga felmeddelanden till frontend
Förhindrar injection och datakrasch i databasen
*/
import { z } from "zod";

/*
Rensar bort osynliga tecken (zero-width, NBSP) och normaliserar Unicode
*/
const stripWeird = (s: string) =>
  s.normalize("NFKC").replace(/[\u200B-\u200D\u2060\u00A0]/g, "").trim();

/*
 E-postfält: sanering + validering
Tar bort konstiga tecken
Gör små bokstäver
Kontrollerar att det är en giltig e-postadress
*/
const EmailSanitized = z
  .string()
  .transform((s) => stripWeird(s).toLowerCase())
  .pipe(z.string().email("Ogiltig e-post"));

/*
Används när användaren skapar ett nytt boende.
Validerar alla fält, ser till att pris och namn är korrekta.
*/
export const propertyCreate = z.object({
  name: z.string().min(2, "Minst 2 tecken").transform(stripWeird),
  description: z.string().optional().nullable(),
  location: z.string().min(2, "Minst 2 tecken").transform(stripWeird),
  price_per_night: z.number().positive("Måste vara > 0"),
  availability: z.boolean().optional().default(true),
  image_url: z.string().url("Ogiltig URL").optional().nullable(),
});

/*
Används för uppdateringar (PATCH).
Gör alla fält valfria genom `.partial()`.
*/
export const propertyPatch = propertyCreate.partial();

/*
Används vid skapande av en bokning.
UUID-validering för property_id
Datumformatkontroll (YYYY-MM-DD)
*/
export const bookingCreate = z.object({
  property_id: z.string().uuid("Ogiltigt UUID"),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
});

/*
Används vid användarregistrering.
Namn: minst 2 tecken
E-post: saneras och valideras
Lösenord: minst 6 tecken
*/
export const registerInput = z.object({
  name: z.string().min(2, "Minst 2 tecken").transform(stripWeird),
  email: EmailSanitized,
  password: z.string().min(6, "Minst 6 tecken").transform(stripWeird),
});

/*
Används vid inloggning.
Samma regler som registrering men utan namn.
*/
export const loginInput = z.object({
  email: EmailSanitized,
  password: z.string().min(6, "Minst 6 tecken").transform(stripWeird),
});
