"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
const clean = (s: string) =>
  s.normalize("NFKC").replace(/[\u200B-\u200D\u2060\u00A0]/g, "").trim();
export default function LoginClient() {
  const qp = useSearchParams(); 
  const router = useRouter(); 
  const justRegistered = qp.get("registered") === "1"; 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/api/auth/login", {
        method: "POST",
        json: {
          email: clean(email).toLowerCase(),
          password: clean(password),
        },
      });
      try {
        localStorage.setItem("auth:event", `login:${Date.now()}`);
      } catch {}
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
