import type { Feriado, ResultadoFeriados } from "./types";

const STORAGE_MANUALES_KEY = "greb_feriados_manuales";
const STORAGE_ELIMINADOS_KEY = "greb_feriados_eliminados";

export const FERIADOS_MOCK_2026_2027: Feriado[] = [
  // 2026
  { fecha: "2026-01-01", nombre: "Año Nuevo", origen: "API" },
  { fecha: "2026-02-16", nombre: "Carnaval", origen: "API" },
  { fecha: "2026-02-17", nombre: "Carnaval", origen: "API" },
  {
    fecha: "2026-03-24",
    nombre: "Día Nacional de la Memoria por la Verdad y la Justicia",
    origen: "API",
  },
  {
    fecha: "2026-04-02",
    nombre: "Día del Veterano y de los Caídos en la Guerra de Malvinas",
    origen: "API",
  },
  { fecha: "2026-04-03", nombre: "Viernes Santo", origen: "API" },
  { fecha: "2026-05-01", nombre: "Día del Trabajador", origen: "API" },
  {
    fecha: "2026-05-25",
    nombre: "Día de la Revolución de Mayo",
    origen: "API",
  },
  {
    fecha: "2026-06-15",
    nombre: "Paso a la Inmortalidad del Gral. Martín Miguel de Güemes",
    origen: "API",
  },
  {
    fecha: "2026-06-20",
    nombre: "Paso a la Inmortalidad del Gral. Manuel Belgrano",
    origen: "API",
  },
  { fecha: "2026-07-09", nombre: "Día de la Independencia", origen: "API" },
  {
    fecha: "2026-08-17",
    nombre: "Paso a la Inmortalidad del Gral. José de San Martín",
    origen: "API",
  },
  {
    fecha: "2026-10-12",
    nombre: "Día del Respeto a la Diversidad Cultural",
    origen: "API",
  },
  {
    fecha: "2026-11-20",
    nombre: "Día de la Soberanía Nacional",
    origen: "API",
  },
  {
    fecha: "2026-12-08",
    nombre: "Día de la Inmaculada Concepción de María",
    origen: "API",
  },
  { fecha: "2026-12-25", nombre: "Navidad", origen: "API" },

  // 2027
  { fecha: "2027-01-01", nombre: "Año Nuevo", origen: "API" },
  { fecha: "2027-02-08", nombre: "Carnaval", origen: "API" },
  { fecha: "2027-02-09", nombre: "Carnaval", origen: "API" },
  {
    fecha: "2027-03-24",
    nombre: "Día Nacional de la Memoria por la Verdad y la Justicia",
    origen: "API",
  },
  { fecha: "2027-03-26", nombre: "Viernes Santo", origen: "API" },
  {
    fecha: "2027-04-02",
    nombre: "Día del Veterano y de los Caídos en la Guerra de Malvinas",
    origen: "API",
  },
  { fecha: "2027-05-01", nombre: "Día del Trabajador", origen: "API" },
  {
    fecha: "2027-05-25",
    nombre: "Día de la Revolución de Mayo",
    origen: "API",
  },
  {
    fecha: "2027-06-20",
    nombre: "Paso a la Inmortalidad del Gral. Manuel Belgrano",
    origen: "API",
  },
  { fecha: "2027-07-09", nombre: "Día de la Independencia", origen: "API" },
  {
    fecha: "2027-08-16",
    nombre: "Paso a la Inmortalidad del Gral. José de San Martín",
    origen: "API",
  },
  {
    fecha: "2027-10-11",
    nombre: "Día del Respeto a la Diversidad Cultural",
    origen: "API",
  },
  {
    fecha: "2027-11-20",
    nombre: "Día de la Soberanía Nacional",
    origen: "API",
  },
  {
    fecha: "2027-12-08",
    nombre: "Día de la Inmaculada Concepción de María",
    origen: "API",
  },
  { fecha: "2027-12-25", nombre: "Navidad", origen: "API" },
];

export interface FeriadoManualItem extends Feriado {
  fechaOriginal?: string;
}

export function cargarManuales(): FeriadoManualItem[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_MANUALES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function persistirManuales(items: FeriadoManualItem[]) {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(STORAGE_MANUALES_KEY, JSON.stringify(items));
  }
}

