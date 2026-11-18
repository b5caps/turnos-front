import { client } from "~/utils/openapi-gen/client.gen";
import type { UserType } from "~/types";

export const TOKEN_STORAGE_KEY = "token";
export const ROL_STORAGE_KEY = "usuarioRol";
export const USUARIO_STORAGE_KEY = "greb_usuario";

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

function errorDeRespuesta(
  error: unknown,
  response: { status?: number } | undefined,
  porDefecto: string,
): ErrorApi {
  if (!response)
    return new ErrorApi(
      "No pudimos conectar con el servidor. Probá de nuevo.",
      undefined,
      error,
    );
  return new ErrorApi(
    (error as { message?: string })?.message || porDefecto,
    response.status,
    error,
  );
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
  try {
    const cookie = useCookie<string | null>(TOKEN_STORAGE_KEY);
    if (cookie.value) return cookie.value;
  } catch {
    // Fuera de contexto Nuxt
  }
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return null;
}

export function guardarToken(token: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
  try {
    const cookie = useCookie(TOKEN_STORAGE_KEY, {
      path: "/",
      maxAge: 86400,
      sameSite: "lax",
    });
    cookie.value = token;
  } catch {
    if (typeof document !== "undefined") {
      document.cookie = `${TOKEN_STORAGE_KEY}=${token}; path=/; max-age=86400; SameSite=Lax`;
    }
  }
}

export function limpiarToken(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
  try {
    const cookie = useCookie(TOKEN_STORAGE_KEY, { path: "/" });
    cookie.value = null;
  } catch {
    if (typeof document !== "undefined") {
      document.cookie = `${TOKEN_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    }
  }
  limpiarUsuarioGuardado();
}

export function obtenerUsuarioGuardado(): UsuarioAutenticado | null {
  try {
    const cookie = useCookie<UsuarioAutenticado | null>(USUARIO_STORAGE_KEY);
    if (cookie.value) return cookie.value;
  } catch {
    // Fuera de contexto Nuxt
  }
  if (typeof window !== "undefined" && window.localStorage) {
    const raw = localStorage.getItem(USUARIO_STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Ignorar
      }
    }
  }
  return null;
}

export function guardarUsuarioGuardado(usuario: UsuarioAutenticado): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(USUARIO_STORAGE_KEY, JSON.stringify(usuario));
  }
  try {
    const cookie = useCookie(USUARIO_STORAGE_KEY, {
      path: "/",
      maxAge: 86400,
      sameSite: "lax",
    });
    cookie.value = usuario;
  } catch {
    // Fuera de contexto Nuxt
  }
}

export function limpiarUsuarioGuardado(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem(USUARIO_STORAGE_KEY);
  }
  try {
    const cookie = useCookie(USUARIO_STORAGE_KEY, { path: "/" });
    cookie.value = null;
  } catch {
    // Fuera de contexto Nuxt
  }
}

export function obtenerUsuarioRol(): UserType | null {
  try {
    const cookie = useCookie<UserType | null>(ROL_STORAGE_KEY);
    if (cookie.value) return cookie.value;
  } catch {
    // Fuera de contexto Nuxt
  }
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem(ROL_STORAGE_KEY) as UserType | null;
  }
  return null;
}

export function guardarUsuarioRol(rol: UserType): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(ROL_STORAGE_KEY, rol);
  }
  try {
    const cookie = useCookie(ROL_STORAGE_KEY, {
      path: "/",
      maxAge: 86400,
      sameSite: "lax",
    });
    cookie.value = rol;
  } catch {
    if (typeof document !== "undefined") {
      document.cookie = `${ROL_STORAGE_KEY}=${rol}; path=/; max-age=86400; SameSite=Lax`;
    }
  }
}

export function limpiarUsuarioRol(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem(ROL_STORAGE_KEY);
  }
  try {
    const cookie = useCookie(ROL_STORAGE_KEY, { path: "/" });
    cookie.value = null;
  } catch {
    if (typeof document !== "undefined") {
      document.cookie = `${ROL_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    }
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
    throw errorDeRespuesta(error, response, "Credenciales inválidas");
  }

  guardarToken(data.token);
  guardarUsuarioGuardado(data.usuario);
  const rolLogin: UserType =
    data.usuario?.rol?.toUpperCase() === "UTN" ? "student" : "external";
  guardarUsuarioRol(rolLogin);
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
    throw errorDeRespuesta(error, response, "Error al registrar usuario");
  }

  guardarToken(data.token);
  guardarUsuarioGuardado(data.usuario);
  const rolRegistro: UserType =
    data.usuario?.rol?.toUpperCase() === "UTN" ? "student" : "external";
  guardarUsuarioRol(rolRegistro);
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
    limpiarUsuarioRol();
    limpiarUsuarioGuardado();
    const errorMsg =
      (error as { message?: string })?.message ||
      "Token no proporcionado, inválido o revocado";
    throw new ErrorApi(errorMsg, response?.status, error);
  }

  if (error || !data) {
    throw errorDeRespuesta(
      error,
      response,
      "Error al cerrar sesión en el servidor",
    );
  }

  return data;
}

