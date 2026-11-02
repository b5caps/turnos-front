<script setup lang="ts">
import { ESTADO_FUERTE } from "~/constants/estilos";
import type { ClaveEstado } from "~/constants/estilos";

defineProps<{
  valor: string | number;
  etiqueta: string;
  detalle?: string;
  tono: ClaveEstado;
}>();

const TRAZO: Record<ClaveEstado, string> = {
  pendiente: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4",
  activo: "m9 12 2 2 4-4M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z",
  finalizado: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4",
  cancelado: "m15 9-6 6m0-6 6 6M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z",
  notebook: "M3 5h18v11H3zM2 20h20",
};
</script>

<template>
  <article
    :class="[
      ESTADO_FUERTE[tono],
      'flex items-center gap-4 rounded-xl p-5 text-white shadow-card',
    ]"
  >
    <span aria-hidden="true" class="grid shrink-0 place-items-center">
      <svg
        class="size-9"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path :d="TRAZO[tono]" />
      </svg>
    </span>
    <div class="flex min-w-0 flex-col">
      <strong class="text-4xl leading-none font-bold">{{ valor }}</strong>
      <span
        class="mt-2 text-tiny font-bold tracking-wider uppercase opacity-85"
        >{{ etiqueta }}</span
      >
      <span v-if="detalle" class="mt-1 text-mini opacity-70">{{
        detalle
      }}</span>
    </div>
  </article>
</template>
