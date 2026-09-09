import { computed, ref } from 'vue'
import { BLOQUE_MINUTOS, generarBloques, hoyIso, horaAMinutos, sumarDias } from '~/constants/horarios'
import { disponibilidadDe } from '~/mocks/disponibilidad'
import type { BloqueDisponibilidad, DisponibilidadDia, EstadoBloque, RecursoDisponibilidad } from '~/types/disponibilidad'

function consultarDisponibilidad(fecha: string): Promise<DisponibilidadDia> {
  return new Promise(resolve => window.setTimeout(() => resolve(disponibilidadDe(fecha)), 220))
}

export function useDisponibilidad() {
  const bloques = generarBloques()
  const fecha = ref(hoyIso())
  const salaSeleccionada = ref<number | null>(null)
  const dia = ref<DisponibilidadDia | null>(null)
  const cargando = ref(false)
  const errorMessage = ref('')

  const abierta = computed(() => Boolean(dia.value?.abierta))
  const esHoy = computed(() => fecha.value === hoyIso())
  const salas = computed(() => dia.value?.recursos.filter(recurso => recurso.tipo === 'SALA') ?? [])
  const notebooks = computed(() => dia.value?.recursos.find(recurso => recurso.tipo === 'NOTEBOOK') ?? null)

  const minutosAhora = computed(() => {
    if (!esHoy.value) return -1
    const ahora = new Date()
    return ahora.getHours() * 60 + ahora.getMinutes()
  })

  const desdeVisible = computed(() => {
    if (!esHoy.value) return 0
    const indice = bloques.findIndex(inicio => horaAMinutos(inicio) + BLOQUE_MINUTOS > minutosAhora.value)
    return indice < 0 ? bloques.length : indice
  })

  const bloquesVisibles = computed(() => bloques.slice(desdeVisible.value))

  const recursosVisibles = computed<RecursoDisponibilidad[]>(() => {
    const elegidas = salaSeleccionada.value === null
      ? salas.value
      : salas.value.filter(sala => sala.id === salaSeleccionada.value)
    const lista = notebooks.value ? [...elegidas, notebooks.value] : elegidas
    return lista.map(recurso => ({ ...recurso, bloques: recurso.bloques.slice(desdeVisible.value) }))
  })

  async function cargar() {
    cargando.value = true
    errorMessage.value = ''
    try {
      dia.value = await consultarDisponibilidad(fecha.value)
    } catch {
      dia.value = null
      errorMessage.value = 'No pudimos cargar la disponibilidad. Volvé a intentarlo.'
    } finally {
      cargando.value = false
    }
  }

  function irAFecha(nuevaFecha: string) {
    if (!nuevaFecha || nuevaFecha === fecha.value) return
    fecha.value = nuevaFecha
    cargar()
  }

  function moverDias(dias: number) {
    irAFecha(sumarDias(fecha.value, dias))
  }

  function irAHoy() {
    irAFecha(hoyIso())
  }

  function seleccionarSala(id: number | null) {
    salaSeleccionada.value = salaSeleccionada.value === id ? null : id
  }

  function estadoDe(bloque: BloqueDisponibilidad): EstadoBloque {
    if (horaAMinutos(bloque.inicio) + BLOQUE_MINUTOS <= minutosAhora.value) return 'pasado'
    if (bloque.disponible) return 'disponible'
    return bloque.motivoNoDisponible ?? 'sin_cupos'
  }

  function duracionesPosibles(recursoId: number, inicio: string) {
    const recurso = dia.value?.recursos.find(item => item.id === recursoId)
    const desde = bloques.indexOf(inicio)
    if (!recurso || desde < 0) return []

    const duraciones: number[] = []
    for (let i = desde; i < recurso.bloques.length; i++) {
      const bloque = recurso.bloques[i]
      if (!bloque || estadoDe(bloque) !== 'disponible') break
      duraciones.push((i - desde + 1) * BLOQUE_MINUTOS)
    }
    return duraciones
  }

  function notebooksEnVentana(inicio: string, duracion: number) {
    const desde = bloques.indexOf(inicio)
    if (!notebooks.value || desde < 0 || duracion <= 0) return 0

    let menor = notebooks.value.capacidad
    for (let i = desde; i < desde + duracion / BLOQUE_MINUTOS; i++) {
      const bloque = notebooks.value.bloques[i]
      if (!bloque || estadoDe(bloque) !== 'disponible') return 0
      menor = Math.min(menor, bloque.cuposLibres)
    }
    return menor
  }

  return {
    bloques: bloquesVisibles,
    fecha,
    cargando,
    errorMessage,
    abierta,
    esHoy,
    salas,
    salaSeleccionada,
    recursosVisibles,
    cargar,
    irAFecha,
    moverDias,
    irAHoy,
    seleccionarSala,
    estadoDe,
    duracionesPosibles,
    notebooksEnVentana,
  }
}
