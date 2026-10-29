export type EstadoTurno = "pendiente" | "activo" | "finalizado" | "cancelado";
export type FiltroTurno = "todos" | EstadoTurno;

export interface Turno {
  id: number;
  alumno: string;
  email: string;
  fecha: string;
  inicio: string;
  fin: string;
  estado: EstadoTurno;
  conNotebook: boolean;
}

export interface MetricasTurnos {
  pendientes: number;
  activos: number;
  cancelados: number;
  notebooks: number;
}
