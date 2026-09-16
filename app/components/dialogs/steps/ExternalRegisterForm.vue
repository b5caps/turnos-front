<script setup lang="ts">
import { computed, ref } from 'vue'
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
  <div class="external-register-step-wrapper">
    <div class="step-intro"><p class="section-kicker">Registro externo</p><h2>Creá tu acceso</h2><p>Completá tus datos para reservar recursos de la biblioteca.</p></div>
    <form class="form-fields form-fields--two-columns" @submit.prevent="handleSubmit">
      <label>Nombre<input v-model="firstName" autocomplete="given-name" required></label>
      <label>Apellido<input v-model="lastName" autocomplete="family-name" required></label>
      <label>DNI<input v-model="dni" inputmode="numeric" required></label>
      <label>Celular<input v-model="phone" autocomplete="tel" inputmode="tel" required></label>
      <label class="field-full">Correo electrónico<input v-model="email" autocomplete="email" required type="email"></label>
      <p v-if="localError || props.error" class="form-error field-full">{{ localError || props.error }}</p>
      <div class="form-actions field-full"><button class="button button--quiet" type="button" @click="emit('back')">← Volver</button><button class="button button--primary" :disabled="loading" type="submit">{{ loading ? 'Guardando...' : 'Registrarse e ingresar' }} <span>→</span></button></div>
    </form>
  </div>
</template>
