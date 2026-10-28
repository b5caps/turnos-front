<script setup lang="ts">
import {
  INTRO,
  INTRO_TEXTO,
  INTRO_TITULO,
  KICKER,
  TARJETA,
  TARJETA_ACTIVA,
  TARJETA_FLECHA,
  TARJETA_TEXTO,
} from "~/constants/estilos";
import type { UserType } from "~/types";

defineProps<{ selected: UserType | null }>();
const emit = defineEmits<{ choose: [type: UserType] }>();
</script>

<template>
  <div>
    <div :class="INTRO">
      <p :class="KICKER">Primer paso</p>
      <h2 :class="INTRO_TITULO">¿Cómo vas a ingresar?</h2>
    </div>

    <div class="grid gap-3">
      <button
        :class="[TARJETA, selected === 'student' && TARJETA_ACTIVA]"
        type="button"
        @click="emit('choose', 'student')"
      >
        <span
          aria-hidden="true"
          class="grid size-11 shrink-0 place-items-center rounded-xl bg-notebook-ink"
          ><img src="/logo utn blanco.png" alt="" class="size-6 object-contain"
        /></span>
        <span :class="TARJETA_TEXTO"
          ><strong class="text-sm">Usuario UTN</strong
          ><small class="text-mini text-muted"
            >Ingresá con tu legajo y contraseña de Sysacad.</small
          ></span
        >
        <span aria-hidden="true" :class="TARJETA_FLECHA">→</span>
      </button>
      <button
        :class="[TARJETA, selected === 'external' && TARJETA_ACTIVA]"
        type="button"
        @click="emit('choose', 'external')"
      >
        <span
          aria-hidden="true"
          class="grid size-11 shrink-0 place-items-center rounded-xl bg-coral text-white"
          ><svg
            class="size-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" x2="19" y1="8" y2="14" />
            <line x1="22" x2="16" y1="11" y2="11" /></svg
        ></span>
        <span :class="TARJETA_TEXTO"
          ><strong class="text-sm">Externos</strong
          ><small class="text-mini text-muted"
            >Registrate para solicitar un espacio de biblioteca.</small
          ></span
        >
        <span aria-hidden="true" :class="TARJETA_FLECHA">→</span>
      </button>
    </div>

    <NuxtLink
      :class="[TARJETA, 'mt-3 border-dashed no-underline']"
      to="/disponibilidad"
    >
      <span
        aria-hidden="true"
        class="grid size-11 shrink-0 place-items-center rounded-xl bg-hairline text-muted"
      >
        <svg
          class="size-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </span>
      <span :class="TARJETA_TEXTO"
        ><strong class="text-sm">Visualizar disponibilidad de recursos</strong
        ><small class="text-mini text-muted"
          >Consultá qué lugares y notebooks hay disponibles, sin
          ingresar.</small
        ></span
      >
      <span aria-hidden="true" :class="TARJETA_FLECHA">→</span>
    </NuxtLink>

    <p class="hidden">
      <span
        class="mr-1.5 inline-grid size-4 place-items-center rounded-full border border-hint"
        >i</span
      >
      Tus datos se utilizan únicamente para gestionar la reserva.
    </p>
  </div>
</template>
