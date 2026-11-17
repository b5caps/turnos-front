import { client } from "~/utils/openapi-gen/client.gen";
import type {
  Bloqueo,
  CrearBloqueoInput,
  FiltroBloqueosQuery,
  ResultadoBloqueoMultiple,
} from "./types";
import type { EspacioSala } from "~/types/espacios";

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
  if (query?.espacioId) {
    const queryParams: Record<string, string> = {};
    if (query.desde) queryParams.desde = query.desde;
    if (query.hasta) queryParams.hasta = query.hasta;

    const { data, error, response } = await client.get<{ data: Bloqueo[] }>({
      url: `/api/espacios/${query.espacioId}/bloqueos`,
      query: Object.keys(queryParams).length ? queryParams : undefined,
    });

    if (error || !data?.data) {
      throw formatearError(
        response?.status,
        error,
        "No pudimos listar los bloqueos del espacio.",
      );
    }

    return [...data.data].sort((a, b) =>
      b.fechaHoraInicio.localeCompare(a.fechaHoraInicio),
    );
  }

  // Sin espacioId específico: consultamos todas las salas activas
  const salas = await listarEspaciosActivos();
  const queryParams: Record<string, string> = {};
  if (query?.desde) queryParams.desde = query.desde;
  if (query?.hasta) queryParams.hasta = query.hasta;

  const promesas = salas.map(async (sala) => {
    try {
      const { data } = await client.get<{ data: Bloqueo[] }>({
        url: `/api/espacios/${sala.id}/bloqueos`,
        query: Object.keys(queryParams).length ? queryParams : undefined,
      });
      return data?.data ?? [];
    } catch {
      return [];
    }
  });

  const listas = await Promise.all(promesas);
  const todos = listas.flat();

  // Deduplicar por id
  const mapa = new Map<number, Bloqueo>();
  for (const b of todos) {
    mapa.set(b.id, b);
  }

  return Array.from(mapa.values()).sort((a, b) =>
    b.fechaHoraInicio.localeCompare(a.fechaHoraInicio),
  );
}

export async function crearBloqueo(
  espacioId: number,
  input: CrearBloqueoInput,
): Promise<Bloqueo> {
  const { data, error, response } = await client.post<{ data: Bloqueo }>({
    url: `/api/espacios/${espacioId}/bloqueos`,
    body: input,
  });

  if (error || !data?.data) {
    throw formatearError(
      response?.status,
      error,
      "No pudimos registrar el bloqueo en este espacio.",
    );
  }

  return data.data;
}

export async function bloquearTodasLasSalas(
  input: CrearBloqueoInput,
): Promise<ResultadoBloqueoMultiple> {
  const salas = await listarEspaciosActivos();
  const exitosos: ResultadoBloqueoMultiple["exitosos"] = [];
  const fallidos: ResultadoBloqueoMultiple["fallidos"] = [];

  for (const sala of salas) {
    try {
      const bloqueo = await crearBloqueo(sala.id, input);
      exitosos.push({
        salaId: sala.id,
        salaNombre: sala.identificador,
        bloqueo,
      });
    } catch (err: any) {
      fallidos.push({
        salaId: sala.id,
        salaNombre: sala.identificador,
        error: err?.message || "Error al crear bloqueo",
      });
    }
  }

  return { exitosos, fallidos };
}

export async function eliminarBloqueo(
  espacioId: number,
  bloqueoId: number,
): Promise<void> {
  const { error, response } = await client.delete({
    url: `/api/espacios/${espacioId}/bloqueos/${bloqueoId}`,
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
      const resInicio = res.fechaHoraInicio.slice(11, 16);
      const resFin = res.fechaHoraFin.slice(11, 16);
      const resFecha = res.fechaHoraInicio.slice(0, 10);

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

  const lista = await listarBloqueos(
    recursoId ? { espacioId: recursoId, desde, hasta } : { desde, hasta },
  );

  return lista.filter((b) => {
    if (recursoId !== undefined && b.recursoId !== recursoId) return false;

    const fIni = b.fechaHoraInicio.slice(0, 10);
    const fFin = b.fechaHoraFin ? b.fechaHoraFin.slice(0, 10) : "9999-12-31";
    return fechaStr >= fIni && fechaStr <= fFin;
  });
}
