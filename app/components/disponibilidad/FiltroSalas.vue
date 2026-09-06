<script setup lang="ts">
import type { RecursoDisponibilidad } from '~/types/disponibilidad'

defineProps<{ salas: RecursoDisponibilidad[]; seleccionada: number | null }>()
const emit = defineEmits<{ seleccionar: [id: number | null] }>()
</script>

<template>
  <div class="filtro-salas" role="group" aria-label="Filtrar por sala">
    <button class="filtro-salas__chip" :class="{ 'filtro-salas__chip--activo': seleccionada === null }" type="button" @click="emit('seleccionar', null)">Todas</button>
    <button v-for="sala in salas" :key="sala.id" class="filtro-salas__chip" :class="{ 'filtro-salas__chip--activo': seleccionada === sala.id }" type="button" @click="emit('seleccionar', sala.id)">
      {{ sala.nombre }} <span>{{ sala.capacidad }}</span>
    </button>
  </div>
</template>

<style scoped>
.filtro-salas { display: flex; flex-wrap: wrap; gap: 8px; }
.filtro-salas__chip { display: inline-flex; align-items: center; gap: 7px; border: 1px solid var(--line); background: white; color: var(--ink); font-size: 12px; font-weight: 700; padding: 9px 14px; transition: border-color .2s, background .2s; }
.filtro-salas__chip span { color: var(--muted); font-weight: 400; font-size: 11px; }
.filtro-salas__chip:hover { border-color: var(--forest); }
.filtro-salas__chip--activo { background: var(--forest); border-color: var(--forest); color: white; }
.filtro-salas__chip--activo span { color: var(--mint); }
</style>
