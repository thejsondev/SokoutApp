import type { ApiUser } from "@/lib/types";

const TOKEN_KEY = "sokout-token";

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  firstError(): string {
    const values = Object.values(this.errors)[0];
    return values?.[0] ?? this.message;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers,
    cache: "no-store",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = (await response.json().catch(() => null)) as
    | { message?: string; errors?: Record<string, string[]> }
    | T
    | null;

  if (!response.ok) {
    const payload = json as { message?: string; errors?: Record<string, string[]> } | null;
    throw new ApiError(
      payload?.message ?? "Etwas ist schiefgelaufen.",
      response.status,
      payload?.errors ?? {},
    );
  }

  return json as T;
}

export async function apiForm<T>(path: string, form: FormData, method = "POST"): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: form,
  });

  const json = (await response.json().catch(() => null)) as
    | { message?: string; errors?: Record<string, string[]> }
    | T
    | null;

  if (!response.ok) {
    const payload = json as { message?: string; errors?: Record<string, string[]> } | null;
    throw new ApiError(
      payload?.message ?? "Etwas ist schiefgelaufen.",
      response.status,
      payload?.errors ?? {},
    );
  }

  return json as T;
}

export async function apiBlob(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api${path}`, { headers });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      errors?: Record<string, string[]>;
    } | null;
    throw new ApiError(
      payload?.message ?? "Datei nicht verfügbar.",
      response.status,
      payload?.errors ?? {},
    );
  }

  return response.blob();
}

export function unwrapData<T>(payload: { data: T }): T {
  return payload.data;
}

export async function fetchMe(): Promise<ApiUser> {
  const payload = await api<{ data: ApiUser }>("/me");
  return payload.data;
}
