/*
  Säger till Next.js att denna sida alltid ska renderas dynamiskt på servern.
  Detta är viktigt eftersom inloggning handlar om autentisering (cookies, tokens)
  och därför inte får cachelagras eller serveras statiskt.
*/
export const dynamic = "force-dynamic";
/*
  Inaktiverar statisk återvalidering (ISR) helt.
  Sidan genereras på nytt varje gång den laddas (ingen cache).
  Det är extra viktigt för auth-sidor så att användaren alltid ser aktuell inloggningsstatus.
*/
export const revalidate = false; 

import { Suspense } from "react";
/*
  LoginClient är en klientsidekomponent som innehåller själva formuläret
  och logiken för att logga in användaren via backend (`/api/auth/login`).
*/
import LoginClient from "./LoginClient";
    /*
      React Suspense:
      Gör det möjligt att visa ett fallback-gränssnitt ("Laddar inloggning...")
      medan `LoginClient` laddas och initialiseras.
    */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Laddar inloggning...</div>}>
      {/* LoginClient innehåller själva inloggningsformuläret */}
      <LoginClient />
    </Suspense>
  );
}
