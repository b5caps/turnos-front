import type { Feriado, FeriadosCacheEntry, ResultadoFeriados } from "./types";
import {
  cargarEliminados,
  cargarManuales,
  FERIADOS_MOCK_2026_2027,
  fusionarFeriados,
  persistirEliminados,
  persistirManuales,
  type FeriadoManualItem,
} from "./feriados.mock";

// Endpoint público con CORS habilitado (Access-Control-Allow-Origin: *)
export const API_FERIADOS_URL = "https://api.argentinadatos.com/v1/feriados";
export const API_FERIADOS_FALLBACK_URL =
  "https://date.nager.at/api/v3/PublicHolidays";

const CACHE_KEY_PREFIX = "greb_feriados_cache_";

function leerCacheAnio(anio: number): FeriadosCacheEntry | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(`${CACHE_KEY_PREFIX}${anio}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function guardarCacheAnio(anio: number, feriados: Feriado[]) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const entrada: FeriadosCacheEntry = {
      anio,
      fechaConsulta: new Date().toISOString(),
      feriados,
    };
    window.localStorage.setItem(
      `${CACHE_KEY_PREFIX}${anio}`,
      JSON.stringify(entrada),
    );
  } catch {
    // Si localStorage está lleno o deshabilitado, continuar sin romper
  }
}

async function consultarApiAnio(anio: number): Promise<Feriado[]> {
  // Intento 1: ArgentinaDatos (CORS habilitado)
  try {
    const res = await fetch(`${API_FERIADOS_URL}/${anio}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          fecha: String(item.fecha),
          nombre: String(item.nombre),
          origen: "API" as const,
        }));
      }
    }
  } catch {
    // Continuar al intento 2
  }

  // Intento 2: Nager.Date (CORS habilitado)
  try {
    const res = await fetch(`${API_FERIADOS_FALLBACK_URL}/${anio}/AR`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          fecha: String(item.date),
          nombre: String(item.localName || item.name),
          origen: "API" as const,
        }));
      }
    }
  } catch {
    // Falló también intento 2
  }

  throw new Error(
    `No se pudo conectar con la API de feriados para el año ${anio}`,
  );
}

function validarFeriado(fecha: string, nombre: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error("El formato de fecha debe ser YYYY-MM-DD");
  }
  if (!nombre || !nombre.trim()) {
    throw new Error("El nombre del feriado no puede estar vacío");
  }
}

export async function obtenerFeriados(
  anios?: number[],
): Promise<ResultadoFeriados> {
  const anioActual = new Date().getFullYear();
  const aniosAConsultar =
    anios && anios.length ? anios : [anioActual, anioActual + 1];

  let huboFalloApi = false;
  let usoCache = false;
  let usoMock = false;

  const feriadosBasePorAnio: Feriado[] = [];

  for (const anio of aniosAConsultar) {
    try {
      const feriadosApi = await consultarApiAnio(anio);
      guardarCacheAnio(anio, feriadosApi);
      feriadosBasePorAnio.push(...feriadosApi);
    } catch {
      huboFalloApi = true;
      const cached = leerCacheAnio(anio);
      if (
        cached &&
        Array.isArray(cached.feriados) &&
        cached.feriados.length > 0
      ) {
        usoCache = true;
        feriadosBasePorAnio.push(...cached.feriados);
      } else {
        usoMock = true;
        const mockDelAnio = FERIADOS_MOCK_2026_2027.filter(
          (f) => Number(f.fecha.slice(0, 4)) === anio,
        );
        feriadosBasePorAnio.push(...mockDelAnio);
      }
    }
  }

  const feriados = fusionarFeriados(feriadosBasePorAnio);

  let fuente: ResultadoFeriados["fuente"] = "API";
  let avisoFallback: string | undefined;

  if (huboFalloApi) {
    if (usoMock) {
      fuente = "MOCK";
      avisoFallback =
        "No se pudo conectar con la API de feriados ni hay datos en caché. Mostrando feriados de respaldo.";
    } else if (usoCache) {
      fuente = "CACHE";
      avisoFallback =
        "No se pudo conectar con la API de feriados. Mostrando datos guardados en caché local.";
    }
  }

  return {
    feriados,
    fuente,
    avisoFallback,
  };
}

export async function agregarFeriado(
  fecha: string,
  nombre: string,
): Promise<Feriado> {
  validarFeriado(fecha, nombre);

  const manuales = cargarManuales();
  const filtrados = manuales.filter((m) => m.fecha !== fecha);

  const nuevo: FeriadoManualItem = {
    fecha,
    nombre: nombre.trim(),
    origen: "MANUAL",
  };

  filtrados.push(nuevo);
  persistirManuales(filtrados);

  const eliminados = cargarEliminados().filter((f) => f !== fecha);
  persistirEliminados(eliminados);

  return { fecha: nuevo.fecha, nombre: nuevo.nombre, origen: "MANUAL" };
}

export async function editarFeriado(
  fechaOriginal: string,
  nuevaFecha: string,
  nuevoNombre: string,
): Promise<Feriado> {
  validarFeriado(nuevaFecha, nuevoNombre);

  const manuales = cargarManuales();
  const restantes = manuales.filter(
    (m) => m.fecha !== fechaOriginal && m.fecha !== nuevaFecha,
  );

  const editado: FeriadoManualItem = {
    fecha: nuevaFecha,
    nombre: nuevoNombre.trim(),
    origen: "MANUAL",
    fechaOriginal: fechaOriginal !== nuevaFecha ? fechaOriginal : undefined,
  };

  restantes.push(editado);
  persistirManuales(restantes);

  return { fecha: editado.fecha, nombre: editado.nombre, origen: "MANUAL" };
}

export async function eliminarFeriado(fecha: string): Promise<void> {
  const manuales = cargarManuales().filter(
    (m) => m.fecha !== fecha && m.fechaOriginal !== fecha,
  );
  persistirManuales(manuales);

  const eliminados = cargarEliminados();
  if (!eliminados.includes(fecha)) {
    eliminados.push(fecha);
    persistirEliminados(eliminados);
  }
}

export async function esFeriado(fechaStr: string): Promise<Feriado | null> {
  const anio = Number(fechaStr.slice(0, 4));
  const res = await obtenerFeriados([anio]);
  return res.feriados.find((f) => f.fecha === fechaStr) ?? null;
}
