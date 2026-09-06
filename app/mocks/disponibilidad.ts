import { APERTURA_MINUTOS, BLOQUE_MINUTOS, CIERRE_MINUTOS, esDiaHabil, horaAMinutos, minutosAHora } from '~/constants/horarios'
import type { BloqueDisponibilidad, DisponibilidadDia, RecursoDisponibilidad, TipoRecurso } from '~/types/disponibilidad'

interface PerfilRecurso {
  id: number
  nombre: string
  tipo: TipoRecurso
  capacidad: number
  abreMinutos: number
  bloqueos: { desde: string; hasta: string }[]
  pico: number
  intensidad: number
}

const PERFILES: PerfilRecurso[] = [
  { id: 1, nombre: 'Sala A', tipo: 'SALA', capacidad: 20, abreMinutos: APERTURA_MINUTOS, bloqueos: [], pico: 12 * 60 + 30, intensidad: 1 },
  { id: 2, nombre: 'Sala B', tipo: 'SALA', capacidad: 10, abreMinutos: APERTURA_MINUTOS, bloqueos: [{ desde: '11:00', hasta: '13:00' }], pico: 17 * 60, intensidad: 0.85 },
  { id: 3, nombre: 'Sala C', tipo: 'SALA', capacidad: 6, abreMinutos: 14 * 60, bloqueos: [], pico: 18 * 60, intensidad: 0.7 },
  { id: 4, nombre: 'Notebooks', tipo: 'NOTEBOOK', capacidad: 12, abreMinutos: APERTURA_MINUTOS, bloqueos: [], pico: 15 * 60, intensidad: 0.9 },
]

function semillaDe(fecha: string) {
  let acumulado = 0
  for (let i = 0; i < fecha.length; i++) acumulado = (acumulado * 31 + fecha.charCodeAt(i)) % 997
  return acumulado
}

function cuposLibresEn(perfil: PerfilRecurso, minutos: number, semilla: number) {
  const distancia = Math.abs(minutos - perfil.pico) / 180
  const curva = Math.max(0, 1 - distancia * distancia)
  const variacion = ((semilla + minutos) % 5) / 10 - 0.2
  const ocupados = Math.round(perfil.capacidad * perfil.intensidad * (curva + variacion))
  return perfil.capacidad - Math.min(perfil.capacidad, Math.max(0, ocupados))
}

function construirBloques(perfil: PerfilRecurso, semilla: number): BloqueDisponibilidad[] {
  const bloques: BloqueDisponibilidad[] = []

  for (let minutos = APERTURA_MINUTOS; minutos < CIERRE_MINUTOS; minutos += BLOQUE_MINUTOS) {
    const inicio = minutosAHora(minutos)

    if (minutos < perfil.abreMinutos) {
      bloques.push({ inicio, cuposLibres: 0, disponible: false, motivoNoDisponible: 'fuera_de_horario' })
      continue
    }
    if (perfil.bloqueos.some(({ desde, hasta }) => minutos >= horaAMinutos(desde) && minutos < horaAMinutos(hasta))) {
      bloques.push({ inicio, cuposLibres: 0, disponible: false, motivoNoDisponible: 'bloqueado' })
      continue
    }

    const cuposLibres = cuposLibresEn(perfil, minutos, semilla)
    bloques.push({ inicio, cuposLibres, disponible: cuposLibres > 0, motivoNoDisponible: cuposLibres > 0 ? null : 'sin_cupos' })
  }

  return bloques
}

export function disponibilidadDe(fecha: string): DisponibilidadDia {
  if (!esDiaHabil(fecha)) return { fecha, abierta: false, recursos: [] }

  const semilla = semillaDe(fecha)
  const recursos: RecursoDisponibilidad[] = PERFILES.map(perfil => ({
    id: perfil.id,
    nombre: perfil.nombre,
    tipo: perfil.tipo,
    capacidad: perfil.capacidad,
    bloques: construirBloques(perfil, semilla),
  }))

  return { fecha, abierta: true, recursos }
}
