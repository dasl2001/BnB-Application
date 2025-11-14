"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
const clean = (s: string) =>
  s.normalize("NFKC").replace(/[\u200B-\u200D\u2060\u00A0]/g, "").trim();
export default function RegisterPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition(); 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(""); 
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    const payload = {
      name: clean(name),
      email: clean(email).toLowerCase(),
      password: clean(password),
    };
    try {
      await api("/api/auth/register", {
        method: "POST",
        json: payload, 
      });
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
