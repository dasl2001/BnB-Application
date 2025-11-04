"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/*
  Denna komponent används för att skydda sidor som kräver inloggning.
  Om användaren inte är inloggad (dvs. backend svarar med user: null),
  skickas man automatiskt vidare till /auth/login.
*/
export default function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
    /*
    useEffect körs direkt när komponenten laddas.
    Den gör ett anrop till backend för att verifiera om användaren är inloggad.
  */
  useEffect(() => {
    (async () => {
      try {
          /*
          Vi anropar backend via Hono API:
          GET /api/auth/me
          Den endpointen returnerar:
          { user: { id: "uuid" } }  → om användaren är inloggad
          { user: null }            → om ingen session finns
        */
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const d = await res.json();
        /* Om ingen användare hittas → skicka till login */
        if (!d?.user) router.replace("/auth/login");
      } catch {
        /*
          Vid nätverksfel, ogiltig token eller annan server-bugg
          → logga ut användaren genom att dirigera till login-sidan.
        */
        router.replace("/auth/login");
      }
    })();
  }, [router]); /* Körs en gång när komponenten mountas */
   /*
    Om användaren är inloggad → rendera det skyddade innehållet (children).
    Annars visas inget eftersom redirect sker direkt i useEffect.
  */
  return <>{children}</>;
}


