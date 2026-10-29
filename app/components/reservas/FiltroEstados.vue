<script setup lang="ts">
import type { EstadoFiltro } from "~/types/reservas";

defineProps<{ seleccionado: EstadoFiltro; deshabilitado?: boolean }>();
const emit = defineEmits<{ seleccionar: [filtro: EstadoFiltro] }>();

const OPCIONES: { valor: EstadoFiltro; etiqueta: string }[] = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "activas", etiqueta: "Activas" },
  { valor: "canceladas", etiqueta: "Canceladas" },
  { valor: "finalizadas", etiqueta: "Finalizadas" },
];

const CHIP =
  "cursor-pointer rounded border px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45";
const CHIP_ACTIVO = "border-notebook-ink bg-notebook-ink text-white";
const CHIP_INACTIVO =
  "border-line bg-white text-ink not-disabled:hover:border-muted";
</script>

<template>
  <div
    aria-label="Filtrar por estado"
    class="flex flex-wrap gap-2"
    role="group"
  >
    <button
      v-for="opcion in OPCIONES"
      :key="opcion.valor"
      :class="[
        CHIP,
        seleccionado === opcion.valor ? CHIP_ACTIVO : CHIP_INACTIVO,
      ]"
      :disabled="deshabilitado"
      type="button"
      @click="emit('seleccionar', opcion.valor)"
    >
      {{ opcion.etiqueta }}
    </button>
  </div>
</template>
