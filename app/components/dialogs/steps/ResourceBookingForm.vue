<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import EstadoDisponibilidad from '~/components/disponibilidad/EstadoDisponibilidad.vue'
import FiltroSalas from '~/components/disponibilidad/FiltroSalas.vue'
import GrillaDisponibilidad from '~/components/disponibilidad/GrillaDisponibilidad.vue'
import SelectorFecha from '~/components/disponibilidad/SelectorFecha.vue'
import { ACCIONES, BOTON_PRIMARIO, BOTON_SUAVE, ERROR, FLECHA_BOTON, INTRO_TEXTO, INTRO_TITULO } from '~/constants/estilos'
import { BLOQUE_MINUTOS, etiquetaDuracion, formatearFechaLarga, horaAMinutos, minutosAHora } from '~/constants/horarios'
import type { ReservaConfirmada } from '~/api/reservas'
import type { ResourceBooking } from '~/types'

const props = defineProps<{ modelValue: ResourceBooking; completed?: boolean; error?: string; loading?: boolean; reserva?: ReservaConfirmada | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: ResourceBooking]; submit: []; back: [] }>()
const { bloques, fecha, cargando, errorMessage, abierta, esHoy, salas, salaSeleccionada, recursosVisibles, cargar, irAFecha, moverDias, irAHoy, seleccionarSala, estadoDe, duracionesPosibles, notebooksEnVentana } = useDisponibilidad()
const seleccion = ref<{ recursoId: number; inicio: string } | null>(null)
const duracion = ref(0)
const duraciones = computed(() => seleccion.value ? duracionesPosibles(seleccion.value.recursoId, seleccion.value.inicio) : [])
const salaElegida = computed(() => salas.value.find(sala => sala.id === seleccion.value?.recursoId) ?? null)
const fin = computed(() => seleccion.value && duracion.value ? minutosAHora(horaAMinutos(seleccion.value.inicio) + duracion.value) : '')
const notebooksLibres = computed(() => seleccion.value ? notebooksEnVentana(seleccion.value.inicio, duracion.value) : 0)
const listo = computed(() => Boolean(salaElegida.value && duracion.value))

const SELECT = 'w-auto cursor-pointer border border-line bg-white px-3 py-3 text-xs text-ink outline-none transition focus:border-forest focus:shadow-focus'
const TICK = 'flex cursor-pointer flex-row items-start gap-2.5 text-mini font-bold text-field-label'

function elegir(recursoId: number, inicio: string) { seleccion.value = { recursoId, inicio }; duracion.value = duraciones.value[0] ?? 0 }
function actualizarBooleano(campo: 'wantsComputer' | 'computerConditionsAccepted', valor: boolean) { emit('update:modelValue', { ...props.modelValue, [campo]: valor, ...(campo === 'wantsComputer' && !valor ? { computerConditionsAccepted: false } : {}) }) }
function sincronizar() { emit('update:modelValue', { ...props.modelValue, resource: salaElegida.value?.nombre ?? '', resourceId: salaElegida.value?.id ?? 0, date: fecha.value, startTime: seleccion.value?.inicio ?? '', endTime: fin.value }) }
watch(fecha, () => { seleccion.value = null; duracion.value = 0 })
watch([seleccion, duracion], sincronizar)
watch(notebooksLibres, libres => { if (!libres && props.modelValue.wantsComputer) actualizarBooleano('wantsComputer', false) })
watch(() => props.completed, confirmada => { if (confirmada) cargar() })
onMounted(cargar)
</script>

