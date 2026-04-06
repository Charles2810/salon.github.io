import type { AuthUser } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export function apiUrl(path: string) {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { user?: AuthUser | null } = {}
): Promise<T> {
  const { user, headers, ...rest } = opts;
  const res = await fetch(apiUrl(path), {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
      ...(headers ?? {}),
    },
  });

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      typeof body === 'object' && body && 'error' in body
        ? String((body as any).error)
        : `Error ${res.status}: ${res.statusText}`;
    throw new Error(msg);
  }

  return body as T;
}

