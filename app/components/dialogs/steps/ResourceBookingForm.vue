<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import EstadoDisponibilidad from '~/components/disponibilidad/EstadoDisponibilidad.vue'
import FiltroSalas from '~/components/disponibilidad/FiltroSalas.vue'
import GrillaDisponibilidad from '~/components/disponibilidad/GrillaDisponibilidad.vue'
import SelectorFecha from '~/components/disponibilidad/SelectorFecha.vue'
import { BLOQUE_MINUTOS, etiquetaDuracion, horaAMinutos, minutosAHora } from '~/constants/horarios'
import type { ResourceBooking } from '~/types'

const props = defineProps<{ modelValue: ResourceBooking; completed?: boolean; error?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: ResourceBooking]; submit: []; back: [] }>()

const { bloques, fecha, cargando, errorMessage, abierta, esHoy, salas, salaSeleccionada, recursosVisibles, cargar, irAFecha, moverDias, irAHoy, seleccionarSala, estadoDe, duracionesPosibles, notebooksEnVentana } = useDisponibilidad()

const seleccion = ref<{ recursoId: number; inicio: string } | null>(null)
const duracion = ref(0)

const duraciones = computed(() => (seleccion.value ? duracionesPosibles(seleccion.value.recursoId, seleccion.value.inicio) : []))
const salaElegida = computed(() => salas.value.find(sala => sala.id === seleccion.value?.recursoId) ?? null)
const fin = computed(() => (seleccion.value && duracion.value ? minutosAHora(horaAMinutos(seleccion.value.inicio) + duracion.value) : ''))
const notebooksLibres = computed(() => (seleccion.value ? notebooksEnVentana(seleccion.value.inicio, duracion.value) : 0))
const listo = computed(() => Boolean(salaElegida.value && duracion.value))

function elegir(recursoId: number, inicio: string) {
  seleccion.value = { recursoId, inicio }
  duracion.value = duraciones.value[0] ?? 0
}

function sincronizar() {
  emit('update:modelValue', {
    ...props.modelValue,
    resource: salaElegida.value?.nombre ?? '',
    date: fecha.value,
    startTime: seleccion.value?.inicio ?? '',
    endTime: fin.value,
  })
}

function actualizarBooleano(campo: 'wantsComputer' | 'computerConditionsAccepted', valor: boolean) {
  emit('update:modelValue', {
    ...props.modelValue,
    [campo]: valor,
    ...(campo === 'wantsComputer' && !valor ? { computerConditionsAccepted: false } : {}),
  })
}

watch(fecha, () => {
  seleccion.value = null
  duracion.value = 0
})

watch([seleccion, duracion], sincronizar)

watch(notebooksLibres, disponibles => {
  if (!disponibles && props.modelValue.wantsComputer) actualizarBooleano('wantsComputer', false)
})

onMounted(cargar)
</script>

<template>
  <div class="resource-booking-step-wrapper">
    <div v-if="completed" class="success-message"><span aria-hidden="true">✓</span><div><strong>Reserva solicitada</strong><p>Tu solicitud fue registrada correctamente.</p></div></div>
    <div v-else>
      <div class="step-intro"><p class="section-kicker">Paso final</p><h2>Reservá un recurso</h2><p>Elegí un horario libre en la grilla.</p></div>

      <div class="reserva">
        <SelectorFecha :deshabilitado="cargando" :es-hoy="esHoy" :fecha="fecha" @hoy="irAHoy" @mover="moverDias" @update:fecha="irAFecha" />

        <FiltroSalas v-if="abierta && salas.length" :salas="salas" :seleccionada="salaSeleccionada" @seleccionar="seleccionarSala" />

        <EstadoDisponibilidad :abierta="abierta" :cargando="cargando" :error-message="errorMessage" @reintentar="cargar">
          <p class="reserva__ayuda">{{ seleccion ? 'Tocá otro bloque si querés cambiar el horario inicial.' : 'Seleccioná el horario inicial: tocá un bloque con lugar.' }}</p>
          <GrillaDisponibilidad
            :bloques="bloques"
            :bloques-seleccionados="duracion / BLOQUE_MINUTOS"
            compacto
            :estado-de="estadoDe"
            :recursos="recursosVisibles"
            seleccionable
            :seleccion="seleccion"
            @seleccionar="elegir"
          />
        </EstadoDisponibilidad>

        <div v-if="listo" class="reserva__detalle">
          <p class="reserva__resumen"><strong>{{ salaElegida?.nombre }}</strong> · {{ seleccion?.inicio }} a {{ fin }}</p>
          <label class="reserva__duracion">Duración
            <select :value="duracion" @change="duracion = Number(($event.target as HTMLSelectElement).value)">
              <option v-for="opcion in duraciones" :key="opcion" :value="opcion">{{ etiquetaDuracion(opcion) }}</option>
            </select>
          </label>
        </div>

        <label v-if="listo && notebooksLibres" class="checkbox-field">
          <input :checked="modelValue.wantsComputer" type="checkbox" @change="actualizarBooleano('wantsComputer', ($event.target as HTMLInputElement).checked)">
          <span><strong>¿Querés sumar una notebook?</strong><small>Quedan {{ notebooksLibres }} para ese horario. Solo se usan dentro de la biblioteca, durante tu reserva.</small></span>
        </label>

        <div v-if="modelValue.wantsComputer" class="conditions-box">
          <strong>Condiciones de uso de la notebook</strong>
          <p>El uso está limitado al horario reservado y a la normativa de la biblioteca.</p>
          <button class="button button--quiet" type="button" @click="actualizarBooleano('computerConditionsAccepted', true)">{{ modelValue.computerConditionsAccepted ? 'Condiciones aceptadas' : 'Aceptar condiciones' }}</button>
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <div class="form-actions">
          <button class="button button--quiet" type="button" @click="emit('back')">← Volver</button>
          <button class="button button--primary" :disabled="!listo || (modelValue.wantsComputer && !modelValue.computerConditionsAccepted)" type="button" @click="emit('submit')">Confirmar reserva <span>→</span></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reserva { display: flex; flex-direction: column; gap: 18px; }
.reserva__ayuda { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--muted); font-size: 11px; }
.reserva__ayuda::before { content: 'i'; border: 1px solid #abbcb3; border-radius: 50%; width: 15px; height: 15px; display: inline-grid; place-items: center; flex: 0 0 15px; }
.reserva__detalle { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 14px; border-left: 3px solid var(--forest); background: #eef6f2; }
.reserva__resumen { margin: 0; font-size: 13px; }
.reserva__duracion { flex-direction: row; align-items: center; gap: 10px; }
.reserva__duracion select { width: auto; }
</style>
