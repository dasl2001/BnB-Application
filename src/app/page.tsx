/*
Nödvändigt i Next.js för att köra React Hooks på klientsidan
*/
"use client";
import Guard from "./components/Guard";
import Link from "next/link";

/*
Detta är startsidan för applikationen "BnB".
Här visas olika huvudlänkar till användarens vyer:
Mina listningar (CRUD för Property)
Hitta boenden (Discover – andra användares properties)
Mina bokningar (CRUD för Booking)
Sidan är skyddad med <Guard>, vilket betyder att användaren måste vara inloggad för att kunna se innehållet.
Om användaren inte är inloggad, omdirigeras de automatiskt till /auth/login (via Guard-komponenten).
*/
export default function HomePage() {
  return (

/*
Guard-komponenten kollar auth-status via /api/auth/me (backend) och skyddar alla sidor som kräver inloggning.
*/
    <Guard>
      <main className="space-y-4">
        <h1 className="text-2xl font-bold">Välkommen till BnB</h1>

{/*
Länkar till olika vyer i applikationen 
*/}       
        <div className="space-x-3">

{/* 
CRUD för Property (egna listningar) 
*/}
          <Link className="btn" href="/properties">Min listning</Link>

{/* 
Läs andras properties (bokningsbara) 
*/}          
          <Link className="btn" href="/discover">Hitta boenden</Link>

{/* 
CRUD för Booking (egna bokningar) 
*/} 
          <Link className="btn" href="/bookings">Mina bokningar</Link>
        </div>
      </main>
    </Guard>
  );
}
