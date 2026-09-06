export type TipoRecurso = 'SALA' | 'NOTEBOOK'
export type MotivoNoDisponible = 'fuera_de_horario' | 'bloqueado' | 'sin_cupos'
export type EstadoBloque = 'disponible' | MotivoNoDisponible | 'pasado'

export interface BloqueDisponibilidad {
  inicio: string
  cuposLibres: number
  disponible: boolean
  motivoNoDisponible: MotivoNoDisponible | null
}

export interface RecursoDisponibilidad {
  id: number
  nombre: string
  tipo: TipoRecurso
  capacidad: number
  bloques: BloqueDisponibilidad[]
}

export interface DisponibilidadDia {
  fecha: string
  abierta: boolean
  recursos: RecursoDisponibilidad[]
}
