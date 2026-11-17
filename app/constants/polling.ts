export const POLLING_INTERVALOS = {
  DISPONIBILIDAD_SALAS: 20_000, // 20 segundos (alumno: reserva y disponibilidad)
  MIS_RESERVAS: 60_000, // 60 segundos (alumno: listado de reservas)
  ADMIN_TURNOS: 30_000, // 30 segundos (admin: grilla de turnos)
  ADMIN_KPI: 30_000, // 30 segundos (admin: métricas dashboard)
} as const;
