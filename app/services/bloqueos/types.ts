export interface Bloqueo {
  id: number;
  recursoId: number | null;
  recurso?: {
    id: number;
    nombre: string;
    ubicacion?: string | null;
  } | null;
  fechaHoraInicio: string;
  fechaHoraFin: string | null;
  motivo: string;
  fechaCreacion: string;
  creadoPorId: number | null;
}

export interface CrearBloqueoFranja {
  tipo: "FRANJA";
  fechaHoraInicio: string;
  fechaHoraFin: string | null;
  motivo: string;
}

export interface CrearBloqueoDiasCompletos {
  tipo: "DIAS_COMPLETOS";
  fechaDesde: string;
  fechaHasta: string;
  motivo: string;
}

export type CrearBloqueoInput = CrearBloqueoFranja | CrearBloqueoDiasCompletos;

export interface FiltroBloqueosQuery {
  desde?: string;
  hasta?: string;
  espacioId?: number;
}

export interface ResultadoCrearBloqueo {
  bloqueo: Bloqueo;
  reservasCanceladas: number;
  holdsLiberados: number;
}
