import * as api from "./asistencia.api";
import * as mock from "./asistencia.mock";
import type {
  Asistencia,
  ConsultarCheckInResponse,
  QrEspacioEmitido,
} from "./types";

export * from "./types";

function usarApi(): boolean {
  try {
    const config = useRuntimeConfig();
    const val = config?.public?.usarApiAsistencia;
    if (val !== undefined && val !== null) {
      return val === true || val === "true" || val === "1";
    }
  } catch {
    // Si se ejecuta fuera de contexto Nuxt
  }
  const envVal = import.meta.env.NUXT_PUBLIC_USAR_API_ASISTENCIA;
  if (envVal !== undefined && envVal !== null) {
    return envVal === "true" || envVal === "1";
  }
  return true;
}

export function consultarCheckIn(
  tokenQr: string,
): Promise<ConsultarCheckInResponse> {
  return usarApi()
    ? api.consultarCheckIn(tokenQr)
    : mock.consultarCheckIn(tokenQr);
}

export function registrarCheckIn(
  reservaId: number,
  tokenQr: string,
): Promise<Asistencia> {
  return usarApi()
    ? api.registrarCheckIn(reservaId, tokenQr)
    : mock.registrarCheckIn(reservaId, tokenQr);
}

export function registrarCheckInManual(reservaId: number): Promise<Asistencia> {
  return usarApi()
    ? api.registrarCheckInManual(reservaId)
    : mock.registrarCheckInManual(reservaId);
}

export function finalizarReserva(
  reservaId: number,
  observacion?: string,
): Promise<void> {
  return usarApi()
    ? api.finalizarReserva(reservaId, observacion)
    : mock.finalizarReserva(reservaId, observacion);
}

export function emitirQrEspacio(espacioId: number): Promise<QrEspacioEmitido> {
  return usarApi()
    ? api.emitirQrEspacio(espacioId)
    : mock.emitirQrEspacio(espacioId);
}

export function revocarQrEspacio(espacioId: number): Promise<void> {
  return usarApi()
    ? api.revocarQrEspacio(espacioId)
    : mock.revocarQrEspacio(espacioId);
}
