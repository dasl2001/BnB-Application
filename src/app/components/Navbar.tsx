"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const pathname = usePathname(); 
  const loadMe = useCallback(async () => {
    try {
      const d = await api<{ user: { id: string } | null }>("/api/auth/me");
      setLoggedIn(!!d.user);
    } catch {
      setLoggedIn(false);
    }
  }, []);
  useEffect(() => {
    void loadMe();
  }, [loadMe, pathname]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth:event") void loadMe();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadMe]);
  const handleLogout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    try {
      localStorage.setItem("auth:event", `logout:${Date.now()}`);
    } catch {}
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

