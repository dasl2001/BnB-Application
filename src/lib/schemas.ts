import { z } from "zod";
const stripWeird = (s: string) =>
  s.normalize("NFKC").replace(/[\u200B-\u200D\u2060\u00A0]/g, "").trim();
const EmailSanitized = z
  .string()
  .transform((s) => stripWeird(s).toLowerCase())
  .pipe(z.string().email("Ogiltig e-post"));
export const propertyCreate = z.object({
  name: z.string().min(2, "Minst 2 tecken").transform(stripWeird),
  description: z.string().optional().nullable(),
  location: z.string().min(2, "Minst 2 tecken").transform(stripWeird),
  price_per_night: z.number().positive("Måste vara > 0"),
  availability: z.boolean().optional().default(true),
  image_url: z.string().url("Ogiltig URL").optional().nullable(),
});
export const propertyPatch = propertyCreate.partial();
export const bookingCreate = z.object({
  property_id: z.string().uuid("Ogiltigt UUID"),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
});
export const registerInput = z.object({
  name: z.string().min(2, "Minst 2 tecken").transform(stripWeird),
  email: EmailSanitized,
  password: z.string().min(6, "Minst 6 tecken").transform(stripWeird),
});
export const loginInput = z.object({
  email: EmailSanitized,
  password: z.string().min(6, "Minst 6 tecken").transform(stripWeird),
});