export function decodificarPayloadJwt(
  token: string,
): { sub?: string; rol?: string; exp?: number; [key: string]: any } | null {
  try {
    const partes = token.split(".");
    if (partes.length < 2) return null;
    let base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    if (typeof atob === "function") {
      const binStr = atob(base64);
      try {
        const jsonStr = decodeURIComponent(
          binStr
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        );
        return JSON.parse(jsonStr);
      } catch {
        return JSON.parse(binStr);
      }
    } else if (typeof Buffer !== "undefined") {
      return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
    }
    return null;
  } catch {
    return null;
  }
}

export async function validarSesionApi(
  token?: string | null,
): Promise<UsuarioAutenticado | null> {
  const tokenActivo = token ?? obtenerToken();
  if (!tokenActivo || typeof tokenActivo !== "string") {
    return null;
  }

  // 1. Validar formato JWT y expiración local
  const payload = decodificarPayloadJwt(tokenActivo);
  if (!payload) return null;

  if (payload.exp && typeof payload.exp === "number") {
    const expiracionMs = payload.exp * 1000;
    if (expiracionMs <= Date.now()) {
      return null;
    }
  }

  const id = Number(payload.sub);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  // 2. Validar contra el backend
  const config = client.getConfig();
  if (!config.baseUrl) {
    const apiBase =
      useRuntimeConfig()?.public?.apiBase || "http://localhost:3000";
    client.setConfig({ baseUrl: apiBase });
  }

  try {
    // Si el rol es ADMIN, validamos con GET /api/configuracion (requiere ADMIN)
    if (payload.rol === "ADMIN") {
      const resAdmin = await client.get({
        url: "/api/configuracion",
        headers: {
          Authorization: `Bearer ${tokenActivo}`,
        },
      });

      if (resAdmin.response?.status === 200) {
        const guardado = obtenerUsuarioGuardado();
        if (guardado && guardado.rol === "ADMIN") return guardado;

        const usuarioRecuperado: UsuarioAutenticado = {
          id,
          rol: "ADMIN",
          nombre: guardado?.nombre || "Administrador",
          apellido: guardado?.apellido || "",
          email: guardado?.email || "",
        };
        guardarUsuarioGuardado(usuarioRecuperado);
        return usuarioRecuperado;
      }
      return null;
    }

    // Para alumnos / externos, validamos con GET /api/reservas
    const resVal = await client.get({
      url: "/api/reservas",
      query: { limit: 1 },
      headers: {
        Authorization: `Bearer ${tokenActivo}`,
      },
    });

    if (resVal.response?.status === 200) {
      const guardado = obtenerUsuarioGuardado();
      if (guardado) return guardado;

      const usuarioRecuperado: UsuarioAutenticado = {
        id,
        rol: (payload.rol as "UTN" | "EXTERNO") || "UTN",
        nombre: "",
        apellido: "",
        email: "",
      };
      guardarUsuarioGuardado(usuarioRecuperado);
      return usuarioRecuperado;
    }

    return null;
  } catch (error) {
    return null;
  }
}
