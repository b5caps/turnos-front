import * as api from "./bloqueos.api";
import * as mock from "./bloqueos.mock";
import type {
  Bloqueo,
  CrearBloqueoInput,
  FiltroBloqueosQuery,
  ResultadoBloqueoMultiple,
} from "./types";
import type { EspacioSala } from "~/types/espacios";

export * from "./types";

function usarApi(): boolean {
  try {
    const config = useRuntimeConfig();
    const val = config?.public?.usarApiBloqueos;
    if (val !== undefined && val !== null) {
      return val === true || val === "true" || val === "1";
    }
  } catch {
    // Si se ejecuta fuera del contexto de Nuxt
  }
  const envVal = import.meta.env.NUXT_PUBLIC_USAR_API_BLOQUEOS;
  if (envVal !== undefined && envVal !== null) {
    return envVal === "true" || envVal === "1";
  }
  return true;
}

export function listarEspaciosActivos(): Promise<EspacioSala[]> {
  return usarApi() ? api.listarEspaciosActivos() : mock.listarEspaciosActivos();
}

export function listarBloqueos(
  query?: FiltroBloqueosQuery,
): Promise<Bloqueo[]> {
  return usarApi() ? api.listarBloqueos(query) : mock.listarBloqueos(query);
}

export function crearBloqueo(
  espacioId: number,
  input: CrearBloqueoInput,
): Promise<Bloqueo> {
  return usarApi()
    ? api.crearBloqueo(espacioId, input)
    : mock.crearBloqueo(espacioId, input);
}

export function bloquearTodasLasSalas(
  input: CrearBloqueoInput,
): Promise<ResultadoBloqueoMultiple> {
  return usarApi()
    ? api.bloquearTodasLasSalas(input)
    : mock.bloquearTodasLasSalas(input);
}

export function eliminarBloqueo(
  espacioId: number,
  bloqueoId: number,
): Promise<void> {
  return usarApi()
    ? api.eliminarBloqueo(espacioId, bloqueoId)
    : mock.eliminarBloqueo(espacioId, bloqueoId);
}

export function contarReservasEnRango(
  fecha: string,
  horaInicio: string,
  horaFin: string,
  recursoId?: number | null,
  nombreSala?: string,
): Promise<number> {
  return usarApi()
    ? api.contarReservasEnRango(
        fecha,
        horaInicio,
        horaFin,
        recursoId,
        nombreSala,
      )
    : mock.contarReservasEnRango(
        fecha,
        horaInicio,
        horaFin,
        recursoId,
        nombreSala,
      );
}

export function bloqueosActivosParaFecha(
  fechaIso: string,
  recursoId?: number,
): Promise<Bloqueo[]> {
  return usarApi()
    ? api.bloqueosActivosParaFecha(fechaIso, recursoId)
    : mock.bloqueosActivosParaFecha(fechaIso, recursoId);
}
