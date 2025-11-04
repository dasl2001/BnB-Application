/*
 Denna fil innehåller två typer av Supabase-klienter:
 1. `supa()`  → används av vanliga (autentiserade) användare
 2. `supaAdmin()` → används av servern med full åtkomst (bypassar RLS)
Båda använder miljövariabler för säker och flexibel konfiguration.
*/


import { createClient } from "@supabase/supabase-js";

/*
Hjälpfunktion: kastar fel om en miljövariabel saknas
*/
const need = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
};

/*
Skapar en Supabase-klient kopplad till en viss användare.
Om JWT-token anges sätts den i headers
så att Supabase kan verifiera vilken användare som gör requesten.
Används i alla Hono-rutter 
NEXT_PUBLIC_SUPABASE_URL	offentlig	URL till ditt Supabase-projekt
NEXT_PUBLIC_SUPABASE_ANON_KEY	offentlig	används av frontend och anonyma användare
SUPABASE_SERVICE_ROLE_KEY	hemlig	används endast på servern (admin)
*/
export function supa(jwt?: string) {
  const url = need("NEXT_PUBLIC_SUPABASE_URL");
  const key = need("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, key, {

/*
Lägg till Authorization-header om användaren är inloggad
*/
    global: { headers: jwt ? { Authorization: `Bearer ${jwt}` } : {} },
  });
}

/*
Skapar en Supabase-klient med service role key.
Denna bypassar RLS (Row Level Security) och används för interna operationer som inte ska begränsas av användarens rättigheter.
Exempel: bokningskontroll i `/is-booked` eller vid registering när ny user-post skapas i `users`-tabellen.
Viktigt: får ALDRIG användas på klienten (frontend), rftersom `SUPABASE_SERVICE_ROLE_KEY` ger full tillgång till databasen.
*/
export function supaAdmin() {
  const url = need("NEXT_PUBLIC_SUPABASE_URL");
  const key = need("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}




