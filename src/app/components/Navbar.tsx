"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

/*
  Ansvarar för att visa navigationslänkar beroende på om användaren
  är inloggad eller inte.
  - Hämtar användarstatus från backend (/api/auth/me)
  - Uppdateras automatiskt vid sidbyte eller när användaren loggar in/ut
  - Reagerar även på login/logout från *andra flikar* via localStorage-event
*/
export default function Navbar() {
  /* loggedIn = true → visa intern navigation, false → visa login/register */
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const pathname = usePathname(); /* används för att uppdatera menyn vid sidbyte */

    /*
    loadMe(): kontrollerar om användaren är inloggad genom att anropa backend.
    Endpoint: GET /api/auth/me
    Returnerar t.ex. { user: { id: "uuid" } } om användaren är inloggad
  */
  const loadMe = useCallback(async () => {
    try {
      const d = await api<{ user: { id: string } | null }>("/api/auth/me");
      setLoggedIn(!!d.user);
    } catch {
      /* Om något går fel (t.ex. 401 Unauthorized) → logga ut användaren */
      setLoggedIn(false);
    }
  }, []);

    /*
    useEffect: körs när komponenten laddas in, och varje gång användaren byter sida.
    Detta säkerställer att nav-baren uppdateras direkt efter login, logout eller route-byte.
    */
  useEffect(() => {
    void loadMe();
  }, [loadMe, pathname]);

    /*
    useEffect: lyssnar på `localStorage` för auth-händelser.
    Om användaren loggar in/ut i en annan flik uppdateras menyn även här.
    */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth:event") void loadMe();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadMe]);

    /*
    handleLogout(): loggar ut användaren genom att anropa backend
    Endpoint: POST /api/auth/logout → tar bort cookies (sb-access-token / sb-refresh-token)
  */
  const handleLogout = async () => {
    await api("/api/auth/logout", { method: "POST" });

    /*Skicka signal till andra flikar */
    try {
           /* Ignorera fel om localStorage ej tillgänglig */
      localStorage.setItem("auth:event", `logout:${Date.now()}`);
    } catch {}

     /* Gör en full reload till login-sidan för att rensa state */
    location.href = "/auth/login";
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b bg-white">
      {loggedIn ? (
        <>
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-lg text-gray-900">
              BnB
            </Link>
            <Link href="/properties" className="text-sm text-gray-700 hover:text-rose-600">
              Min listning
            </Link>
            <Link href="/discover" className="text-sm text-gray-700 hover:text-rose-600">
              Boenden
            </Link>
            <Link href="/bookings" className="text-sm text-gray-700 hover:text-rose-600">
              Bokning
            </Link>
          </div>
          <button onClick={handleLogout} className="text-sm text-rose-600 hover:underline">
            Logga ut
          </button>
        </>
      ) : (
        <div className="flex items-center gap-4 ml-auto">
          <Link href="/auth/login" className="text-sm font-medium text-rose-600 hover:underline">
            Logga in
          </Link>
          <Link href="/auth/register" className="text-sm font-medium text-rose-600 hover:underline">
            Registrera
          </Link>
        </div>
      )}
    </nav>
  );
}

