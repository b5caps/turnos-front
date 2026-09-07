<script setup lang="ts">
import type { UserType } from '~/types'

defineProps<{ selected: UserType | null }>()
const emit = defineEmits<{ choose: [type: UserType] }>()
</script>

<template>
  <div class="user-type-step-wrapper">
    <div class="step-intro">
      <p class="section-kicker">Primer paso</p>
      <h2>¿Cómo vas a ingresar?</h2>
      <p>Elegí el tipo de usuario para continuar con tu reserva.</p>
    </div>

    <div class="user-type-grid">
      <button class="user-type-card" :class="{ 'user-type-card--selected': selected === 'student' }" type="button" @click="emit('choose', 'student')">
        <span class="card-icon" aria-hidden="true">⌂</span>
        <span class="card-copy"><strong>Estudiantes</strong><small>Ingresá con tu legajo y contraseña de Sysacad.</small></span>
        <span class="card-arrow" aria-hidden="true">→</span>
      </button>
      <button class="user-type-card" :class="{ 'user-type-card--selected': selected === 'external' }" type="button" @click="emit('choose', 'external')">
        <span class="card-icon card-icon--external" aria-hidden="true">✦</span>
        <span class="card-copy"><strong>Externos</strong><small>Registrate para solicitar un espacio de biblioteca.</small></span>
        <span class="card-arrow" aria-hidden="true">→</span>
      </button>
    </div>
    <NuxtLink class="consulta-libre" to="/disponibilidad">
      <span class="card-copy"><strong>Visualizar disponibilidad de recursos</strong><small>Consultá qué lugares y notebooks hay disponibles, sin ingresar.</small></span>
      <span class="card-arrow" aria-hidden="true">→</span>
    </NuxtLink>

    <p class="step-note"><span>i</span> Tus datos se utilizan únicamente para gestionar la reserva.</p>
  </div>
</template>

<style scoped>
.consulta-libre { display: flex; align-items: center; gap: 15px; margin-top: 12px; padding: 16px 19px; border: 1px dashed #abbcb3; color: var(--ink); text-decoration: none; transition: border-color .2s; }
.consulta-libre:hover { border-color: var(--forest); }
</style>
