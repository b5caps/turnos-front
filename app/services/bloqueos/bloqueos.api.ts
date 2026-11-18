import { client } from "~/utils/openapi-gen/client.gen";
import type {
  Bloqueo,
  CrearBloqueoInput,
  FiltroBloqueosQuery,
  ResultadoCrearBloqueo,
} from "./types";
import type { EspacioSala } from "~/types/espacios";
import { partesDeIso } from "~/constants/horarios";

function formatearError(
  status: number | undefined,
  error: any,
  defaultMsg: string,
): Error {
  if (status === 403) {
    return new Error("Se requieren permisos de administrador");
  }
  if (status === 400) {
    const msg =
      typeof error === "object" && error?.message
        ? error.message
        : "Datos o rango temporal inválidos";
    return new Error(msg);
  }
  if (status === 404) {
    const msg =
      typeof error === "object" && error?.message
        ? error.message
        : "Espacio o bloqueo no encontrado";
    return new Error(msg);
  }
  const fallback =
    typeof error === "object" && error?.message ? error.message : defaultMsg;
  return new Error(fallback);
}

export async function listarEspaciosActivos(): Promise<EspacioSala[]> {
  const { data, error, response } = await client.get<{ data: any[] }>({
    url: "/api/espacios",
  });

  if (error || !data?.data) {
    throw formatearError(
      response?.status,
      error,
      "No pudimos cargar los espacios.",
    );
  }

  return data.data
    .filter((e: any) => e.activo !== false)
    .map((e: any) => ({
      id: Number(e.id),
      identificador: e.nombre || e.identificador || `Sala #${e.id}`,
      nombre: e.nombre || e.identificador || `Sala #${e.id}`,
      capacidad: Number(e.capacidad) || 0,
      descripcion: e.descripcion ?? null,
      activo: e.activo !== false,
      tipoRecurso: (e.tipoRecurso as any) || "SALA",
      ubicacion: e.ubicacion || "",
    }));
}

export async function listarBloqueos(
  query?: FiltroBloqueosQuery,
): Promise<Bloqueo[]> {
  const queryParams: Record<string, string> = {};
  if (query?.desde) queryParams.desde = query.desde;
  if (query?.hasta) queryParams.hasta = query.hasta;

  const { data, error, response } = await client.get<{ data: Bloqueo[] }>({
    url: "/api/bloqueos",
    query: Object.keys(queryParams).length ? queryParams : undefined,
  });

  if (error || !data?.data) {
    throw formatearError(
      response?.status,
      error,
      "No pudimos listar los bloqueos.",
    );
  }

  const espacioId = query?.espacioId;
  const lista = espacioId
    ? data.data.filter((b) => b.recursoId === null || b.recursoId === espacioId)
    : data.data;

  return [...lista].sort((a, b) =>
    b.fechaHoraInicio.localeCompare(a.fechaHoraInicio),
  );
}

export async function crearBloqueo(
  recursoId: number | null,
  input: CrearBloqueoInput,
): Promise<ResultadoCrearBloqueo> {
  const { data, error, response } = await client.post<{
    data: Bloqueo;
    reservasCanceladas?: number;
    holdsLiberados?: number;
  }>({
    url: "/api/bloqueos",
    body: { ...input, recursoId },
  });

  if (error || !data?.data) {
    throw formatearError(
      response?.status,
      error,
      "No pudimos registrar el bloqueo.",
    );
  }

  return {
    bloqueo: data.data,
    reservasCanceladas: data.reservasCanceladas ?? 0,
    holdsLiberados: data.holdsLiberados ?? 0,
  };
}

export async function eliminarBloqueo(bloqueoId: number): Promise<void> {
  const { error, response } = await client.delete({
    url: `/api/bloqueos/${bloqueoId}`,
  });

  if (error && response?.status !== 204) {
    throw formatearError(
      response?.status,
      error,
      "No pudimos eliminar el bloqueo.",
    );
  }
}

export async function contarReservasEnRango(
  fecha: string,
  horaInicio: string,
  horaFin: string,
  recursoId?: number | null,
  nombreSala?: string,
): Promise<number> {
  try {
    const { data } = await client.get<{
      data: Array<{
        id: number;
        fechaHoraInicio: string;
        fechaHoraFin: string;
        fechaHoraCancelacion: string | null;
        recursos: Array<{ recurso: { id: number; nombre: string } }>;
      }>;
    }>({
      url: "/api/reservas",
    });

    if (!data?.data) return 0;

    const fechaStr = fecha.slice(0, 10);
    const coincidentes = data.data.filter((res) => {
      if (res.fechaHoraCancelacion) return false;
      const inicio = partesDeIso(res.fechaHoraInicio);
      const resInicio = inicio.hora;
      const resFin = partesDeIso(res.fechaHoraFin).hora;
      const resFecha = inicio.fecha;

      if (resFecha !== fechaStr) return false;

      if (recursoId !== undefined && recursoId !== null) {
        const tieneRecurso = res.recursos.some(
          (r) => r.recurso.id === recursoId,
        );
        if (!tieneRecurso) return false;
      } else if (nombreSala) {
        const tieneSala = res.recursos.some((r) =>
          r.recurso.nombre.toLowerCase().includes(nombreSala.toLowerCase()),
        );
        if (!tieneSala) return false;
      }

      // Solapamiento horario
      return resInicio < horaFin && resFin > horaInicio;
    });

    return coincidentes.length;
  } catch {
    return 0;
  }
}

export async function bloqueosActivosParaFecha(
  fechaIso: string,
  recursoId?: number,
): Promise<Bloqueo[]> {
  const fechaStr = fechaIso.slice(0, 10);
  const desde = `${fechaStr}T00:00:00-03:00`;
  const hasta = `${fechaStr}T23:59:59-03:00`;

  let lista: Bloqueo[];
  try {
    lista = await listarBloqueos(
      recursoId ? { espacioId: recursoId, desde, hasta } : { desde, hasta },
    );
  } catch {
    return [];
  }

  return lista.filter((b) => {
    if (
      recursoId !== undefined &&
      b.recursoId !== null &&
      b.recursoId !== recursoId
    ) {
      return false;
    }

    const fIni = partesDeIso(b.fechaHoraInicio).fecha;
    const fFin = b.fechaHoraFin
      ? partesDeIso(b.fechaHoraFin).fecha
      : "9999-12-31";
    return fechaStr >= fIni && fechaStr <= fFin;
  });
}
