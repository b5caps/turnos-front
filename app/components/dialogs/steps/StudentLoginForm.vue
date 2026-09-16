<script setup lang="ts">
import { computed, ref } from 'vue'
import type { StudentCredentials } from '~/types'

const props = defineProps<{ modelValue: StudentCredentials; loading?: boolean; error?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: StudentCredentials]; 'login-success': [value: StudentCredentials]; back: [] }>()
const localError = ref('')

function update(field: keyof StudentCredentials, value: string) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

const legajo = computed({ get: () => props.modelValue.legajo, set: (value: string) => update('legajo', value) })
const password = computed({ get: () => props.modelValue.password, set: (value: string) => update('password', value) })

function handleSubmit() {
  localError.value = ''
  const cleanLegajo = legajo.value.trim()
  const cleanPassword = password.value.trim()

  if (!cleanLegajo || !cleanPassword) {
    localError.value = 'Por favor completá todos los campos.'
    return
  }

  if (cleanLegajo !== '16868' || cleanPassword !== 'catalina') {
    localError.value = 'Legajo o contraseña de Sysacad incorrectos.'
    return
  }

  update('legajo', cleanLegajo)
  update('password', cleanPassword)
  emit('login-success', { legajo: cleanLegajo, password: cleanPassword })
}
</script>

<template>
  <div class="student-login-step-wrapper">
    <div class="step-intro">
      <p class="section-kicker">Acceso de estudiante</p>
      <h2>Ingresá a GREB</h2>
      <p>Usá las mismas credenciales que utilizás en Sysacad.</p>
    </div>
    <form class="form-fields" @submit.prevent="handleSubmit">
      <label>Legajo<input v-model="legajo" autocomplete="username" inputmode="numeric" placeholder="Ej. 16868" required type="text"></label>
      <label>Contraseña de Sysacad<input v-model="password" autocomplete="current-password" placeholder="Ingresá tu contraseña" required type="password"></label>
      <p v-if="localError || props.error" class="form-error">{{ localError || props.error }}</p>
      <div class="form-actions"><button class="button button--quiet" type="button" @click="emit('back')">← Volver</button><button class="button button--primary" :disabled="loading" type="submit">{{ loading ? 'Verificando...' : 'Continuar' }} <span>→</span></button></div>
    </form>
  </div>
</template>
