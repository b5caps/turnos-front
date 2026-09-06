<script setup lang="ts">
import { computed } from 'vue'
import type { ResourceBooking } from '~/types'

const props = defineProps<{ modelValue: ResourceBooking; completed?: boolean; error?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: ResourceBooking]; submit: []; back: [] }>()
function update(field: keyof ResourceBooking, value: string) { emit('update:modelValue', { ...props.modelValue, [field]: value }) }
function updateBoolean(field: 'wantsComputer' | 'computerConditionsAccepted', value: boolean) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
    ...(field === 'wantsComputer' && !value ? { computerConditionsAccepted: false } : {}),
  })
}

const resources = ['Sala A', 'Sala B', 'Sala C']
const timeOptions = computed(() => {
  const options: string[] = []
  for (let minutes = 10 * 60; minutes <= 22 * 60; minutes += 15) {
    const hours = Math.floor(minutes / 60).toString().padStart(2, '0')
    const remainder = (minutes % 60).toString().padStart(2, '0')
    options.push(`${hours}:${remainder}`)
  }
  return options
})
</script>

<template>
  <div class="resource-booking-step-wrapper">
    <div v-if="completed" class="success-message"><span aria-hidden="true">✓</span><div><strong>Reserva solicitada</strong><p>Tu solicitud fue registrada correctamente.</p></div></div>
    <div v-else><div class="step-intro"><p class="section-kicker">Paso final</p><h2>Reservá un recurso</h2><p>Seleccioná cuándo y dónde querés estudiar.</p></div>
      <form class="form-fields" @submit.prevent="emit('submit')">
        <label>Recurso<select :value="modelValue.resource" required @change="update('resource', ($event.target as HTMLSelectElement).value)"><option disabled value="">Seleccioná una sala</option><option v-for="resource in resources" :key="resource" :value="resource">{{ resource }}</option></select></label>
        <label>Fecha<input :value="modelValue.date" required type="date" @input="update('date', ($event.target as HTMLInputElement).value)"></label>
        <div class="form-fields form-fields--two-columns"><label>Hora de entrada<select :value="modelValue.startTime" required @change="update('startTime', ($event.target as HTMLSelectElement).value)"><option disabled value="">Elegí una hora</option><option v-for="time in timeOptions" :key="`start-${time}`" :value="time">{{ time }}</option></select></label><label>Hora de salida<select :value="modelValue.endTime" required @change="update('endTime', ($event.target as HTMLSelectElement).value)"><option disabled value="">Elegí una hora</option><option v-for="time in timeOptions" :key="`end-${time}`" :value="time">{{ time }}</option></select></label></div>
        <label class="checkbox-field"><input :checked="modelValue.wantsComputer" type="checkbox" @change="updateBoolean('wantsComputer', ($event.target as HTMLInputElement).checked)"><span><strong>¿Desea reservar una PC?</strong><small>Las PCs solo pueden utilizarse en la biblioteca con turno previo.</small></span></label>
        <div v-if="modelValue.wantsComputer" class="conditions-box"><strong>Condiciones de uso de la PC</strong><p>Las PCs deben utilizarse únicamente con fines académicos. El uso está sujeto al horario reservado y a la normativa de la biblioteca.</p><button class="button button--quiet" type="button" @click="updateBoolean('computerConditionsAccepted', true)">{{ modelValue.computerConditionsAccepted ? 'Condiciones aceptadas' : 'Aceptar condiciones' }}</button></div>
        <p v-if="props.error" class="form-error">{{ props.error }}</p><div class="form-actions"><button class="button button--quiet" type="button" @click="emit('back')">← Volver</button><button class="button button--primary" :disabled="modelValue.wantsComputer && !modelValue.computerConditionsAccepted" type="submit">Confirmar reserva <span>→</span></button></div>
      </form>
    </div>
  </div>
</template>
