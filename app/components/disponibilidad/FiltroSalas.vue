<script setup lang="ts">
import type { RecursoDisponibilidad } from "~/types/disponibilidad";

defineProps<{ salas: RecursoDisponibilidad[]; seleccionada: number | null }>();
const emit = defineEmits<{ seleccionar: [id: number | null] }>();

const CHIP =
  "cursor-pointer items-center gap-1.5 rounded border px-3 py-1 text-xs transition-colors";
const CHIP_INACTIVO = "border-line bg-white text-ink hover:border-muted";
const CHIP_ACTIVO = "border-notebook-ink bg-notebook-ink text-white";
</script>

<template>
  <div aria-label="Filtrar por sala" class="flex flex-wrap gap-2" role="group">
    <button
      :class="[
        CHIP,
        'hidden md:inline-flex',
        seleccionada === null ? CHIP_ACTIVO : CHIP_INACTIVO,
      ]"
      type="button"
      @click="emit('seleccionar', null)"
    >
      <strong class="font-bold">Todas</strong>
    </button>
    <button
      v-for="(sala, index) in salas"
      :key="sala.id"
      :class="[
        CHIP,
        'inline-flex',
        seleccionada === sala.id || (seleccionada === null && index === 0)
          ? seleccionada === null && index === 0
            ? 'border-notebook-ink bg-notebook-ink text-white md:border-line md:bg-white md:text-ink md:hover:border-muted'
            : CHIP_ACTIVO
          : CHIP_INACTIVO,
      ]"
      type="button"
      @click="emit('seleccionar', sala.id)"
    >
      <strong class="font-bold">{{ sala.nombre }}</strong>
      <span
        :class="
          seleccionada === sala.id || (seleccionada === null && index === 0)
            ? seleccionada === null && index === 0
              ? 'text-mini font-normal text-white/80 md:text-muted'
              : 'text-mini font-normal text-white/80'
            : 'text-mini font-normal text-muted'
        "
        >{{ sala.capacidad }}</span
      >
    </button>
  </div>
</template>
