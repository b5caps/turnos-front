import { client } from "~/utils/openapi-gen/client.gen";
import type {
  Asistencia,
  ConsultarCheckInResponse,
  QrEspacioEmitido,
} from "./types";

function extraerMensaje(error: any, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    if (error.message) return String(error.message);
    if (error.error) return String(error.error);
  }
  return fallback;
}

function crearErrorConStatus(
  status: number | undefined,
  error: any,
  defaultMsg: string,
): Error {
  const msg = extraerMensaje(error, defaultMsg);
  const err = new Error(msg);
  (err as { status?: number }).status = status;
  return err;
}

export async function consultarCheckIn(
  tokenQr: string,
): Promise<ConsultarCheckInResponse> {
  const { data, error, response } = await client.post<{
    data: ConsultarCheckInResponse;
  }>({
    url: "/api/reservas/check-in/consultar",
    body: { tokenQr },
  });

  if (error || !data?.data) {
    throw crearErrorConStatus(
      response?.status,
      error,
      "No pudimos consultar las reservas para este código QR.",
    );
  }

  return data.data;
}

export async function registrarCheckIn(
  reservaId: number,
  tokenQr: string,
): Promise<Asistencia> {
  const { data, error, response } = await client.post<{ data: Asistencia }>({
    url: `/api/reservas/${reservaId}/check-in`,
    body: { tokenQr },
  });

  if (error || !data?.data) {
    throw crearErrorConStatus(
      response?.status,
      error,
      "No se pudo registrar la llegada.",
    );
  }

  return data.data;
}

export async function registrarCheckInManual(
  reservaId: number,
): Promise<Asistencia> {
  const { data, error, response } = await client.post<{ data: Asistencia }>({
    url: `/api/reservas/${reservaId}/check-in/manual`,
  });

  if (error || !data?.data) {
    throw crearErrorConStatus(
      response?.status,
      error,
      "No se pudo registrar la asistencia manual.",
    );
  }

  return data.data;
}

export async function finalizarReserva(
  reservaId: number,
  observacion?: string,
): Promise<void> {
  const { error, response } = await client.patch({
    url: `/api/reservas/${reservaId}/finalizar`,
    body: observacion ? { observacion } : {},
  });

  if (error) {
    throw crearErrorConStatus(
      response?.status,
      error,
      "No se pudo registrar la salida.",
    );
  }
}

export async function emitirQrEspacio(
  espacioId: number,
): Promise<QrEspacioEmitido> {
  const { data, error, response } = await client.post<{
    data: QrEspacioEmitido;
  }>({
    url: `/api/espacios/${espacioId}/qr`,
  });

  if (error || !data?.data) {
    throw crearErrorConStatus(
      response?.status,
      error,
      "No se pudo emitir el código QR del espacio.",
    );
  }

  return data.data;
}

export async function revocarQrEspacio(espacioId: number): Promise<void> {
  const { error, response } = await client.delete({
    url: `/api/espacios/${espacioId}/qr`,
  });

  if (error) {
    throw crearErrorConStatus(
      response?.status,
      error,
      "No se pudo revocar el código QR del espacio.",
    );
  }
}
