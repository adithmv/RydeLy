const BASE = import.meta.env.VITE_API_URL || "";
let csrfToken: string | undefined;
let csrfPromise: Promise<string> | undefined;
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function csrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (!csrfPromise)
    csrfPromise = fetch(`${BASE}/auth/csrf`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok)
          throw new ApiError(
            "Unable to establish a secure session",
            response.status,
          );
        const data = await response.json();
        csrfToken = data.csrfToken;
        return data.csrfToken as string;
      })
      .finally(() => {
        csrfPromise = undefined;
      });
  return csrfPromise;
}
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const write = options.method && !["GET", "HEAD"].includes(options.method);
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (write) headers.set("X-CSRF-Token", await csrf());
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error(
      "Cannot reach RydeLy. Check your connection and try again.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      csrfToken = undefined;
    if (response.status === 401)
      window.dispatchEvent(new Event("rydely:session-expired"));
    throw new ApiError(
      data.error || `Request failed (${response.status})`,
      response.status,
    );
  }
  if (data.csrfToken) csrfToken = data.csrfToken;
  if (path === "/auth/logout") csrfToken = undefined;
  return data as T;
}
