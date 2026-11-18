export type EstadoTurno = "pendiente" | "activo" | "finalizado" | "cancelado";
export type CausaCancelacion = "USUARIO" | "ADMINISTRADOR" | "AUSENCIA";
export type FiltroTurno = "todos" | EstadoTurno;

export interface Turno {
  id: number;
  usuarioId: number;
  alumno: string;
  email: string;
  fecha: string;
  inicio: string;
  fin: string;
  estado: EstadoTurno;
  causaCancelacion: CausaCancelacion | null;
  conNotebook: boolean;
  cancelable: boolean;
}

export interface MetricasDia {
  reservasHoy: number;
  enCurso: number;
  canceladas: number;
  ocupacionSalas: number;
  salasOcupadas: number;
  totalSalas: number;
  notebooksLibres: number;
  totalNotebooks: number;
}

export interface AlumnoConocido {
  id: number;
  nombre: string;
  email: string;
}
