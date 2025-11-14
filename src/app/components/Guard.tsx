"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const d = await res.json();
        if (!d?.user) router.replace("/auth/login");
      } catch {
        router.replace("/auth/login");
      }
    })();
  }, [router]); 
  return <>{children}</>;
}


