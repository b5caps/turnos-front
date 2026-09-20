import { postApiReservas } from '~/utils/openapi-gen'
import { notebooksEntre } from '~/api/disponibilidad'
import { USAR_API } from '~/constants/api'
import { USUARIO_DEMO } from '~/constants/auth'
import { aIsoConZona } from '~/constants/horarios'

export interface NuevaReserva {
  fecha: string
  inicio: string
  fin: string
  salaId: number
  salaNombre: string
  conNotebook: boolean
}

export interface ReservaConfirmada {
  id: number
  sala: string
  fecha: string
  inicio: string
  fin: string
  notebook: string | null
}

async function notebookLibre(desde: string, hasta: string) {
  const libres = (await notebooksEntre(desde, hasta)).filter(notebook => notebook.disponible)
  if (!libres.length) throw new Error('Ya no quedan notebooks para ese horario. Probá sin notebook o elegí otro horario.')
  return libres[0]!
}

export async function crearReserva(reserva: NuevaReserva): Promise<ReservaConfirmada> {
  const desde = aIsoConZona(reserva.fecha, reserva.inicio)
  const hasta = aIsoConZona(reserva.fecha, reserva.fin)

  if (!USAR_API) {
    return {
      id: 0,
      sala: reserva.salaNombre,
      fecha: reserva.fecha,
      inicio: reserva.inicio,
      fin: reserva.fin,
      notebook: reserva.conNotebook ? 'Notebook asignada' : null,
    }
  }

  const notebook = reserva.conNotebook ? await notebookLibre(desde, hasta) : null
  const recursoIds = notebook ? [reserva.salaId, notebook.id] : [reserva.salaId]

  const { data, error } = await postApiReservas({
    body: { usuarioId: USUARIO_DEMO, recursoIds, fechaHoraInicio: desde, fechaHoraFin: hasta },
  })

  if (error || !data?.data) throw new Error('No pudimos confirmar la reserva. Puede que el horario ya no esté disponible.')

  return {
    id: data.data.id,
    sala: reserva.salaNombre,
    fecha: reserva.fecha,
    inicio: reserva.inicio,
    fin: reserva.fin,
    notebook: notebook?.nombre ?? null,
  }
}
