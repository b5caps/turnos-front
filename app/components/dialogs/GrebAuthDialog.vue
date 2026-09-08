<script setup lang="ts">
import { computed } from 'vue'
import ExternalRegisterForm from '~/components/dialogs/steps/ExternalRegisterForm.vue'
import ResourceBookingForm from '~/components/dialogs/steps/ResourceBookingForm.vue'
import StudentLoginForm from '~/components/dialogs/steps/StudentLoginForm.vue'
import UserTypeStep from '~/components/dialogs/steps/UserTypeStep.vue'

const { step, userType, student, external, booking, isSubmitting, errorMessage, bookingCompleted, stepLabel, chooseUserType, goBack, submitAuth, submitBooking, resetFlow } = useGrebAuth()
const isBookingCompleted = computed(() => Boolean(bookingCompleted.value))
const bookingError = computed(() => errorMessage.value || '')

function updateStudent(value: typeof student) {
  Object.assign(student, value)
}

function updateExternal(value: typeof external) {
  Object.assign(external, value)
}

function updateBooking(value: typeof booking) {
  Object.assign(booking, value)
}

function handleAuthSuccess() {
  submitAuth()
}

resetFlow()
</script>

<template>
  <main class="greb-shell">
    <span class="greb-orbit greb-orbit--top" aria-hidden="true"></span><span class="greb-orbit greb-orbit--bottom" aria-hidden="true"></span>
    <section class="auth-dialog" aria-labelledby="greb-title">
      <header class="dialog-header"><span class="brand-mark"><img src="/logo%20utn%20blanco.png" alt="Logo UTN"></span><div><p class="eyebrow">Facultad Regional San Francisco</p><h1 id="greb-title">GREB</h1><p class="dialog-subtitle">Gestor de Reservas y Espacios de Biblioteca</p></div></header>
      <div class="dialog-body" :class="{ 'dialog-body--booking': step === 3 }"><aside v-if="step !== 3" class="dialog-aside"><div><p class="aside-kicker">Tu espacio para aprender</p><h2>Biblioteca   Dr. Antonio Lamberghini.</h2><p class="aside-copy">Encontrá el recurso que necesitás y asegurá tu lugar en la biblioteca.</p></div></aside>
        <div class="dialog-content"><div class="progress-row"><span><strong class="progress-index">0{{ step }}</strong>{{ stepLabel }}</span><span class="progress-total">Paso {{ step }} de 3</span></div><div class="progress-bar"><span :style="{ width: `${(step / 3) * 100}%` }"></span></div>
          <div :key="`step-wrapper-${step}`" class="dialog-step-host"><UserTypeStep v-if="step === 1" :selected="userType" @choose="chooseUserType" /><StudentLoginForm v-else-if="step === 2 && userType === 'student'" :model-value="student" :error="errorMessage" :loading="isSubmitting" @back="goBack" @update:model-value="updateStudent" @login-success="handleAuthSuccess" /><ExternalRegisterForm v-else-if="step === 2 && userType === 'external'" :model-value="external" :error="errorMessage" :loading="isSubmitting" @back="goBack" @update:model-value="updateExternal" @register-success="handleAuthSuccess" /><ResourceBookingForm v-else-if="step === 3" :model-value="booking" :completed="isBookingCompleted" :error="bookingError" @back="goBack" @update:model-value="updateBooking" @submit="submitBooking" /></div>
        </div>
      </div>
      <footer class="dialog-footer"><span>GREB · Biblioteca</span></footer>
    </section>
  </main>
</template>
