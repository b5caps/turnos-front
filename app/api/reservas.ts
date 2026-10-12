import { postApiReservas } from "~/utils/openapi-gen";
import { notebookLibreEn } from "~/api/disponibilidad";
import { USAR_API } from "~/constants/api";
import { aIsoConZona } from "~/constants/horarios";

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
