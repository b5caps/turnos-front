<script setup lang="ts">
import { ESTADO_FUERTE } from "~/constants/estilos";
import type { ClaveEstado } from "~/constants/estilos";

defineProps<{ valor: number; etiqueta: string; tono: ClaveEstado }>();

const TRAZO: Record<ClaveEstado, string> = {
  pendiente: "M12 6v6l4 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z",
  activo: "m9 12 2 2 4-4M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z",
  finalizado: "m9 12 2 2 4-4M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z",
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
    <div class="flex flex-col">
      <strong class="text-3xl leading-none font-bold">{{ valor }}</strong>
      <span
        class="mt-1.5 text-tiny font-bold tracking-wider uppercase opacity-85"
        >{{ etiqueta }}</span
      >
    </div>
  </article>
</template>
