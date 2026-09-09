<script setup lang="ts">
defineProps<{ cargando: boolean; errorMessage: string; abierta: boolean; sinBloques?: boolean }>()
const emit = defineEmits<{ reintentar: [] }>()
</script>

<template>
  <p v-if="cargando" class="estado">Cargando disponibilidad…</p>
  <div v-else-if="errorMessage" class="estado estado--error">
    <p>{{ errorMessage }}</p>
    <button class="button button--quiet" type="button" @click="emit('reintentar')">Reintentar</button>
  </div>
  <p v-else-if="!abierta" class="estado">La biblioteca no abre este día. Atiende de lunes a viernes, de 10 a 22.</p>
  <p v-else-if="sinBloques" class="estado">Por hoy la biblioteca ya cerró. Mirá los próximos días.</p>
  <slot v-else />
</template>

<style scoped>
.estado { margin: 0; padding: 38px 20px; text-align: center; color: var(--muted); font-size: 13px; border: 1px solid var(--line); background: var(--paper); }
.estado--error { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #bd543f; }
.estado--error p { margin: 0; }
</style>
