import { getApiReservas } from "~/utils/openapi-gen";
import type { GetApiReservasResponses } from "~/utils/openapi-gen";
import { idsDeNotebooks } from "~/api/disponibilidad";
import { obtenerToken } from "~/api/auth";
import { cancelarReserva } from "~/api/reservas";
import { hoyIso, partesDeIso } from "~/constants/horarios";
import type { EstadoTurno, Turno } from "~/types/admin";

type ReservaDelBack = GetApiReservasResponses[200]["data"][number];

function pareceNotebook(nombre: string) {
  return /notebook/i.test(nombre);
}

function estadoDe(desde: Date, hasta: Date, cancelado: boolean): EstadoTurno {
  if (cancelado) return "cancelado";
  const ahora = new Date();
  if (hasta <= ahora) return "finalizado";
  if (desde <= ahora) return "activo";
  return "pendiente";
}

function aTurno(
  reserva: ReservaDelBack,
  idsNotebook: Set<number> | null,
): Turno {
  const desde = partesDeIso(reserva.fechaHoraInicio);
  const recursos = reserva.recursos.map((item) => item.recurso.nombre);
  const alumno = reserva.usuario
    ? `${reserva.usuario.nombre} ${reserva.usuario.apellido}`.trim()
    : `Usuario #${reserva.usuarioId}`;

  const estado = estadoDe(
    new Date(reserva.fechaHoraInicio),
    new Date(reserva.fechaHoraFin),
    Boolean(reserva.fechaHoraCancelacion),
  );

  return {
    id: reserva.id,
    alumno,
    email: reserva.usuario?.email ?? "",
    fecha: desde.fecha,
    inicio: desde.hora,
    fin: partesDeIso(reserva.fechaHoraFin).hora,
    estado,
    conNotebook: idsNotebook
      ? reserva.recursos.some((item) => idsNotebook.has(item.recursoId))
      : recursos.some(pareceNotebook),
    cancelable: estado === "pendiente" || estado === "activo",
  };
}

function ordenar(turnos: Turno[]) {
  const clave = (turno: Turno) => `${turno.fecha}T${turno.inicio}`;
  return [...turnos].sort((una, otra) => clave(otra).localeCompare(clave(una)));
}

export function rolDeLaSesion(): string | null {
  const token = obtenerToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    return typeof payload.rol === "string" ? payload.rol : null;
  } catch {
    return null;
  }
}

export async function todosLosTurnos(): Promise<Turno[]> {
  const [reservas, idsNotebook] = await Promise.all([
    getApiReservas({ query: { estado: "todas" } }),
    idsDeNotebooks(hoyIso()).catch(() => null),
  ]);

  if (reservas.error || !reservas.data?.data)
    throw new Error("No pudimos cargar los turnos. Volvé a intentarlo.");

  return ordenar(
    reservas.data.data.map((reserva) => aTurno(reserva, idsNotebook)),
  );
}

export interface ResultadoCancelacion {
  id: number;
  ok: boolean;
  error?: string;
}

export async function cancelarTurnos(
  ids: number[],
  motivo: string,
): Promise<ResultadoCancelacion[]> {
  return Promise.all(
    ids.map(async (id) => {
      try {
        await cancelarReserva(id, motivo);
        return { id, ok: true };
      } catch (fallo) {
        return {
          id,
          ok: false,
          error: fallo instanceof Error ? fallo.message : "Error desconocido",
        };
      }
    }),
  );
}
