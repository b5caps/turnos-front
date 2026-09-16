<script setup lang="ts">
import { INTRO, INTRO_TEXTO, INTRO_TITULO, KICKER, TARJETA, TARJETA_ACTIVA, TARJETA_FLECHA, TARJETA_TEXTO } from '~/constants/estilos'
import type { UserType } from '~/types'

defineProps<{ selected: UserType | null }>()
const emit = defineEmits<{ choose: [type: UserType] }>()
</script>

<template>
  <div>
    <div :class="INTRO">
      <p :class="KICKER">Primer paso</p>
      <h2 :class="INTRO_TITULO">¿Cómo vas a ingresar?</h2>
      <p :class="INTRO_TEXTO">Elegí el tipo de usuario para continuar con tu reserva.</p>
    </div>

    <div class="grid gap-3">
      <button :class="[TARJETA, selected === 'student' && TARJETA_ACTIVA]" type="button" @click="emit('choose', 'student')">
        <span aria-hidden="true" class="grid size-9 place-items-center rounded-full bg-mint text-xl text-forest">⌂</span>
        <span :class="TARJETA_TEXTO"><strong class="text-sm">Usuario UTN</strong><small class="text-mini text-muted">Ingresá con tu legajo y contraseña de Sysacad.</small></span>
        <span aria-hidden="true" :class="TARJETA_FLECHA">→</span>
      </button>
      <button :class="[TARJETA, selected === 'external' && TARJETA_ACTIVA]" type="button" @click="emit('choose', 'external')">
        <span aria-hidden="true" class="grid size-9 place-items-center rounded-full bg-external text-xl text-coral">✦</span>
        <span :class="TARJETA_TEXTO"><strong class="text-sm">Externos</strong><small class="text-mini text-muted">Registrate para solicitar un espacio de biblioteca.</small></span>
        <span aria-hidden="true" :class="TARJETA_FLECHA">→</span>
      </button>
    </div>

    <NuxtLink class="mt-3 flex items-center gap-4 border border-dashed border-hint px-5 py-4 text-ink no-underline transition-colors hover:border-forest" to="/disponibilidad">
      <span :class="TARJETA_TEXTO"><strong class="text-sm">Visualizar disponibilidad de recursos</strong><small class="text-mini text-muted">Consultá qué lugares y notebooks hay disponibles, sin ingresar.</small></span>
      <span aria-hidden="true" :class="TARJETA_FLECHA">→</span>
    </NuxtLink>

    <p class="mt-6 text-mini text-muted">
      <span class="mr-1.5 inline-grid size-4 place-items-center rounded-full border border-hint">i</span>
      Tus datos se utilizan únicamente para gestionar la reserva.
    </p>
  </div>
</template>
