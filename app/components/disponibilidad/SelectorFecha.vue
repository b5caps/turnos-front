<script setup lang="ts">
import { computed } from "vue";
import { formatearFechaLarga, hoyIso } from "~/constants/horarios";
import type { Feriado } from "~/services/feriados";

const props = defineProps<{
  fecha: string;
  esHoy: boolean;
  deshabilitado?: boolean;
  feriado?: Feriado | null;
  bloquearPasadas?: boolean;
  minFecha?: string;
}>();
const emit = defineEmits<{
  mover: [dias: number];
  hoy: [];
  "update:fecha": [value: string];
}>();

const etiqueta = computed(() => formatearFechaLarga(props.fecha));
const fechaMinima = computed(() =>
  props.bloquearPasadas ? props.minFecha || hoyIso() : props.minFecha,
);
const noPuedeRetroceder = computed(() =>
  Boolean(fechaMinima.value && props.fecha <= fechaMinima.value),
);

function alCambiarFecha(event: Event) {
  const valor = (event.target as HTMLInputElement).value;
  if (!valor) return;
  if (fechaMinima.value && valor < fechaMinima.value) {
    emit("update:fecha", fechaMinima.value);
    return;
  }
  emit("update:fecha", valor);
}

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
        :disabled="deshabilitado || noPuedeRetroceder"
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
        <div class="flex items-center gap-1.5 flex-wrap">
          <small
            v-if="esHoy"
            class="text-micro font-bold tracking-widest text-coral uppercase"
            >HOY</small
          >
          <span
            v-if="feriado"
            class="inline-flex items-center gap-1 rounded bg-conditions px-2 py-0.5 text-mini font-semibold text-coral-dark border border-coral/30"
          >
            Feriado: {{ feriado.nombre }}
          </span>
        </div>
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
        :min="fechaMinima"
        type="date"
        :value="fecha"
        @input="alCambiarFecha"
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
