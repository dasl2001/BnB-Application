"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

/* 
  Tar bort osynliga tecken (zero-width, NBSP), normaliserar Unicode och trimmar whitespace.
  Detta används för att städa upp användarens input innan det skickas till backend.
*/
const clean = (s: string) =>
  s.normalize("NFKC").replace(/[\u200B-\u200D\u2060\u00A0]/g, "").trim();

/*
  Ansvarar för:
  - att visa ett registreringsformulär
  - hantera användarens input (namn, e-post, lösenord)
  - skicka POST-anrop till backend (`/api/auth/register`)
  - visa ev. felmeddelande eller framgångsstatus
  - dirigera användaren vidare till login-sidan
*/
export default function RegisterPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition(); // För att visa "laddar" utan att blockera UI

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(""); // Statusmeddelande (fel/success)

    /* 
    onSubmit: anropas när användaren klickar på "Registrera".
    Den städar input och skickar ett POST-anrop till backend.
  */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");

    const payload = {
      name: clean(name),
      email: clean(email).toLowerCase(),
      password: clean(password),
    };

    try {
      /*
        Kommunicerar med backend via Hono-API:
        Endpoint: POST /api/auth/register
        Backend (auth.ts) skapar användaren både i Supabase Auth och users-tabellen.
      */
      await api("/api/auth/register", {
        method: "POST",
        json: payload, // api-helpern konverterar detta till JSON och sätter rätt headers
      });

      /*
        När registreringen lyckas:
        - Användaren skickas till login-sidan (/auth/login)
        - Vi bifogar en query-param "registered=1" så login-sidan kan visa t.ex. "Kontot skapat!"
      */
      startTransition(() => router.push("/auth/login?registered=1"));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMsg(err.message);
      } else {
        setMsg("Något gick fel vid registrering.");
      }
    }
  }

  return (
    <main className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Skapa konto</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Namn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          placeholder="Lösenord (min 6 tecken)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          className="px-3 py-2 rounded-full bg-rose-600 text-white w-full disabled:opacity-60 hover:bg-rose-700"
          disabled={pending}
          type="submit"
        >
          {pending ? "Skapar konto …" : "Registrera"}
        </button>
        {msg && <p className="text-sm text-rose-600">{msg}</p>}
      </form>
    </main>
  );
}
