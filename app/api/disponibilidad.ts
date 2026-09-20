import { getApiRecursosDisponibilidadNotebooks, getApiRecursosDisponibilidadSalas } from '~/utils/openapi-gen'
import type { GetApiRecursosDisponibilidadNotebooksResponses } from '~/utils/openapi-gen'
import { aIsoConZona, finDelBloque, generarBloques } from '~/constants/horarios'
import type { BloqueDisponibilidad, DisponibilidadDia, RecursoDisponibilidad } from '~/types/disponibilidad'

type RecursoDelBack = GetApiRecursosDisponibilidadNotebooksResponses[200]['data'][number]
type RecursoEnVentana = Pick<RecursoDelBack, 'id' | 'nombre' | 'capacidad' | 'cuposLibres' | 'disponible' | 'motivoNoDisponible'>
type Consulta = (desde: string, hasta: string) => Promise<RecursoEnVentana[]>

const POR_TANDA = 6
const ID_NOTEBOOKS = -1

export const salasEntre: Consulta = async (desde, hasta) => {
  const { data, error } = await getApiRecursosDisponibilidadSalas({ query: { fechaHoraInicio: desde, fechaHoraFin: hasta } })
  if (error) throw new Error('No pudimos consultar la disponibilidad de las salas')
  return data?.data ?? []
}

export const notebooksEntre: Consulta = async (desde, hasta) => {
  const { data, error } = await getApiRecursosDisponibilidadNotebooks({ query: { fechaHoraInicio: desde, fechaHoraFin: hasta } })
  if (error) throw new Error('No pudimos consultar la disponibilidad de las notebooks')
  return data?.data ?? []
}

async function consultarCadaBloque(fecha: string, inicios: string[], consulta: Consulta) {
  const respuestas: RecursoEnVentana[][] = []
  for (let desde = 0; desde < inicios.length; desde += POR_TANDA) {
    const tanda = inicios.slice(desde, desde + POR_TANDA)
    respuestas.push(...await Promise.all(tanda.map(inicio => consulta(aIsoConZona(fecha, inicio), finDelBloque(fecha, inicio)))))
  }
  return respuestas
}

function salasConSusBloques(inicios: string[], respuestas: RecursoEnVentana[][]): RecursoDisponibilidad[] {
  const salas = new Map<number, RecursoDisponibilidad>()

  respuestas.forEach((enElBloque, indice) => {
    for (const sala of enElBloque) {
      if (!salas.has(sala.id)) {
        salas.set(sala.id, { id: sala.id, nombre: sala.nombre, tipo: 'SALA', capacidad: sala.capacidad, bloques: [] })
      }
      salas.get(sala.id)!.bloques.push({
        inicio: inicios[indice]!,
        cuposLibres: sala.cuposLibres,
        disponible: sala.disponible,
        motivoNoDisponible: sala.motivoNoDisponible,
      })
    }
  })

  return [...salas.values()]
}

function filaDeNotebooks(inicios: string[], respuestas: RecursoEnVentana[][]): RecursoDisponibilidad | null {
  const total = new Set(respuestas.flat().map(notebook => notebook.id)).size
  if (!total) return null

  const bloques: BloqueDisponibilidad[] = respuestas.map((enElBloque, indice) => {
    const libres = enElBloque.filter(notebook => notebook.disponible).length
    return {
      inicio: inicios[indice]!,
      cuposLibres: libres,
      disponible: libres > 0,
      motivoNoDisponible: libres > 0 ? null : 'sin_cupos',
    }
  })

  return { id: ID_NOTEBOOKS, nombre: 'Notebooks', tipo: 'NOTEBOOK', capacidad: total, bloques }
}

export async function disponibilidadDelDia(fecha: string): Promise<DisponibilidadDia> {
  const inicios = generarBloques()
  const salas = salasConSusBloques(inicios, await consultarCadaBloque(fecha, inicios, salasEntre))
  const notebooks = filaDeNotebooks(inicios, await consultarCadaBloque(fecha, inicios, notebooksEntre))

  return { fecha, abierta: true, recursos: notebooks ? [...salas, notebooks] : salas }
}
