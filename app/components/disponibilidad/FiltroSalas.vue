<script setup lang="ts">
import type { RecursoDisponibilidad } from "~/types/disponibilidad";

defineProps<{ salas: RecursoDisponibilidad[]; seleccionada: number | null }>();
const emit = defineEmits<{ seleccionar: [id: number | null] }>();

const CHIP =
  "inline-flex cursor-pointer items-center gap-2 border px-3.5 py-2 text-xs font-bold transition-colors";
const CHIP_ACTIVO = "border-forest bg-forest text-white";
const CHIP_INACTIVO = "border-line bg-white text-ink hover:border-forest";
</script>

<template>
  <div aria-label="Filtrar por sala" class="flex flex-wrap gap-2" role="group">
    <button
      :class="[CHIP, seleccionada === null ? CHIP_ACTIVO : CHIP_INACTIVO]"
      type="button"
      @click="emit('seleccionar', null)"
    >
      Todas
    </button>
    <button
      v-for="sala in salas"
      :key="sala.id"
      :class="[CHIP, seleccionada === sala.id ? CHIP_ACTIVO : CHIP_INACTIVO]"
      type="button"
      @click="emit('seleccionar', sala.id)"
    >
      {{ sala.nombre }}
      <span
        :class="
          seleccionada === sala.id
            ? 'text-mini font-normal text-mint'
            : 'text-mini font-normal text-muted'
        "
        >{{ sala.capacidad }}</span
      >
    </button>
  </div>
</template>
