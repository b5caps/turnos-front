import { client } from "~/utils/openapi-gen/client.gen";

export const TOKEN_STORAGE_KEY = "token";

export class ErrorApi extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ErrorApi";
    this.status = status;
    this.data = data;
  }
}

export interface UsuarioAutenticado {
  id: number;
  rol: "UTN" | "EXTERNO" | "ADMIN";
  nombre: string;
  apellido: string;
  email: string;
}

export interface LoginResponse {
  usuario: UsuarioAutenticado;
  token: string;
  expiresIn: number;
}

export interface LogoutResponse {
  message: string;
}

export interface RegistroExternoData {
  rol: "EXTERNO";
  tipoDocumento: "DNI";
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  localidad: string;
  provincia: string;
  organizacion: string;
}

export type RegistroResponse = LoginResponse;

export function obtenerToken(): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return null;
}

export function guardarToken(token: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

export function limpiarToken(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export async function iniciarSesionApi(
  legajoOEmail: string,
  password: string,
): Promise<LoginResponse> {
  const config = client.getConfig();
  if (!config.baseUrl) {
    const apiBase =
      useRuntimeConfig()?.public?.apiBase || "http://localhost:3000";
    client.setConfig({ baseUrl: apiBase });
  }

  const { data, error, response } = await client.post<LoginResponse>({
    url: "/api/auth/login",
    body: {
      username: legajoOEmail,
      password,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error || !data) {
    const errorMsg =
      (error as { message?: string })?.message || "Credenciales inválidas";
    throw new ErrorApi(errorMsg, response?.status, error);
  }

  guardarToken(data.token);
  return data;
}

export async function registrarApi(
  datos: RegistroExternoData,
): Promise<RegistroResponse> {
  const config = client.getConfig();
  if (!config.baseUrl) {
    const apiBase =
      useRuntimeConfig()?.public?.apiBase || "http://localhost:3000";
    client.setConfig({ baseUrl: apiBase });
  }

  const { data, error, response } = await client.post<RegistroResponse>({
    url: "/api/auth/registro",
    body: datos,
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error || !data) {
    const errorMsg =
      (error as { message?: string })?.message || "Error al registrar usuario";
    throw new ErrorApi(errorMsg, response?.status, error);
  }

  guardarToken(data.token);
  return data;
}

export async function cerrarSesionApi(
  token?: string | null,
): Promise<LogoutResponse> {
  const tokenActivo = token ?? obtenerToken();

  if (!tokenActivo) {
    return { message: "Sesión cerrada exitosamente" };
  }

  const config = client.getConfig();
  if (!config.baseUrl) {
    const apiBase =
      useRuntimeConfig()?.public?.apiBase || "http://localhost:3000";
    client.setConfig({ baseUrl: apiBase });
  }

  const { data, error, response } = await client.post<LogoutResponse>({
    url: "/api/auth/logout",
    headers: {
      Authorization: `Bearer ${tokenActivo}`,
    },
  });

  if (response?.status === 401) {
    limpiarToken();
    const errorMsg =
      (error as { message?: string })?.message ||
      "Token no proporcionado, inválido o revocado";
    throw new ErrorApi(errorMsg, response?.status, error);
  }

  if (error || !data) {
    const errorMsg =
      (error as { message?: string })?.message ||
      "Error al cerrar sesión en el servidor";
    throw new ErrorApi(errorMsg, response?.status, error);
  }

  return data;
}
