export interface Bloqueo {
  id: number;
  recursoId: number;
  fechaHoraInicio: string;
  fechaHoraFin: string | null;
  motivo: string;
  fechaCreacion: string;
  creadoPorId: number | null;
}

export interface CrearBloqueoFranja {
  tipo: "FRANJA";
  fechaHoraInicio: string; // ISO con zona horaria
  fechaHoraFin: string | null; // ISO con zona horaria o null (indefinido)
  motivo: string; // 1 a 255 caracteres
}

export interface CrearBloqueoDiasCompletos {
  tipo: "DIAS_COMPLETOS";
  fechaDesde: string; // YYYY-MM-DD
  fechaHasta: string; // YYYY-MM-DD
  motivo: string; // 1 a 255 caracteres
}

export type CrearBloqueoInput = CrearBloqueoFranja | CrearBloqueoDiasCompletos;

export interface FiltroBloqueosQuery {
  desde?: string; // ISO con zona horaria
  hasta?: string; // ISO con zona horaria
  espacioId?: number;
}

export interface ResultadoBloqueoMultiple {
  exitosos: { salaId: number; salaNombre: string; bloqueo: Bloqueo }[];
  fallidos: { salaId: number; salaNombre: string; error: string }[];
}
