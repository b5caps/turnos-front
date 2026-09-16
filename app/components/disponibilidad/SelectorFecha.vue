<script setup lang="ts">
import { computed } from 'vue'
import { formatearFechaLarga } from '~/constants/horarios'

const props = defineProps<{ fecha: string; esHoy: boolean; deshabilitado?: boolean }>()
const emit = defineEmits<{ mover: [dias: number]; hoy: []; 'update:fecha': [value: string] }>()

const etiqueta = computed(() => formatearFechaLarga(props.fecha))

const FLECHA = 'size-9 cursor-pointer border border-line bg-white text-base text-forest not-disabled:hover:border-forest disabled:cursor-not-allowed disabled:opacity-45'
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4 max-tablet:gap-3">
    <div class="flex items-center gap-3">
      <button aria-label="Día anterior" :class="FLECHA" :disabled="deshabilitado" type="button" @click="emit('mover', -1)">←</button>
      <div class="flex min-w-48 flex-col max-tablet:min-w-38">
        <strong class="font-serif text-xl font-normal tracking-tight max-tablet:text-lg">{{ etiqueta }}</strong>
        <small v-if="esHoy" class="text-micro font-bold tracking-widest text-coral uppercase">Hoy</small>
      </div>
      <button aria-label="Día siguiente" :class="FLECHA" :disabled="deshabilitado" type="button" @click="emit('mover', 1)">→</button>
    </div>
    <div class="flex items-center gap-2.5">
      <input
        aria-label="Elegir fecha"
        class="w-auto border border-line bg-white px-3 py-3 text-xs text-ink outline-none transition focus:border-forest focus:shadow-focus"
        :disabled="deshabilitado"
        type="date"
        :value="fecha"
        @input="emit('update:fecha', ($event.target as HTMLInputElement).value)"
      >
      <button v-if="!esHoy" class="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-muted not-disabled:hover:text-forest" :disabled="deshabilitado" type="button" @click="emit('hoy')">Volver a hoy</button>
    </div>
  </div>
</template>
