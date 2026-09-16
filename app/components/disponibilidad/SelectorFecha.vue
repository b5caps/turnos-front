<script setup lang="ts">
import { computed } from 'vue'
import { formatearFechaLarga } from '~/constants/horarios'

const props = defineProps<{ fecha: string; esHoy: boolean; deshabilitado?: boolean }>()
const emit = defineEmits<{ mover: [dias: number]; hoy: []; 'update:fecha': [value: string] }>()

const etiqueta = computed(() => formatearFechaLarga(props.fecha))
</script>

<template>
  <div class="selector-fecha">
    <div class="selector-fecha__navegacion">
      <button aria-label="Día anterior" class="selector-fecha__flecha" :disabled="deshabilitado" type="button" @click="emit('mover', -1)">←</button>
      <div class="selector-fecha__actual">
        <strong>{{ etiqueta }}</strong>
        <small v-if="esHoy">Hoy</small>
      </div>
      <button aria-label="Día siguiente" class="selector-fecha__flecha" :disabled="deshabilitado" type="button" @click="emit('mover', 1)">→</button>
    </div>
    <div class="selector-fecha__acciones">
      <input aria-label="Elegir fecha" :disabled="deshabilitado" type="date" :value="fecha" @input="emit('update:fecha', ($event.target as HTMLInputElement).value)">
      <button v-if="!esHoy" class="selector-fecha__hoy" :disabled="deshabilitado" type="button" @click="emit('hoy')">Volver a hoy</button>
    </div>
  </div>
</template>

<style scoped>
.selector-fecha { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.selector-fecha__navegacion { display: flex; align-items: center; gap: 12px; }
.selector-fecha__flecha { width: 34px; height: 34px; border: 1px solid var(--line); background: white; color: var(--forest); font-size: 15px; }
.selector-fecha__flecha:hover:not(:disabled) { border-color: var(--forest); }
.selector-fecha__flecha:disabled { opacity: .45; cursor: not-allowed; }
.selector-fecha__actual { display: flex; flex-direction: column; min-width: 190px; }
.selector-fecha__actual strong { font: 400 21px Georgia, serif; letter-spacing: -.01em; }
.selector-fecha__actual small { color: var(--coral); font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.selector-fecha__acciones { display: flex; align-items: center; gap: 10px; }
.selector-fecha__acciones input { width: auto; }
.selector-fecha__hoy { border: 0; background: transparent; color: var(--muted); font-size: 12px; font-weight: 700; padding: 0; }
.selector-fecha__hoy:hover:not(:disabled) { color: var(--forest); }
@media (max-width: 720px) {
  .selector-fecha { gap: 12px; }
  .selector-fecha__actual { min-width: 150px; }
  .selector-fecha__actual strong { font-size: 18px; }
}
</style>
