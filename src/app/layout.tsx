/*
Globala Tailwind/CSS-stilar som gäller för hela appen
*/
import "./globals.css";
import Navbar from "./components/Navbar";

/*
Detta är den globala layouten för hela Next.js-appen.
Allt innehåll som visas i applikationen (t.ex. HomePage, Properties, Bookings) ligger "inuti" denna layout.
Här placeras även gemensamma komponenter som:
<Navbar />   → Visar inloggningslänkar eller användarlänkar
Globala CSS-stilar
Gemensam container/layout (t.ex. max-width och padding)
Layouten laddas bara en gång, och barnkomponenterna byts ut dynamiskt när användaren navigerar mellan sidorna.
*/
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>

{/*
Navbar ligger högst upp på alla sidor 
Denna komponent kommunicerar med backend via /api/auth/me för att avgöra om användaren är inloggad eller ej 
*/}        
        <Navbar />
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </body>
    </html>
  );
}

