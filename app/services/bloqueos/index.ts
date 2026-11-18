import * as api from "./bloqueos.api";
import * as mock from "./bloqueos.mock";
import type {
  Bloqueo,
  CrearBloqueoInput,
  FiltroBloqueosQuery,
  ResultadoCrearBloqueo,
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
  recursoId: number | null,
  input: CrearBloqueoInput,
): Promise<ResultadoCrearBloqueo> {
  return usarApi()
    ? api.crearBloqueo(recursoId, input)
    : mock.crearBloqueo(recursoId, input);
}

export function eliminarBloqueo(bloqueoId: number): Promise<void> {
  return usarApi()
    ? api.eliminarBloqueo(bloqueoId)
    : mock.eliminarBloqueo(bloqueoId);
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
