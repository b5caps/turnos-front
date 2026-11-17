export type EstadoAsistencia =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "EN_CURSO"
  | "FINALIZADA"
  | "CANCELADA"
  | "LIBERADA_POR_AUSENCIA";

export interface Asistencia {
  id: number;
  estado: EstadoAsistencia;
  fechaLimiteCheckIn: string;
  fechaHoraCheckIn: string | null;
  origenCheckIn: "QR" | "ADMIN" | null;
  checkInRegistradoPorId: number | null;
}

export interface ConsultarCheckInResponse {
  recursoId: number;
  reservas: Asistencia[];
}

export interface QrEspacioEmitido {
  id: number;
  recursoId: number;
  fechaCreacion: string;
  tokenQr: string;
  url: string;
  qrSvg: string;
}