<template>
  <div>
    <div v-if="completed" class="flex flex-col gap-2 bg-success p-3.5 text-xs text-forest">
      <strong class="text-tiny">Reserva confirmada</strong>
      <dl class="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-mini">
        <dt class="text-muted">Sala</dt><dd class="m-0 font-bold">{{ reserva?.sala }}</dd>
        <dt class="text-muted">Día</dt><dd class="m-0 font-bold">{{ reserva ? formatearFechaLarga(reserva.fecha) : '' }}</dd>
        <dt class="text-muted">Horario</dt><dd class="m-0 font-bold">{{ reserva?.inicio }} a {{ reserva?.fin }}</dd>
        <template v-if="reserva?.notebook"><dt class="text-muted">Notebook</dt><dd class="m-0 font-bold">{{ reserva.notebook }}</dd></template>
        <template v-if="reserva?.id"><dt class="text-muted">Código</dt><dd class="m-0 font-bold">#{{ reserva.id }}</dd></template>
      </dl>
    </div>

    <div v-else class="flex flex-col gap-4.5">
      <div>
        <h2 :class="INTRO_TITULO">Reservá un recurso</h2>
        <p :class="INTRO_TEXTO">Elegí el horario inicial en la grilla</p>
      </div>

      <SelectorFecha :deshabilitado="cargando" :es-hoy="esHoy" :fecha="fecha" @hoy="irAHoy" @mover="moverDias" @update:fecha="irAFecha" />

      <FiltroSalas v-if="abierta && salas.length" :salas="salas" :seleccionada="salaSeleccionada" @seleccionar="seleccionarSala" />

      <EstadoDisponibilidad :abierta="abierta" :cargando="cargando" :error-message="errorMessage" :sin-bloques="!bloques.length" @reintentar="cargar">
        <GrillaDisponibilidad :bloques="bloques" :bloques-seleccionados="duracion / BLOQUE_MINUTOS" compacto :estado-de="estadoDe" :recursos="recursosVisibles" seleccionable :seleccion="seleccion" @seleccionar="elegir" />
      </EstadoDisponibilidad>

      <div v-if="listo" class="flex flex-wrap items-center justify-between gap-4 border-l-[3px] border-forest bg-mint/40 p-3.5">
        <h3 class="m-0 text-m font-bold text-forest">Selecciona la duración</h3>
        <p class="m-0 text-tiny"><strong>{{ salaElegida?.nombre }}</strong> · {{ seleccion?.inicio }} a {{ fin }}</p>
        <label class="flex flex-row items-center gap-2.5 text-mini font-bold text-field-label">
          Duración
          <select :class="SELECT" :value="duracion" @change="duracion = Number(($event.target as HTMLSelectElement).value)">
            <option v-for="opcion in duraciones" :key="opcion" :value="opcion">{{ etiquetaDuracion(opcion) }}</option>
          </select>
        </label>
      </div>

      <label v-if="listo && notebooksLibres" :class="[TICK, 'border border-line bg-white p-3']">
        <input :checked="modelValue.wantsComputer" class="mt-px size-4 accent-forest" type="checkbox" @change="actualizarBooleano('wantsComputer', ($event.target as HTMLInputElement).checked)">
        <span class="flex flex-col gap-1">
          <strong>¿Querés sumar una notebook?</strong>
          <small class="text-mini leading-normal font-normal text-muted">Solo se usan dentro de la biblioteca, durante tu reserva.</small>
        </span>
      </label>

      <div v-if="modelValue.wantsComputer" class="border-l-[3px] border-coral bg-conditions p-3.5 text-xs text-ink">
        <strong>Condiciones de uso de la notebook</strong>
        <p class="mt-1.5 mb-2.5 text-mini leading-normal text-muted">El uso está limitado al horario reservado y a la normativa de la biblioteca.</p>
        <label :class="[TICK, 'items-center text-xs']">
          <input :checked="modelValue.computerConditionsAccepted" class="size-4 accent-forest" type="checkbox" @change="actualizarBooleano('computerConditionsAccepted', ($event.target as HTMLInputElement).checked)">
          <span>Acepto las condiciones</span>
        </label>
      </div>

      <p v-if="error" :class="ERROR">{{ error }}</p>

      <div :class="ACCIONES">
        <button :class="BOTON_SUAVE" type="button" @click="emit('back')">← Volver</button>
        <button :class="BOTON_PRIMARIO" :disabled="loading || !listo || (modelValue.wantsComputer && !modelValue.computerConditionsAccepted)" type="button" @click="emit('submit')">{{ loading ? 'Confirmando…' : 'Confirmar reserva' }} <span :class="FLECHA_BOTON">→</span></button>
      </div>
    </div>
  </div>
</template>
