import { getApiReservas } from "~/utils/openapi-gen";
import type { GetApiReservasResponses } from "~/utils/openapi-gen";
import { idsDeNotebooks } from "~/api/disponibilidad";
import { obtenerToken } from "~/api/auth";
import { hoyIso, partesDeIso } from "~/constants/horarios";
import type { EstadoTurno, Turno } from "~/types/admin";

type ReservaDelBack = GetApiReservasResponses[200]["data"][number];

// Respaldo para cuando no se pudo traer el padrón de notebooks: el back no
// expone el tipo del recurso en la respuesta de reservas, solo el nombre.
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

  return {
    id: reserva.id,
    alumno,
    email: reserva.usuario?.email ?? "",
    fecha: desde.fecha,
    inicio: desde.hora,
    fin: partesDeIso(reserva.fechaHoraFin).hora,
    estado: estadoDe(
      new Date(reserva.fechaHoraInicio),
      new Date(reserva.fechaHoraFin),
      Boolean(reserva.fechaHoraCancelacion),
    ),
    conNotebook: idsNotebook
      ? reserva.recursos.some((item) => idsNotebook.has(item.recursoId))
      : recursos.some(pareceNotebook),
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
  // Un administrador sin usuarioId recibe las reservas de todos.
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
