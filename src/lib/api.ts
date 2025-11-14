export async function api<TResponse = unknown, TBody = unknown>(
  url: string,
  init: RequestInit & { json?: TBody } = {}
): Promise<TResponse> {
  const { json, headers, ...rest } = init;
  const res = await fetch(url, {
    credentials: "include", 
    cache: "no-store", 
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    ...(json ? { body: JSON.stringify(json) } : {}),
    ...rest,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data: unknown = await res.json();
      if (
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof (data as { error?: string }).error === "string"
      ) {
        msg = (data as { error: string }).error;
      }
    } catch {
    }
    throw new Error(msg);
  }
  return (await res.json()) as TResponse;
}
