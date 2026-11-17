import * as api from "./feriados.api";
import * as mock from "./feriados.mock";
import type { Feriado, ResultadoFeriados } from "./types";

export * from "./types";

function usarApi(): boolean {
  try {
    const config = useRuntimeConfig();
    const val = config?.public?.usarApiFeriados;
    if (val !== undefined && val !== null) {
      return val === true || val === "true" || val === "1";
    }
  } catch {
    // Si se ejecuta fuera del contexto de Nuxt
  }
  const envVal = import.meta.env.NUXT_PUBLIC_USAR_API_FERIADOS;
  if (envVal !== undefined && envVal !== null) {
    return envVal === "true" || envVal === "1";
  }
  return true;
}

export function obtenerFeriados(anios?: number[]): Promise<ResultadoFeriados> {
  return usarApi() ? api.obtenerFeriados(anios) : mock.obtenerFeriados(anios);
}

export function agregarFeriado(
  fecha: string,
  nombre: string,
): Promise<Feriado> {
  return usarApi()
    ? api.agregarFeriado(fecha, nombre)
    : mock.agregarFeriado(fecha, nombre);
}

export function editarFeriado(
  fechaOriginal: string,
  nuevaFecha: string,
  nuevoNombre: string,
): Promise<Feriado> {
  return usarApi()
    ? api.editarFeriado(fechaOriginal, nuevaFecha, nuevoNombre)
    : mock.editarFeriado(fechaOriginal, nuevaFecha, nuevoNombre);
}

export function eliminarFeriado(fecha: string): Promise<void> {
  return usarApi() ? api.eliminarFeriado(fecha) : mock.eliminarFeriado(fecha);
}

export function esFeriado(fechaStr: string): Promise<Feriado | null> {
  return usarApi() ? api.esFeriado(fechaStr) : mock.esFeriado(fechaStr);
}
