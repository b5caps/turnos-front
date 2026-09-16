<script setup lang="ts">
const estados = [
  { clave: 'disponible', etiqueta: 'Con lugar', color: 'bg-mint' },
  { clave: 'sin_cupos', etiqueta: 'Completa', color: 'bg-full' },
  { clave: 'bloqueado', etiqueta: 'Bloqueada por biblioteca', color: 'bg-blocked' },
  { clave: 'fuera_de_horario', etiqueta: 'Fuera de horario', color: 'bg-closed' },
  { clave: 'notebook', etiqueta: 'Notebooks disponibles', color: 'bg-notebook' },
]
</script>

<template>
  <ul class="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
    <li v-for="estado in estados" :key="estado.clave" class="flex items-center gap-2 text-mini text-muted">
      <span class="size-3.5 border border-black/5" :class="estado.color"></span>{{ estado.etiqueta }}
    </li>
  </ul>
</template>
