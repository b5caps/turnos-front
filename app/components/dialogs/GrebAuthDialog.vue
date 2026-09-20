<script setup lang="ts">
import { computed } from 'vue'
import ExternalRegisterForm from '~/components/dialogs/steps/ExternalRegisterForm.vue'
import ResourceBookingForm from '~/components/dialogs/steps/ResourceBookingForm.vue'
import StudentLoginForm from '~/components/dialogs/steps/StudentLoginForm.vue'
import UserTypeStep from '~/components/dialogs/steps/UserTypeStep.vue'

const { step, userType, student, external, booking, isSubmitting, errorMessage, bookingCompleted, reservaConfirmada, stepLabel, chooseUserType, goBack, submitAuth, submitBooking, resetFlow } = useGrebAuth()
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
  <main class="relative grid min-h-screen place-items-center overflow-hidden bg-shell px-6 py-10 font-sans text-ink [background-image:radial-gradient(circle_at_9%_12%,rgb(255_255_255/0.75),transparent_30%),linear-gradient(135deg,#e2eee3,#cce0d6)] max-tablet:place-items-start max-tablet:p-3.5">
    <span aria-hidden="true" class="pointer-events-none absolute -top-[335px] -right-[120px] size-[530px] rounded-full border border-forest/15"></span>
    <span aria-hidden="true" class="pointer-events-none absolute -bottom-[520px] -left-[260px] size-[680px] rounded-full border border-forest/15"></span>

    <section aria-labelledby="greb-title" class="relative z-1 w-[min(100%,1050px)] animate-rise border border-white/70 bg-paper shadow-dialog max-tablet:my-2.5">
      <header class="flex min-h-26 items-center gap-4 border-b border-line px-10 py-5 max-tablet:p-5">
        <span class="grid size-14 place-items-center overflow-hidden rounded-[13px_13px_13px_3px] bg-forest">
          <img alt="Logo UTN" class="size-12 object-contain" src="/logo%20utn%20blanco.png">
        </span>
        <div>
          <p class="mb-1 text-micro font-bold tracking-widest text-coral uppercase">Facultad Regional San Francisco</p>
          <h1 id="greb-title" class="font-serif text-2xl font-bold tracking-wide">GREB</h1>
          <p class="mt-0.5 text-xs text-muted max-tablet:max-w-58 max-tablet:leading-snug">Gestor de Reservas y Espacios de Biblioteca</p>
        </div>
      </header>

      <div :class="step === 3 ? 'block' : 'grid min-h-128 grid-cols-[37%_63%] max-tablet:block'">
        <aside v-if="step !== 3" class="relative flex flex-col justify-between overflow-hidden bg-forest px-10 pt-14 pb-9 text-white after:absolute after:-right-[145px] after:-bottom-[90px] after:size-[260px] after:rounded-full after:border after:border-white/15 after:content-[''] max-tablet:min-h-40 max-tablet:px-6 max-tablet:py-6">
          <div>
            <p class="mb-1 text-micro font-bold tracking-widest text-aside-kicker uppercase">Tu espacio para aprender</p>
            <h2 class="my-4 max-w-60 font-serif text-4xl leading-none font-normal max-tablet:my-2 max-tablet:text-2xl">Biblioteca Dr. Antonio Lamberghini.</h2>
            <p class="max-w-60 text-tiny leading-relaxed text-aside-copy max-tablet:hidden">Encontrá el recurso que necesitás y asegurá tu lugar en la biblioteca.</p>
          </div>
        </aside>

        <div class="w-full px-14 pt-10 pb-8 max-tablet:px-5.5 max-tablet:py-7">
          <div class="flex items-baseline justify-between text-mini text-muted">
            <span><strong class="mr-2 text-base font-extrabold text-forest">0{{ step }}</strong>{{ stepLabel }}</span>
            <span class="text-mini text-faint">Paso {{ step }} de 3</span>
          </div>
          <div class="mt-2 mb-9 h-0.75 overflow-hidden bg-track">
            <span class="block h-full bg-coral transition-[width] duration-400 ease-in-out" :style="{ width: `${(step / 3) * 100}%` }"></span>
          </div>

          <div :key="`step-wrapper-${step}`">
            <UserTypeStep v-if="step === 1" :selected="userType" @choose="chooseUserType" />
            <StudentLoginForm v-else-if="step === 2 && userType === 'student'" :error="errorMessage" :loading="isSubmitting" :model-value="student" @back="goBack" @login-success="handleAuthSuccess" @update:model-value="updateStudent" />
            <ExternalRegisterForm v-else-if="step === 2 && userType === 'external'" :error="errorMessage" :loading="isSubmitting" :model-value="external" @back="goBack" @register-success="handleAuthSuccess" @update:model-value="updateExternal" />
            <ResourceBookingForm v-else-if="step === 3" :completed="isBookingCompleted" :error="bookingError" :loading="isSubmitting" :model-value="booking" :reserva="reservaConfirmada" @back="goBack" @submit="submitBooking" @update:model-value="updateBooking" />
          </div>
        </div>
      </div>

      <footer class="flex justify-between border-t border-line px-10 py-4 text-micro text-footer max-tablet:px-5 max-tablet:py-3.5">
        <span>GREB · Biblioteca</span>
      </footer>
    </section>
  </main>
</template>
