import { client } from "~/utils/openapi-gen/client.gen";
import { USAR_API } from "~/constants/api";

export const TOKEN_STORAGE_KEY = "token";

export interface LogoutResponse {
  message: string;
}

export function obtenerToken(): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    const token =
      localStorage.getItem(TOKEN_STORAGE_KEY) ||
      sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) return token;
  }
  try {
    const cookie = useCookie<string | null>(TOKEN_STORAGE_KEY);
    if (cookie.value) return cookie.value;
  } catch {
    // Fuera de contexto Nuxt
  }
  return null;
}

export function guardarToken(token: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
  try {
    const cookie = useCookie<string | null>(TOKEN_STORAGE_KEY);
    cookie.value = token;
  } catch {
    // Fuera de contexto Nuxt
  }
}

export function limpiarToken(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem("auth_token");
  }
  try {
    const cookie = useCookie<string | null>(TOKEN_STORAGE_KEY);
    cookie.value = null;
  } catch {
    // Fuera de contexto Nuxt
  }
}

export async function cerrarSesionApi(
  token?: string | null,
): Promise<LogoutResponse> {
  const tokenActivo = token ?? obtenerToken();

  if (!USAR_API && (!tokenActivo || tokenActivo === "demo-auth-token")) {
    return { message: "Sesión cerrada exitosamente" };
  }

  if (!tokenActivo) {
    return { message: "Sesión cerrada exitosamente" };
  }

  const config = client.getConfig();
  if (!config.baseUrl) {
    const apiBase =
      useRuntimeConfig()?.public?.apiBase || "http://localhost:3000";
    client.setConfig({ baseUrl: apiBase });
  }

  const { data, error } = await client.post<LogoutResponse>({
    url: "/api/auth/logout",
    headers: {
      Authorization: `Bearer ${tokenActivo}`,
    },
  });

  if (error || !data) {
    const errorMsg =
      (error as { message?: string })?.message ||
      "Error al cerrar sesión en el servidor";
    throw new Error(errorMsg);
  }

  return data;
}

