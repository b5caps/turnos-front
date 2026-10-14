import {
  getApiReservas,
  patchApiReservasByIdCancelar,
  postApiReservas,
} from "~/utils/openapi-gen";
import type { GetApiReservasResponses } from "~/utils/openapi-gen";
import { notebookLibreEn } from "~/api/disponibilidad";
import { USAR_API } from "~/constants/api";
import { aIsoConZona, partesDeIso } from "~/constants/horarios";
import { cancelarEnMock, reservasDe } from "~/mocks/reservas";
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

  if (!USAR_API) {
    return {
      id: 0,
      sala: reserva.salaNombre,
      fecha: reserva.fecha,
      inicio: reserva.inicio,
      fin: reserva.fin,
      notebook: reserva.conNotebook ? "Notebook asignada" : null,
    };
  }

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

  const { data, error } = await postApiReservas({
    body: {
      usuarioId: reserva.usuarioId,
      recursoIds,
      fechaHoraInicio: desde,
      fechaHoraFin: hasta,
    },
  });

  if (error || !data?.data)
    throw new Error(
      "No pudimos confirmar la reserva. Puede que el horario ya no esté disponible.",
    );

  return {
    id: data.data.id,
    sala: reserva.salaNombre,
    fecha: reserva.fecha,
    inicio: reserva.inicio,
    fin: reserva.fin,
    notebook: notebook?.nombre ?? null,
  };
}

function estadoDe(reserva: ReservaDelBack): EstadoReserva {
  if (reserva.fechaHoraCancelacion) return "cancelada";
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
  if (!USAR_API) return ordenar(reservasDe(filtro));

  const { data, error } = await getApiReservas({
    query: { usuarioId, estado: filtro },
  });

  if (error || !data?.data)
    throw new Error("No pudimos cargar tus reservas. Volvé a intentarlo.");

  return ordenar(data.data.map(aReservaPropia));
}

export async function cancelarReserva(id: number, motivo = "") {
  const motivoCancelacion = motivo.trim();

  if (!USAR_API) {
    cancelarEnMock(id, motivoCancelacion || null);
    return;
  }

  const { error } = await patchApiReservasByIdCancelar({
    path: { id },
    body: motivoCancelacion ? { motivoCancelacion } : {},
  });

  if (error)
    throw new Error(error.message || "No pudimos cancelar la reserva.");
}
