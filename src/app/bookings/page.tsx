export const dynamic = "force-dynamic";
/* 
  force-dynamic = sidan renderas alltid dynamiskt på servern, 
  vilket är viktigt eftersom bokningsdata kan ändras ofta (ingen statisk cache).
*/
export const revalidate = false; 
/* 
  revalidate = false betyder att Next.js inte cachelagrar sidan alls.
  Varje gång sidan laddas hämtas färsk data (t.ex. aktuella bokningar).
*/
import { Suspense } from "react";
import BookingsClient from "./BookingClient";
/* 
  BookingsClient är en klientsidekomponent som innehåller logiken för att
  hämta, visa och hantera användarens bokningar. 
*/

/*

  Detta är en serverkomponent (per default i Next.js 13+), 
  men den använder <Suspense> för att asynkront ladda en klientsidekomponent
  (`BookingsClient`), vilket ger användaren en "Laddar..."-fallback under tiden.
*/
export default function BookingsPage() {
  return (
     // Suspense visar fallback-innehållet medan BookingsClient laddas
    <Suspense fallback={<div className="p-6 text-gray-500">Laddar bokningar…</div>}>
      <BookingsClient />
    </Suspense>
  );
}
