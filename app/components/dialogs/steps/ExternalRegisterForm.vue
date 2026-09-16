<script setup lang="ts">
import { computed, ref } from 'vue'
import { ACCIONES, BOTON_PRIMARIO, BOTON_SUAVE, CAMPO, ERROR, ETIQUETA, FLECHA_BOTON, INTRO, INTRO_TEXTO, INTRO_TITULO, KICKER } from '~/constants/estilos'
import type { ExternalRegistration } from '~/types'

const props = defineProps<{ modelValue: ExternalRegistration; loading?: boolean; error?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: ExternalRegistration]; 'register-success': [value: ExternalRegistration]; back: [] }>()
const localError = ref('')
function update(field: keyof ExternalRegistration, value: string) { emit('update:modelValue', { ...props.modelValue, [field]: value }) }
const firstName = computed({ get: () => props.modelValue.firstName, set: (value: string) => update('firstName', value) })
const lastName = computed({ get: () => props.modelValue.lastName, set: (value: string) => update('lastName', value) })
const dni = computed({ get: () => props.modelValue.dni, set: (value: string) => update('dni', value) })
const phone = computed({ get: () => props.modelValue.phone, set: (value: string) => update('phone', value) })
const email = computed({ get: () => props.modelValue.email, set: (value: string) => update('email', value) })

function handleSubmit() {
  localError.value = ''
  const cleanData = {
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    dni: dni.value.trim(),
    phone: phone.value.trim(),
    email: email.value.trim(),
  }

  if (!Object.values(cleanData).every(Boolean)) {
    localError.value = 'Por favor completá todos los campos.'
    return
  }
  if (!/^\S+@\S+\.\S+$/.test(cleanData.email)) {
    localError.value = 'Ingresá un correo electrónico válido.'
    return
  }
  if (!/^\d{7,15}$/.test(cleanData.dni) || !/^\+?[\d\s-]{7,20}$/.test(cleanData.phone)) {
    localError.value = 'Ingresá un DNI y un celular válidos.'
    return
  }

  emit('update:modelValue', cleanData)
  emit('register-success', cleanData)
}
</script>

<template>
  <div>
    <div :class="INTRO">
      <p :class="KICKER">Registro externo</p>
      <h2 :class="INTRO_TITULO">Creá tu acceso</h2>
      <p :class="INTRO_TEXTO">Completá tus datos para reservar recursos de la biblioteca.</p>
    </div>
    <form class="grid grid-cols-2 gap-x-4 gap-y-3.5 max-tablet:grid-cols-1" @submit.prevent="handleSubmit">
      <label :class="ETIQUETA">Nombre<input v-model="firstName" autocomplete="given-name" :class="CAMPO" required></label>
      <label :class="ETIQUETA">Apellido<input v-model="lastName" autocomplete="family-name" :class="CAMPO" required></label>
      <label :class="ETIQUETA">DNI<input v-model="dni" :class="CAMPO" inputmode="numeric" required></label>
      <label :class="ETIQUETA">Celular<input v-model="phone" autocomplete="tel" :class="CAMPO" inputmode="tel" required></label>
      <label :class="[ETIQUETA, 'col-span-full max-tablet:col-auto']">Correo electrónico<input v-model="email" autocomplete="email" :class="CAMPO" required type="email"></label>
      <p v-if="localError || props.error" :class="[ERROR, 'col-span-full max-tablet:col-auto']">{{ localError || props.error }}</p>
      <div :class="[ACCIONES, 'col-span-full max-tablet:col-auto']">
        <button :class="BOTON_SUAVE" type="button" @click="emit('back')">← Volver</button>
        <button :class="BOTON_PRIMARIO" :disabled="loading" type="submit">{{ loading ? 'Guardando...' : 'Registrarse e ingresar' }} <span :class="FLECHA_BOTON">→</span></button>
      </div>
    </form>
  </div>
</template>
