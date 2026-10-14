<script setup lang="ts">
import {
  INTRO,
  INTRO_TEXTO,
  INTRO_TITULO,
  KICKER,
  TARJETA,
  TARJETA_FLECHA,
  TARJETA_TEXTO,
} from "~/constants/estilos";

const emit = defineEmits<{ reservar: [] }>();
</script>

<template>
  <div>
    <div :class="INTRO">
      <p :class="KICKER">Ya estás dentro</p>
      <h2 :class="INTRO_TITULO">¿Qué querés hacer?</h2>
      <p :class="INTRO_TEXTO">Elegí cómo seguir.</p>
    </div>

    <div class="grid gap-3">
      <button :class="TARJETA" type="button" @click="emit('reservar')">
        <span
          aria-hidden="true"
          class="grid size-9 place-items-center rounded-full bg-mint text-xl text-forest"
          >+</span
        >
        <span :class="TARJETA_TEXTO"
          ><strong class="text-sm">Reservar un espacio</strong
          ><small class="text-mini text-muted"
            >Elegí sala, día y horario. Podés sumar una notebook.</small
          ></span
        >
        <span aria-hidden="true" :class="TARJETA_FLECHA">→</span>
      </button>
      <NuxtLink :class="[TARJETA, 'no-underline']" to="/mis-reservas">
        <span
          aria-hidden="true"
          class="grid size-9 place-items-center rounded-full bg-external text-xl text-coral"
          >≡</span
        >
        <span :class="TARJETA_TEXTO"
          ><strong class="text-sm">Mis reservas</strong
          ><small class="text-mini text-muted"
            >Mirá lo que ya reservaste y cancelá lo que no vayas a usar.</small
          ></span
        >
        <span aria-hidden="true" :class="TARJETA_FLECHA">→</span>
      </NuxtLink>
    </div>
  </div>
</template>
