import type {
  Bloqueo,
  CrearBloqueoInput,
  FiltroBloqueosQuery,
  ResultadoBloqueoMultiple,
} from "./types";
import type { EspacioSala } from "~/types/espacios";
import { listarEspaciosActivos as listarEspaciosReales } from "~/services/espacios.service";
import { reservasDe } from "~/mocks/reservas";

const STORAGE_KEY = "greb_mock_bloqueos_v3";

const BLOQUEOS_SEMILLA: Bloqueo[] = [
  {
    id: 101,
    recursoId: 2, // Sala B
    fechaHoraInicio: "2026-11-15T11:00:00-03:00",
    fechaHoraFin: "2026-11-15T13:00:00-03:00",
    motivo: "Mantenimiento eléctrico y luminarias",
    fechaCreacion: "2026-11-10T10:00:00-03:00",
    creadoPorId: 1,
  },
  {
    id: 102,
    recursoId: 1, // Sala A
    fechaHoraInicio: "2026-11-20T10:00:00-03:00",
    fechaHoraFin: "2026-11-20T22:00:00-03:00",
    motivo: "Jornada institucional y claustro docente",
    fechaCreacion: "2026-11-10T10:00:00-03:00",
    creadoPorId: 1,
  },
  {
    id: 103,
    recursoId: 2, // Sala B
    fechaHoraInicio: "2026-11-20T10:00:00-03:00",
    fechaHoraFin: "2026-11-20T22:00:00-03:00",
    motivo: "Jornada institucional y claustro docente",
    fechaCreacion: "2026-11-10T10:00:00-03:00",
    creadoPorId: 1,
  },
];

let memoriaBloqueos: Bloqueo[] | null = null;

function cargarDesdeAlmacenamiento(): Bloqueo[] {
  if (memoriaBloqueos !== null) return memoriaBloqueos;

  if (typeof window !== "undefined" && window.localStorage) {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        memoriaBloqueos = JSON.parse(raw);
        return memoriaBloqueos!;
      } catch {
        // Fallback a semilla si hubo corrupción
      }
    }
  }

  memoriaBloqueos = [...BLOQUEOS_SEMILLA];
  return memoriaBloqueos;
}

function persistirEnAlmacenamiento(items: Bloqueo[]) {
  memoriaBloqueos = [...items];
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoriaBloqueos));
  }
}

export async function listarEspaciosActivos(): Promise<EspacioSala[]> {
  return listarEspaciosReales();
}

export async function listarBloqueos(
  query?: FiltroBloqueosQuery,
): Promise<Bloqueo[]> {
  const lista = cargarDesdeAlmacenamiento();
  let resultado = [...lista];

  if (query?.espacioId !== undefined) {
    resultado = resultado.filter((b) => b.recursoId === query.espacioId);
  }

  if (query?.desde) {
    const fDesde = new Date(query.desde);
    resultado = resultado.filter((b) => {
      const fFin = b.fechaHoraFin
        ? new Date(b.fechaHoraFin)
        : new Date("9999-12-31");
      return fFin >= fDesde;
    });
  }

  if (query?.hasta) {
    const fHasta = new Date(query.hasta);
    resultado = resultado.filter((b) => {
      const fIni = new Date(b.fechaHoraInicio);
      return fIni <= fHasta;
    });
  }

  return resultado.sort((a, b) =>
    b.fechaHoraInicio.localeCompare(a.fechaHoraInicio),
  );
}

export async function crearBloqueo(
  espacioId: number,
  input: CrearBloqueoInput,
): Promise<Bloqueo> {
  const motivoLimpio = input.motivo?.trim() || "";
  if (!motivoLimpio || motivoLimpio.length > 255) {
    throw new Error("El motivo debe tener entre 1 y 255 caracteres.");
  }

  let inicioIso: string;
  let finIso: string | null;

  if (input.tipo === "FRANJA") {
    const inicio = new Date(input.fechaHoraInicio);
    if (isNaN(inicio.getTime())) {
      throw new Error("Fecha/hora de inicio inválida.");
    }
    if (input.fechaHoraFin) {
      const fin = new Date(input.fechaHoraFin);
      if (isNaN(fin.getTime()) || fin <= inicio) {
        throw new Error("El fin debe ser posterior al inicio");
      }
      finIso = input.fechaHoraFin;
    } else {
      finIso = null;
    }
    inicioIso = input.fechaHoraInicio;
  } else {
    if (!input.fechaDesde || !input.fechaHasta) {
      throw new Error("Fechas de días completos requeridas.");
    }
    if (input.fechaHasta < input.fechaDesde) {
      throw new Error("La fecha final no puede ser anterior a la inicial");
    }
    inicioIso = `${input.fechaDesde}T00:00:00-03:00`;
    finIso = `${input.fechaHasta}T23:59:59-03:00`;
  }

  const lista = cargarDesdeAlmacenamiento();

  const nuevo: Bloqueo = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    recursoId: espacioId,
    fechaHoraInicio: inicioIso,
    fechaHoraFin: finIso,
    motivo: motivoLimpio,
    fechaCreacion: new Date().toISOString(),
    creadoPorId: 1,
  };

  lista.unshift(nuevo);
  persistirEnAlmacenamiento(lista);

  return nuevo;
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
  const lista = cargarDesdeAlmacenamiento();
  const filtrada = lista.filter(
    (b) => !(b.id === bloqueoId && b.recursoId === espacioId),
  );

  if (filtrada.length === lista.length) {
    throw new Error("Bloqueo no encontrado en este espacio");
  }

  persistirEnAlmacenamiento(filtrada);
}

export async function contarReservasEnRango(
  fecha: string,
  horaInicio: string,
  horaFin: string,
  recursoId?: number | null,
  nombreSala?: string,
): Promise<number> {
  try {
    const lista = reservasDe("activas");
    const coincidentes = lista.filter((res) => {
      if (res.fecha !== fecha) return false;
      if (res.estado && res.estado !== "activa") return false;

      if (recursoId !== undefined && recursoId !== null && nombreSala) {
        const tieneSala = res.recursos.some((r) =>
          r.toLowerCase().includes(nombreSala.toLowerCase()),
        );
        if (!tieneSala) return false;
      }

      return res.inicio < horaFin && res.fin > horaInicio;
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
  const lista = cargarDesdeAlmacenamiento();
  const fechaStr = fechaIso.slice(0, 10);

  return lista.filter((b) => {
    if (recursoId !== undefined && b.recursoId !== recursoId) return false;

    const fIni = b.fechaHoraInicio.slice(0, 10);
    const fFin = b.fechaHoraFin ? b.fechaHoraFin.slice(0, 10) : "9999-12-31";
    return fechaStr >= fIni && fechaStr <= fFin;
  });
}
