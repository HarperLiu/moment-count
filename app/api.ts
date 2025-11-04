// Simple HTTP client and API wrappers

const BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE ||
  "https://moment-count-server-git-main-harperlius-projects.vercel.app"
).replace(/\/$/, "");

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function http<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const { method = "GET", body, headers } = options;

  const resp = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(headers || {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Request failed ${resp.status}: ${text || resp.statusText}`
    );
  }

  // Try parse JSON; allow empty bodies
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await resp.json()) as T;
  }
  return undefined as unknown as T;
}

// Types from server (loosely typed; mapped in components)
export type ServerMemory = {
  id: string;
  title?: string;
  details?: string;
  date?: string; // ISO
  photos?: string[]; // server guarantees string[]
};

export type ServerRecipe = {
  id: string;
  title?: string;
  details?: string;
  photos?: string[];
  timeCost?: { hours: number; minutes: number };
};

export const api = {
  // Wrap server's { data: T } to return T directly for existing callers
  getMemories: async (): Promise<ServerMemory[]> => {
    return http<{ data: ServerMemory[] }>("/memories").then((r) => r.data);
  },
  createMemory: (payload: {
    title: string;
    details: string;
    photos: string[];
    date: string;
  }): Promise<ServerMemory> =>
    http<{ data: ServerMemory }>("/memories", {
      method: "POST",
      body: payload,
    }).then((r) => r.data),

  getRecipes: (): Promise<ServerRecipe[]> =>
    http<{ data: ServerRecipe[] }>("/recipes").then((r) => r.data),
  createRecipe: (payload: {
    title: string;
    details: string;
    photos: string[];
    timeCost: { hours: number; minutes: number };
  }): Promise<ServerRecipe> =>
    http<{ data: ServerRecipe }>("/recipes", {
      method: "POST",
      body: payload,
    }).then((r) => r.data),
};

export { BASE_URL };
