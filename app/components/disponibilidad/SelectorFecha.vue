<script setup lang="ts">
import { computed } from "vue";
import { formatearFechaLarga } from "~/constants/horarios";

const props = defineProps<{
  fecha: string;
  esHoy: boolean;
  deshabilitado?: boolean;
}>();
const emit = defineEmits<{
  mover: [dias: number];
  hoy: [];
  "update:fecha": [value: string];
}>();

const etiqueta = computed(() => formatearFechaLarga(props.fecha));

const FLECHA =
  "size-8 cursor-pointer rounded border border-line bg-white flex items-center justify-center text-xs font-bold text-muted transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40";
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-4 max-tablet:gap-3"
  >
    <div class="flex items-center gap-2.5">
      <button
        aria-label="Día anterior"
        :class="FLECHA"
        :disabled="deshabilitado"
        type="button"
        @click="emit('mover', -1)"
      >
        ←
      </button>
      <div class="flex min-w-44 flex-col max-tablet:min-w-36">
        <strong
          class="font-sans text-base font-bold tracking-tight text-ink max-tablet:text-sm"
          >{{ etiqueta }}</strong
        >
        <small
          v-if="esHoy"
          class="text-micro font-bold tracking-widest text-coral uppercase"
          >HOY</small
        >
      </div>
      <button
        aria-label="Día siguiente"
        :class="FLECHA"
        :disabled="deshabilitado"
        type="button"
        @click="emit('mover', 1)"
      >
        →
      </button>
    </div>
    <div class="flex items-center gap-2.5">
      <input
        aria-label="Elegir fecha"
        class="cursor-pointer rounded border border-line bg-white px-3 py-1.5 text-xs text-ink outline-none transition focus:border-forest"
        :disabled="deshabilitado"
        type="date"
        :value="fecha"
        @input="emit('update:fecha', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="!esHoy"
        class="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-muted hover:text-ink"
        :disabled="deshabilitado"
        type="button"
        @click="emit('hoy')"
      >
        Volver a hoy
      </button>
    </div>
  </div>
</template>
