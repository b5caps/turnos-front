<script setup lang="ts">
import { computed } from 'vue'
import { BLOQUE_MINUTOS, horaAMinutos, minutosAHora } from '~/constants/horarios'
import type { BloqueDisponibilidad, EstadoBloque, RecursoDisponibilidad } from '~/types/disponibilidad'

const props = withDefaults(defineProps<{
  recursos: RecursoDisponibilidad[]
  bloques: string[]
  estadoDe: (bloque: BloqueDisponibilidad) => EstadoBloque
  seleccionable?: boolean
  seleccion?: { recursoId: number; inicio: string } | null
  bloquesSeleccionados?: number
  compacto?: boolean
}>(), { seleccionable: false, seleccion: null, bloquesSeleccionados: 1, compacto: false })

const emit = defineEmits<{ seleccionar: [recursoId: number, inicio: string] }>()

const COLOR_SALA: Record<EstadoBloque, string> = {
  disponible: 'bg-mint text-forest-deep',
  sin_cupos: 'bg-full text-full-ink',
  bloqueado: 'bg-blocked text-blocked-ink',
  fuera_de_horario: 'bg-closed text-faint',
  pasado: 'bg-closed text-past-ink',
}

const COLOR_NOTEBOOK: Record<EstadoBloque, string> = {
  disponible: 'bg-notebook text-notebook-ink',
  sin_cupos: 'bg-full text-full-ink',
  bloqueado: 'bg-notebook-off text-notebook-off-ink',
  fuera_de_horario: 'bg-notebook-off text-notebook-off-ink',
  pasado: 'bg-notebook-off text-notebook-off-ink',
}

const columnas = computed(() => `72px repeat(${props.recursos.length}, minmax(0, 1fr))`)
const desdeSeleccionado = computed(() => (props.seleccion ? props.bloques.indexOf(props.seleccion.inicio) : -1))
const cierre = computed(() => {
  const ultimo = props.bloques[props.bloques.length - 1]
  return ultimo ? minutosAHora(horaAMinutos(ultimo) + BLOQUE_MINUTOS) : ''
})
const ocultarPalabra = computed(() => props.compacto)

const filas = computed(() => props.bloques.map((inicio, indice) => ({
  inicio,
  enPunto: inicio.endsWith(':00'),
  celdas: props.recursos.map(recurso => {
    const esNotebook = recurso.tipo === 'NOTEBOOK'
    const bloque = recurso.bloques[indice]
    const estado = bloque ? props.estadoDe(bloque) : ('fuera_de_horario' as EstadoBloque)
    const elegible = props.seleccionable && !esNotebook && estado === 'disponible'
    const dentroSeleccion = props.seleccion?.recursoId === recurso.id
      && desdeSeleccionado.value >= 0
      && indice >= desdeSeleccionado.value
      && indice < desdeSeleccionado.value + props.bloquesSeleccionados
    return {
      clave: `${recurso.id}-${inicio}`,
      recursoId: recurso.id,
      inicio,
      esNotebook,
      elegible,
      color: dentroSeleccion ? 'bg-forest font-bold text-white' : (esNotebook ? COLOR_NOTEBOOK[estado] : COLOR_SALA[estado]),
      ...contenidoDe(esNotebook, bloque, estado),
    }
  }),
})))

function contenidoDe(esNotebook: boolean, bloque: BloqueDisponibilidad | undefined, estado: EstadoBloque) {
  if (estado === 'disponible' && bloque) {
    if (esNotebook) return { valor: '', palabra: 'Disponible' }
    return { valor: String(bloque.cuposLibres), palabra: bloque.cuposLibres === 1 ? 'libre' : 'libres' }
  }
  if (estado === 'pasado') return { valor: '', palabra: '—' }
  if (estado === 'sin_cupos') return { valor: '', palabra: esNotebook ? 'No disponible' : 'completa' }
  if (estado === 'bloqueado') return { valor: '', palabra: esNotebook ? 'No disponible' : 'bloqueada' }
  return { valor: '', palabra: 'cerrada' }
}
</script>

<template>
  <div class="border border-line bg-paper">
    <div class="grid" :class="compacto ? 'text-mini' : 'text-xs max-tablet:text-mini'" :style="{ gridTemplateColumns: columnas }">
      <div class="sticky top-0 z-1 border-b border-line bg-paper"></div>
      <div v-for="recurso in recursos" :key="`encabezado-${recurso.id}`" class="sticky top-0 z-1 flex flex-col items-center gap-0.5 border-b border-line bg-paper px-2 py-3 max-tablet:px-1 max-tablet:py-2.5">
        <strong class="text-tiny max-tablet:text-xs">{{ recurso.nombre }}</strong>
        <small class="text-micro text-muted">{{ recurso.tipo === 'NOTEBOOK' ? `${recurso.capacidad} equipos` : `${recurso.capacidad} lugares` }}</small>
      </div>

      <template v-for="fila in filas" :key="fila.inicio">
        <div
          class="border-t border-hairline"
          :class="[
            compacto ? 'p-1.5 text-micro' : 'px-2.5 py-1 text-mini max-tablet:p-1.5 max-tablet:text-micro',
            fila.enPunto ? 'font-bold text-muted' : 'text-faint',
          ]"
        >{{ fila.inicio }}</div>
        <component
          :is="celda.elegible ? 'button' : 'div'"
          v-for="celda in fila.celdas"
          :key="celda.clave"
          class="m-px flex w-full items-center justify-center gap-1 border-0 border-t border-t-transparent text-center leading-tight font-[inherit]"
          :class="[
            celda.color,
            compacto ? 'px-1 py-1.5' : 'p-1 max-tablet:px-1 max-tablet:py-1.5',
            fila.enPunto && 'border-t-hairline',
            celda.esNotebook && 'border-l border-l-line',
            celda.elegible && 'hover:outline hover:-outline-offset-1 hover:outline-forest',
          ]"
          :type="celda.elegible ? 'button' : undefined"
          @click="celda.elegible && emit('seleccionar', celda.recursoId, celda.inicio)"
        >
          <span v-if="celda.valor" :class="ocultarPalabra ? 'text-tiny font-bold' : 'max-tablet:text-tiny max-tablet:font-bold'">{{ celda.valor }}</span>
          <span :class="celda.valor && (ocultarPalabra ? 'hidden' : 'max-tablet:hidden')">{{ celda.palabra }}</span>
        </component>
      </template>

      <div class="col-span-full flex items-center gap-2.5 border-t border-line px-2.5 py-2 text-micro text-faint">
        <span class="text-mini font-bold text-muted">{{ cierre }}</span> cierra la biblioteca
      </div>
    </div>
  </div>
</template>
