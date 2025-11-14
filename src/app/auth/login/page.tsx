export const dynamic = "force-dynamic";
export const revalidate = false; 
import { Suspense } from "react";
import LoginClient from "./LoginClient";
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Laddar inloggning...</div>}>
      <LoginClient />
    </Suspense>
  );
}
