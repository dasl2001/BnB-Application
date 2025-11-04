/*
Denna funktion används i hela frontend (Next.js/React) för att kommunicera med backend.
Den fungerar som en central "gateway" mellan klienten och servern.
Flöde i praktiken:
 1. En React-komponent (t.ex. LoginPage eller CreateForm) anropar `api("/api/endpoint", { method, json })`.
2. Denna funktion skickar en HTTP-request till backend.
3. Autentiserings-cookies (sb-access-token) skickas automatiskt med.
4. Backend tar emot requesten via Hono och pratar med Supabase.
5. Backend returnerar JSON (t.ex. { ok: true } eller { data: [...] }).
6. Denna funktion returnerar resultatet till frontend – strikt typat.
På så sätt hålls frontend fri från fetch-boilerplate och felhantering.
*/
export async function api<TResponse = unknown, TBody = unknown>(
  url: string,
  init: RequestInit & { json?: TBody } = {}
): Promise<TResponse> {
  const { json, headers, ...rest } = init;

/*
Skicka HTTP-request till API
*/
  const res = await fetch(url, {

/*
Gör att browsern skickar med "sb-access-token" i varje request.
*/
    credentials: "include", 

/*
Förhindrar cache av inloggningsstatus
*/
    cache: "no-store", 
    
/*
Ange att vi skickar JSON-data
*/
    headers: {
      "Content-Type": "application/json",

/*
tillåt extra headers vid behov
*/
      ...(headers ?? {}),
    },

/*
Om vi skickar JSON-body (ex. vid POST/PUT)
*/
    ...(json ? { body: JSON.stringify(json) } : {}),

/*
Lägg till övriga fetch-inställningar (t.ex. method: "POST")
*/
    ...rest,
  });

  if (!res.ok) {

/*
Grundmeddelande om requesten misslyckas
*/
    let msg = `Request failed (${res.status})`;
    try {
  
/*
Försök tolka backend-svaret som JSON
*/
      const data: unknown = await res.json();

/*
Om backend returnerade ett felobjekt som { error: "något gick fel" }
*/
      if (
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof (data as { error?: string }).error === "string"
      ) {
        msg = (data as { error: string }).error;
      }
    } catch {
/*
Ignorera JSON-fel om backend inte skickade något
*/
    }

/*
 Kasta ett Error-objekt som frontend-komponenten kan visa 
*/
    throw new Error(msg);
  }

/*
Detta parsar svaret som JSON och kastar in det i TypeScript-typen TResponse.
T.ex:
const res = await api<{ properties: Property[] }>("/api/properties");
Då vet TypeScript att res.properties finns och är typat korrekt.
*/
  return (await res.json()) as TResponse;
}
