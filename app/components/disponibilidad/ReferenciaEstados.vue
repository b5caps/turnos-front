<script setup lang="ts">
const estados = [
  { clave: 'disponible', etiqueta: 'Con lugar' },
  { clave: 'sin_cupos', etiqueta: 'Completa' },
  { clave: 'bloqueado', etiqueta: 'Bloqueada por biblioteca' },
  { clave: 'fuera_de_horario', etiqueta: 'Fuera de horario' },
  { clave: 'notebook', etiqueta: 'Notebooks disponibles' },
]
</script>

<template>
  <ul class="referencia">
    <li v-for="estado in estados" :key="estado.clave" class="referencia__item">
      <span class="referencia__muestra" :class="`referencia__muestra--${estado.clave}`"></span>{{ estado.etiqueta }}
    </li>
  </ul>
</template>

<style scoped>
.referencia { display: flex; flex-wrap: wrap; gap: 8px 20px; list-style: none; margin: 0; padding: 0; }
.referencia__item { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 11px; }
.referencia__muestra { width: 14px; height: 14px; border: 1px solid rgba(0, 0, 0, .05); }
.referencia__muestra--disponible { background: var(--mint); }
.referencia__muestra--sin_cupos { background: #fbe3da; }
.referencia__muestra--bloqueado { background: #eceee7; }
.referencia__muestra--fuera_de_horario { background: #f7f7f3; }
.referencia__muestra--notebook { background: #bcd8ee; }
</style>