export function cargarEliminados(): string[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_ELIMINADOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function persistirEliminados(fechas: string[]) {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(STORAGE_ELIMINADOS_KEY, JSON.stringify(fechas));
  }
}

export function fusionarFeriados(base: Feriado[]): Feriado[] {
  const manuales = cargarManuales();
  const eliminados = new Set(cargarEliminados());

  // 1. Filtrar eliminados
  let lista = base.filter((f) => !eliminados.has(f.fecha));

  // 2. Aplicar modificaciones que sustituyen fechas originales
  for (const m of manuales) {
    if (m.fechaOriginal) {
      lista = lista.filter((f) => f.fecha !== m.fechaOriginal);
    }
  }

  // 3. Crear mapa con la lista base
  const mapa = new Map<string, Feriado>();
  for (const f of lista) {
    mapa.set(f.fecha, f);
  }

  // 4. Agregar / sobreescribir con manuales
  for (const m of manuales) {
    mapa.set(m.fecha, {
      fecha: m.fecha,
      nombre: m.nombre,
      origen: "MANUAL",
    });
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.fecha.localeCompare(b.fecha),
  );
}

function validarFeriado(fecha: string, nombre: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error("El formato de fecha debe ser YYYY-MM-DD");
  }
  if (!nombre || !nombre.trim()) {
    throw new Error("El nombre del feriado no puede estar vacío");
  }
}

export async function obtenerFeriados(
  anios?: number[],
): Promise<ResultadoFeriados> {
  const aniosFiltro = anios && anios.length ? anios : [2026, 2027];
  const filtrados = FERIADOS_MOCK_2026_2027.filter((f) =>
    aniosFiltro.includes(Number(f.fecha.slice(0, 4))),
  );

  const feriados = fusionarFeriados(filtrados);

  return {
    feriados,
    fuente: "MOCK",
    avisoFallback:
      "Modo mock activo: usando feriados de ejemplo para 2026 y 2027.",
  };
}

export async function agregarFeriado(
  fecha: string,
  nombre: string,
): Promise<Feriado> {
  validarFeriado(fecha, nombre);

  const manuales = cargarManuales();
  const filtrados = manuales.filter((m) => m.fecha !== fecha);

  const nuevo: FeriadoManualItem = {
    fecha,
    nombre: nombre.trim(),
    origen: "MANUAL",
  };

  filtrados.push(nuevo);
  persistirManuales(filtrados);

  // Quitar de eliminados si estaba
  const eliminados = cargarEliminados().filter((f) => f !== fecha);
  persistirEliminados(eliminados);

  return { fecha: nuevo.fecha, nombre: nuevo.nombre, origen: "MANUAL" };
}

export async function editarFeriado(
  fechaOriginal: string,
  nuevaFecha: string,
  nuevoNombre: string,
): Promise<Feriado> {
  validarFeriado(nuevaFecha, nuevoNombre);

  const manuales = cargarManuales();
  // Quitar cualquier registro previo que apunte a la misma fecha o fechaOriginal
  const restantes = manuales.filter(
    (m) => m.fecha !== fechaOriginal && m.fecha !== nuevaFecha,
  );

  const editado: FeriadoManualItem = {
    fecha: nuevaFecha,
    nombre: nuevoNombre.trim(),
    origen: "MANUAL",
    fechaOriginal: fechaOriginal !== nuevaFecha ? fechaOriginal : undefined,
  };

  restantes.push(editado);
  persistirManuales(restantes);

  return { fecha: editado.fecha, nombre: editado.nombre, origen: "MANUAL" };
}

export async function eliminarFeriado(fecha: string): Promise<void> {
  // Quitar de manuales
  const manuales = cargarManuales().filter(
    (m) => m.fecha !== fecha && m.fechaOriginal !== fecha,
  );
  persistirManuales(manuales);

  // Registrar en eliminados
  const eliminados = cargarEliminados();
  if (!eliminados.includes(fecha)) {
    eliminados.push(fecha);
    persistirEliminados(eliminados);
  }
}

export async function esFeriado(fechaStr: string): Promise<Feriado | null> {
  const anio = Number(fechaStr.slice(0, 4));
  const res = await obtenerFeriados([anio]);
  return res.feriados.find((f) => f.fecha === fechaStr) ?? null;
}
