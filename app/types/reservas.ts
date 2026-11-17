export type EstadoReserva =
  "activa" | "cancelada" | "finalizada" | "liberada_por_ausencia";
export type EstadoFiltro = "todas" | "activas" | "canceladas" | "finalizadas";

export interface ReservaPropia {
  id: number;
  fecha: string;
  inicio: string;
  fin: string;
  recursos: string[];
  estado: EstadoReserva;
  motivoCancelacion: string | null;
  limiteCheckIn: string | null;
  conCheckIn: boolean;
  cancelable: boolean;
}
