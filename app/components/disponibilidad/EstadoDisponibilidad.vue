<script setup lang="ts">
import { AVISO, BOTON_SUAVE } from "~/constants/estilos";
import { ETIQUETA_HORARIO } from "~/constants/horarios";
import type { Feriado } from "~/types/feriados";

defineProps<{
  cargando: boolean;
  errorMessage: string;
  abierta: boolean;
  sinBloques?: boolean;
  feriado?: Feriado | null;
  motivoCierre?: string | null;
}>();
const emit = defineEmits<{ reintentar: [] }>();
</script>

<template>
  <p v-if="cargando" :class="AVISO">Cargando disponibilidad…</p>
  <div
    v-else-if="errorMessage"
    :class="[AVISO, 'flex flex-col items-center gap-2.5 text-danger']"
  >
    <p class="m-0">{{ errorMessage }}</p>
    <button :class="BOTON_SUAVE" type="button" @click="emit('reintentar')">
      Reintentar
    </button>
  </div>
  <p v-else-if="feriado" :class="AVISO">
    Cerrado por feriado:
    <strong class="text-ink">{{ feriado.nombre }}</strong
    >.
  </p>
  <p v-else-if="motivoCierre" :class="AVISO">
    Cerrado: <strong class="text-ink">{{ motivoCierre }}</strong
    >.
  </p>
  <p v-else-if="!abierta" :class="AVISO">
    Cerrado. La biblioteca no abre este día. {{ ETIQUETA_HORARIO }}.
  </p>
  <p v-else-if="sinBloques" :class="AVISO">
    Por hoy la biblioteca ya cerró. Mirá los próximos días.
  </p>
  <slot v-else />
</template>
