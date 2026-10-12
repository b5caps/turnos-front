import {
  getApiRecursosDisponibilidadNotebooks,
  getApiRecursosDisponibilidadSalas,
} from "~/utils/openapi-gen";
import type { GetApiRecursosDisponibilidadSalasResponses } from "~/utils/openapi-gen";
import type {
  BloqueDisponibilidad,
  DisponibilidadDia,
  RecursoDisponibilidad,
} from "~/types/disponibilidad";

type RecursoDelBack =
  GetApiRecursosDisponibilidadSalasResponses[200]["recursos"][number];
type RecursoDelDia = Pick<
  RecursoDelBack,
  "id" | "nombre" | "capacidad" | "bloques"
>;

const ID_NOTEBOOKS = -1;

async function salasDelDia(fecha: string): Promise<RecursoDelDia[]> {
  const { data, error } = await getApiRecursosDisponibilidadSalas({
    query: { fecha },
  });
  if (error)
    throw new Error("No pudimos consultar la disponibilidad de las salas");
  return data?.recursos ?? [];
}

async function notebooksDelDia(fecha: string): Promise<RecursoDelDia[]> {
  const { data, error } = await getApiRecursosDisponibilidadNotebooks({
    query: { fecha },
  });
  if (error)
    throw new Error("No pudimos consultar la disponibilidad de las notebooks");
  return data?.recursos ?? [];
}

function aSala(recurso: RecursoDelDia): RecursoDisponibilidad {
  return {
    id: recurso.id,
    nombre: recurso.nombre,
    tipo: "SALA",
    capacidad: recurso.capacidad,
    bloques: recurso.bloques.map((bloque) => ({
      inicio: bloque.horaInicio,
      cuposLibres: Math.max(0, recurso.capacidad - bloque.ocupacion),
      disponible: bloque.disponible,
      motivoNoDisponible: bloque.motivoNoDisponible,
    })),
  };
}

function aFilaDeNotebooks(
  notebooks: RecursoDelDia[],
  inicios: string[],
): RecursoDisponibilidad | null {
  if (!notebooks.length) return null;

  const bloques: BloqueDisponibilidad[] = inicios.map((inicio, indice) => {
    const libres = notebooks.filter(
      (notebook) => notebook.bloques[indice]?.disponible,
    ).length;
    return {
      inicio,
      cuposLibres: libres,
      disponible: libres > 0,
      motivoNoDisponible: libres
        ? null
        : (notebooks[0]?.bloques[indice]?.motivoNoDisponible ?? "sin_cupos"),
    };
  });

  return {
    id: ID_NOTEBOOKS,
    nombre: "Notebooks",
    tipo: "NOTEBOOK",
    capacidad: notebooks.length,
    bloques,
  };
}

export async function notebookLibreEn(
  fecha: string,
  inicio: string,
  fin: string,
) {
  const notebooks = await notebooksDelDia(fecha);
  return (
    notebooks.find((notebook) =>
      notebook.bloques
        .filter(
          (bloque) => bloque.horaInicio >= inicio && bloque.horaInicio < fin,
        )
        .every((bloque) => bloque.disponible),
    ) ?? null
  );
}

export async function disponibilidadDelDia(
  fecha: string,
): Promise<DisponibilidadDia> {
  const [salas, notebooks] = await Promise.all([
    salasDelDia(fecha),
    notebooksDelDia(fecha),
  ]);

  const inicios = (salas[0] ?? notebooks[0])?.bloques.map(
    (bloque) => bloque.horaInicio,
  );

  if (!inicios?.length)
    return { fecha, abierta: false, bloques: [], recursos: [] };

  const fila = aFilaDeNotebooks(notebooks, inicios);
  const recursos = salas.map(aSala);

  return {
    fecha,
    abierta: true,
    bloques: inicios,
    recursos: fila ? [...recursos, fila] : recursos,
  };
}
