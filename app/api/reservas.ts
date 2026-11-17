import {
  getApiReservas,
  patchApiReservasByIdCancelar,
  postApiReservas,
  postApiReservasByIdConfirmar,
} from "~/utils/openapi-gen";
import type { GetApiReservasResponses } from "~/utils/openapi-gen";
import { notebookLibreEn } from "~/api/disponibilidad";
import { aIsoConZona, partesDeIso } from "~/constants/horarios";
import type {
  EstadoFiltro,
  EstadoReserva,
  ReservaPropia,
} from "~/types/reservas";

type ReservaDelBack = GetApiReservasResponses[200]["data"][number];

export interface NuevaReserva {
  usuarioId: number;
  fecha: string;
  inicio: string;
  fin: string;
  salaId: number;
  salaNombre: string;
  conNotebook: boolean;
}

export interface ReservaConfirmada {
  id: number;
  sala: string;
  fecha: string;
  inicio: string;
  fin: string;
  notebook: string | null;
}

export async function crearReserva(
  reserva: NuevaReserva,
): Promise<ReservaConfirmada> {
  const desde = aIsoConZona(reserva.fecha, reserva.inicio);
  const hasta = aIsoConZona(reserva.fecha, reserva.fin);

  const notebook = reserva.conNotebook
    ? await notebookLibreEn(reserva.fecha, reserva.inicio, reserva.fin)
    : null;
  if (reserva.conNotebook && !notebook)
    throw new Error(
      "Ya no quedan notebooks para ese horario. Probá sin notebook o elegí otro horario.",
    );

  const recursoIds = notebook
    ? [reserva.salaId, notebook.id]
    : [reserva.salaId];

  // 1. Iniciar reserva creando el hold (10 minutos)
  const { data, error, response } = await postApiReservas({
    body: {
      usuarioId: reserva.usuarioId,
      recursoIds,
      fechaHoraInicio: desde,
      fechaHoraFin: hasta,
    },
  });

  if (error || !data?.data) {
    if (!response) {
      throw new Error("No pudimos conectar con el servidor. Probá de nuevo.");
    }
    const msg =
      (error as { message?: string })?.message ||
      "No pudimos iniciar la reserva. Puede que el horario ya no esté disponible.";
    throw new Error(msg);
  }

  const reservaCreada = data.data;

  // 2. Confirmar la reserva pendiente (Hold) inmediatamente para que quede confirmada
  const confirmacion = await postApiReservasByIdConfirmar({
    path: { id: reservaCreada.id },
  });

  if (confirmacion.error || !confirmacion.data?.data) {
    if (!confirmacion.response) {
      throw new Error("No pudimos conectar con el servidor. Probá de nuevo.");
    }
    if (confirmacion.response.status === 409) {
      throw new Error(
        "El tiempo de 10 minutos para confirmar la reserva ha expirado. El cupo ha sido liberado.",
      );
    }
    const msg =
      (confirmacion.error as { message?: string })?.message ||
      "No pudimos confirmar la reserva. El tiempo de espera puede haber expirado.";
    throw new Error(msg);
  }

  return {
    id: confirmacion.data.data.id,
    sala: reserva.salaNombre,
    fecha: reserva.fecha,
    inicio: reserva.inicio,
    fin: reserva.fin,
    notebook: notebook?.nombre ?? null,
  };
}

function estadoDe(reserva: ReservaDelBack): EstadoReserva {
  if (reserva.fechaHoraCancelacion) {
    if ((reserva as any).tipoCancelacion === "AUSENCIA") {
      return "liberada_por_ausencia";
    }
    return "cancelada";
  }
  if (new Date(reserva.fechaHoraFin) <= new Date()) return "finalizada";
  return "activa";
}

function aReservaPropia(reserva: ReservaDelBack): ReservaPropia {
  const desde = partesDeIso(reserva.fechaHoraInicio);
  const estado = estadoDe(reserva);
  const conCheckIn = Boolean(reserva.fechaHoraCheckIn);

  return {
    id: reserva.id,
    fecha: desde.fecha,
    inicio: desde.hora,
    fin: partesDeIso(reserva.fechaHoraFin).hora,
    recursos: reserva.recursos.map((item) => item.recurso.nombre),
    estado,
    motivoCancelacion: reserva.motivoCancelacion,
    limiteCheckIn: reserva.fechaLimiteCheckIn
      ? partesDeIso(reserva.fechaLimiteCheckIn).hora
      : null,
    conCheckIn,
    cancelable: estado === "activa" && !conCheckIn,
  };
}

function ordenar(reservas: ReservaPropia[]) {
  const comienzo = (reserva: ReservaPropia) =>
    `${reserva.fecha}T${reserva.inicio}`;
  return [...reservas].sort((una, otra) => {
    if (una.estado !== otra.estado)
      return una.estado === "activa" ? -1 : otra.estado === "activa" ? 1 : 0;
    return una.estado === "activa"
      ? comienzo(una).localeCompare(comienzo(otra))
      : comienzo(otra).localeCompare(comienzo(una));
  });
}

export async function misReservas(
  usuarioId: number,
  filtro: EstadoFiltro = "todas",
): Promise<ReservaPropia[]> {
  try {
    const { data, error, response } = await getApiReservas({
      query: { usuarioId, estado: filtro },
    });

    if (error || !data?.data) {
      throw new Error("No pudimos conectar con el servidor. Probá de nuevo.");
    }

    return ordenar(data.data.map(aReservaPropia));
  } catch (err) {
    if (err instanceof Error && err.message) {
      throw err;
    }
    throw new Error("No pudimos conectar con el servidor. Probá de nuevo.");
  }
}

export async function cancelarReserva(id: number, motivo = "") {
  const motivoCancelacion = motivo.trim();

  const { error } = await patchApiReservasByIdCancelar({
    path: { id },
    body: motivoCancelacion ? { motivoCancelacion } : {},
  });

  if (error)
    throw new Error(error.message || "No pudimos cancelar la reserva.");
}
