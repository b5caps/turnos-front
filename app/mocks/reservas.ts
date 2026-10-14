import { aIsoConZona, hoyIso, sumarDias } from "~/constants/horarios";
import type {
  EstadoFiltro,
  EstadoReserva,
  ReservaPropia,
} from "~/types/reservas";

type Plantilla = Omit<ReservaPropia, "cancelable">;

const canceladas = new Map<number, string | null>();

function plantillas(): Plantilla[] {
  const hoy = hoyIso();
  return [
    {
      id: 101,
      fecha: hoy,
      inicio: "16:00",
      fin: "17:30",
      recursos: ["Sala A", "Notebooks"],
      estado: "activa",
      motivoCancelacion: null,
      limiteCheckIn: "16:15",
      conCheckIn: false,
    },
    {
      id: 102,
      fecha: hoy,
      inicio: "10:00",
      fin: "11:00",
      recursos: ["Sala B"],
      estado: "activa",
      motivoCancelacion: null,
      limiteCheckIn: "10:15",
      conCheckIn: true,
    },
    {
      id: 103,
      fecha: sumarDias(hoy, 3),
      inicio: "14:00",
      fin: "15:00",
      recursos: ["Sala C"],
      estado: "activa",
      motivoCancelacion: null,
      limiteCheckIn: "14:15",
      conCheckIn: false,
    },
    {
      id: 104,
      fecha: sumarDias(hoy, -2),
      inicio: "11:00",
      fin: "12:30",
      recursos: ["Sala A"],
      estado: "finalizada",
      motivoCancelacion: null,
      limiteCheckIn: "11:15",
      conCheckIn: true,
    },
    {
      id: 105,
      fecha: sumarDias(hoy, -5),
      inicio: "18:00",
      fin: "19:00",
      recursos: ["Sala B", "Notebooks"],
      estado: "cancelada",
      motivoCancelacion: "Se suspendió la cursada",
      limiteCheckIn: "18:15",
      conCheckIn: false,
    },
  ];
}

const COINCIDE: Record<EstadoFiltro, (reserva: Plantilla) => boolean> = {
  todas: () => true,
  activas: (reserva) => reserva.estado === "activa",
  canceladas: (reserva) => reserva.estado === "cancelada",
  finalizadas: (reserva) => reserva.estado === "finalizada",
};

function estadoDe(plantilla: Plantilla): EstadoReserva {
  if (canceladas.has(plantilla.id) || plantilla.estado === "cancelada")
    return "cancelada";
  if (new Date(aIsoConZona(plantilla.fecha, plantilla.fin)) <= new Date())
    return "finalizada";
  return plantilla.estado;
}

export function reservasDe(filtro: EstadoFiltro): ReservaPropia[] {
  return plantillas()
    .map((plantilla) => {
      const estado = estadoDe(plantilla);
      return {
        ...plantilla,
        estado,
        motivoCancelacion:
          canceladas.get(plantilla.id) ?? plantilla.motivoCancelacion,
        cancelable: estado === "activa" && !plantilla.conCheckIn,
      };
    })
    .filter(COINCIDE[filtro]);
}

export function cancelarEnMock(id: number, motivo: string | null) {
  const reserva = plantillas().find((plantilla) => plantilla.id === id);
  if (!reserva || estadoDe(reserva) !== "activa")
    throw new Error("Esta reserva ya no se puede cancelar.");
  if (reserva.conCheckIn)
    throw new Error("Ya hiciste el check-in, no podés cancelar la reserva.");
  canceladas.set(id, motivo);
}
