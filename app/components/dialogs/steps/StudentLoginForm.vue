<script setup lang="ts">
import { computed, ref } from 'vue'
import { ACCIONES, BOTON_PRIMARIO, BOTON_SUAVE, CAMPO, ERROR, ETIQUETA, FLECHA_BOTON, INTRO, INTRO_TEXTO, INTRO_TITULO, KICKER } from '~/constants/estilos'
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
  <div>
    <div :class="INTRO">
      <p :class="KICKER">Acceso de estudiante</p>
      <h2 :class="INTRO_TITULO">Ingresá a GREB</h2>
      <p :class="INTRO_TEXTO">Usá las mismas credenciales que utilizás en Sysacad.</p>
    </div>
    <form class="grid gap-4" @submit.prevent="handleSubmit">
      <label :class="ETIQUETA">Legajo<input v-model="legajo" autocomplete="username" :class="CAMPO" inputmode="numeric" placeholder="Ej. 16868" required type="text"></label>
      <label :class="ETIQUETA">Contraseña de Sysacad<input v-model="password" autocomplete="current-password" :class="CAMPO" placeholder="Ingresá tu contraseña" required type="password"></label>
      <p v-if="localError || props.error" :class="ERROR">{{ localError || props.error }}</p>
      <div :class="ACCIONES">
        <button :class="BOTON_SUAVE" type="button" @click="emit('back')">← Volver</button>
        <button :class="BOTON_PRIMARIO" :disabled="loading" type="submit">{{ loading ? 'Verificando...' : 'Continuar' }} <span :class="FLECHA_BOTON">→</span></button>
      </div>
    </form>
  </div>
</template>
