export type OrigenFeriado = "API" | "MANUAL";

export interface Feriado {
  fecha: string; // YYYY-MM-DD
  nombre: string;
  origen: OrigenFeriado;
}

export interface FeriadosCacheEntry {
  anio: number;
  fechaConsulta: string; // ISO string
  feriados: Feriado[];
}

export interface ResultadoFeriados {
  feriados: Feriado[];
  fuente: "API" | "CACHE" | "MOCK";
  avisoFallback?: string;
}
