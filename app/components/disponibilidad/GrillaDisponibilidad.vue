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

const columnas = computed(() => `72px repeat(${props.recursos.length}, minmax(0, 1fr))`)
const desdeSeleccionado = computed(() => (props.seleccion ? props.bloques.indexOf(props.seleccion.inicio) : -1))
const cierre = computed(() => {
  const ultimo = props.bloques[props.bloques.length - 1]
  return ultimo ? minutosAHora(horaAMinutos(ultimo) + BLOQUE_MINUTOS) : ''
})

const filas = computed(() => props.bloques.map((inicio, indice) => ({
  inicio,
  enPunto: inicio.endsWith(':00'),
  celdas: props.recursos.map(recurso => {
    const bloque = recurso.bloques[indice]
    const estado = bloque ? props.estadoDe(bloque) : ('fuera_de_horario' as EstadoBloque)
    const elegible = props.seleccionable && recurso.tipo === 'SALA' && estado === 'disponible'
    const dentroSeleccion = props.seleccion?.recursoId === recurso.id
      && desdeSeleccionado.value >= 0
      && indice >= desdeSeleccionado.value
      && indice < desdeSeleccionado.value + props.bloquesSeleccionados
    return { clave: `${recurso.id}-${inicio}`, recursoId: recurso.id, inicio, estado, elegible, dentroSeleccion, ...contenidoDe(recurso, bloque, estado) }
  }),
})))

function contenidoDe(recurso: RecursoDisponibilidad, bloque: BloqueDisponibilidad | undefined, estado: EstadoBloque) {
  const esNotebook = recurso.tipo === 'NOTEBOOK'
  if (estado === 'disponible' && bloque) {
    const unico = bloque.cuposLibres === 1
    const palabra = esNotebook ? (unico ? 'disponible' : 'disponibles') : (unico ? 'libre' : 'libres')
    return { valor: String(bloque.cuposLibres), palabra }
  }
  if (estado === 'pasado') return { valor: '', palabra: '—' }
  if (estado === 'sin_cupos') return { valor: '', palabra: esNotebook ? 'sin equipos' : 'completa' }
  if (estado === 'bloqueado') return { valor: '', palabra: esNotebook ? 'bloqueadas' : 'bloqueada' }
  return { valor: '', palabra: 'cerrada' }
}
</script>

<template>
  <div class="grilla" :class="{ 'grilla--compacto': compacto }">
    <div class="grilla__scroll">
      <div class="grilla__tabla" :style="{ gridTemplateColumns: columnas }">
        <div class="grilla__esquina"></div>
        <div v-for="recurso in recursos" :key="`encabezado-${recurso.id}`" class="grilla__encabezado">
          <strong>{{ recurso.nombre }}</strong>
          <small>{{ recurso.tipo === 'NOTEBOOK' ? `${recurso.capacidad} equipos` : `${recurso.capacidad} lugares` }}</small>
        </div>

        <template v-for="fila in filas" :key="fila.inicio">
          <div class="grilla__hora" :class="{ 'grilla__hora--punto': fila.enPunto }">{{ fila.inicio }}</div>
          <component
            :is="celda.elegible ? 'button' : 'div'"
            v-for="celda in fila.celdas"
            :key="celda.clave"
            class="grilla__celda"
            :class="[`grilla__celda--${celda.estado}`, { 'grilla__celda--punto': fila.enPunto, 'grilla__celda--numerica': celda.valor, 'grilla__celda--elegible': celda.elegible, 'grilla__celda--elegida': celda.dentroSeleccion }]"
            :type="celda.elegible ? 'button' : undefined"
            @click="celda.elegible && emit('seleccionar', celda.recursoId, celda.inicio)"
          >
            <span v-if="celda.valor" class="grilla__valor">{{ celda.valor }}</span><span class="grilla__palabra">{{ celda.palabra }}</span>
          </component>
        </template>

        <div class="grilla__cierre"><span>{{ cierre }}</span> cierra la biblioteca</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grilla { border: 1px solid var(--line); background: var(--paper); }
.grilla__scroll { max-height: 62vh; overflow-y: auto; }
.grilla__tabla { display: grid; gap: 0; font-size: 12px; }
.grilla__esquina, .grilla__encabezado { position: sticky; top: 0; z-index: 1; background: var(--paper); border-bottom: 1px solid var(--line); }
.grilla__encabezado { display: flex; flex-direction: column; gap: 2px; align-items: center; padding: 12px 8px; }
.grilla__encabezado strong { font-size: 13px; }
.grilla__encabezado small { color: var(--muted); font-size: 10px; }
.grilla__hora { padding: 7px 10px; color: #b5beb8; font-size: 11px; border-top: 1px solid #f0f2ec; }
.grilla__hora--punto { color: var(--muted); font-weight: 700; }
.grilla__celda { display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%; text-align: center; line-height: 1.25; font: inherit; padding: 7px 5px; margin: 1px; border: 0; border-top: 1px solid transparent; }
.grilla__celda--punto { border-top-color: #f0f2ec; }
.grilla__celda--disponible { background: var(--mint); color: #16544a; }
.grilla__celda--sin_cupos { background: #fbe3da; color: #a8442f; }
.grilla__celda--bloqueado { background: #eceee7; color: #6b7872; }
.grilla__celda--fuera_de_horario { background: #f7f7f3; color: #b5beb8; }
.grilla__celda--pasado { background: #f7f7f3; color: #cbd2cb; }
.grilla__celda--elegible:hover { outline: 1px solid var(--forest); outline-offset: -1px; }
.grilla__celda--elegida { background: var(--forest); color: white; font-weight: 700; }
.grilla__cierre { grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-top: 1px solid var(--line); color: #b5beb8; font-size: 10px; }
.grilla__cierre span { color: var(--muted); font-size: 11px; font-weight: 700; }
.grilla--compacto .grilla__tabla { font-size: 11px; }
.grilla--compacto .grilla__hora { padding: 6px; font-size: 10px; }
.grilla--compacto .grilla__celda { padding: 8px 3px; }
.grilla--compacto .grilla__celda--numerica .grilla__palabra { display: none; }
.grilla--compacto .grilla__valor { font-weight: 700; font-size: 13px; }
@media (max-width: 720px) {
  .grilla__scroll { max-height: 58vh; }
  .grilla__tabla { font-size: 11px; }
  .grilla__encabezado { padding: 10px 4px; }
  .grilla__encabezado strong { font-size: 12px; }
  .grilla__hora { padding: 6px; font-size: 10px; }
  .grilla__celda { padding: 8px 3px; }
  .grilla__celda--numerica .grilla__palabra { display: none; }
  .grilla__valor { font-weight: 700; font-size: 13px; }
}
</style>
