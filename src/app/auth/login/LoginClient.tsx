"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

/* 
  Normaliserar text, tar bort dolda Unicode-tecken (t.ex. zero-width spaces)
  och trimmar whitespace. 
  Detta används för att förhindra att användaren skriver in "osynliga" tecken
  i t.ex. e-post eller lösenord.
*/
const clean = (s: string) =>
  s.normalize("NFKC").replace(/[\u200B-\u200D\u2060\u00A0]/g, "").trim();

/*
  Ansvarar för:
  - Att visa inloggningsformulär
  - Hantera användarens input (email + lösenord)
  - Skicka POST-anrop till backend (`/api/auth/login`)
  - Hantera eventuella felmeddelanden
  - Uppdatera auth-status i alla flikar via `localStorage`
  - Navigera användaren till startsidan efter lyckad inloggning
*/
export default function LoginClient() {
  const qp = useSearchParams(); // För att läsa query-parametrar (t.ex. ?registered=1)
  const router = useRouter(); // För navigation och siduppdatering
  const justRegistered = qp.get("registered") === "1"; // Visar info om man kommer från registrering
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

    /*
    Körs när användaren klickar på "Logga in".
    Den skickar POST /api/auth/login till backend via vår `api()` helper.
  */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    /* 
        POST /api/auth/login
        Backend (Hono + Supabase) verifierar inloggningen via Supabase Auth
        och returnerar sedan httpOnly-cookies:
          - sb-access-token
          - sb-refresh-token
        Dessa cookies används för att identifiera användaren i framtida API-anrop.
      */
    try {
      await api("/api/auth/login", {
        method: "POST",
        json: {
          email: clean(email).toLowerCase(),
          password: clean(password),
        },
      });

       /*
        Synka auth-status i alla öppna flikar:
        Vi sparar en "auth:event" i localStorage för att meddela att
        inloggningsstatus har ändrats. 
        Navbar och Guard-komponenter lyssnar på detta event.
      */
      try {
        localStorage.setItem("auth:event", `login:${Date.now()}`);
      } catch {}

       /*
        Navigera till startsidan och tvinga omritning av layout/serverkomponenter
        (t.ex. så att Navbar visar “Logga ut” direkt).
      */
      router.replace("/");
      router.refresh();

    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Fel vid inloggning");
    }
  }

  return (
    <main className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center">Logga in</h1>

      {justRegistered && (
        <p className="text-sm rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2">
          Konto skapat! Logga in för att fortsätta.
        </p>
      )}

      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          className="border rounded px-3 py-2 w-full"
          type="email"
          inputMode="email"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="E-postadress"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="border rounded px-3 py-2 w-full"
          type="password"
          placeholder="Lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          className="px-3 py-2 rounded-full bg-rose-600 text-white w-full hover:bg-rose-700"
          type="submit"
        >
          Logga in
        </button>

        {msg && <p className="text-sm text-rose-600">{msg}</p>}
      </form>
    </main>
  );
}
