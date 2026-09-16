<script setup lang="ts">
import { BOTON_SUAVE } from '~/constants/estilos'

defineProps<{ cargando: boolean; errorMessage: string; abierta: boolean; sinBloques?: boolean }>()
const emit = defineEmits<{ reintentar: [] }>()

const AVISO = 'm-0 border border-line bg-paper px-5 py-9 text-center text-tiny text-muted'
</script>

<template>
  <p v-if="cargando" :class="AVISO">Cargando disponibilidad…</p>
  <div v-else-if="errorMessage" :class="[AVISO, 'flex flex-col items-center gap-2.5 text-danger']">
    <p class="m-0">{{ errorMessage }}</p>
    <button :class="BOTON_SUAVE" type="button" @click="emit('reintentar')">Reintentar</button>
  </div>
  <p v-else-if="!abierta" :class="AVISO">La biblioteca no abre este día. Atiende de lunes a viernes, de 10 a 22.</p>
  <p v-else-if="sinBloques" :class="AVISO">Por hoy la biblioteca ya cerró. Mirá los próximos días.</p>
  <slot v-else />
</template>
