<script setup lang="ts">
import { computed } from "vue";
import ExternalRegisterForm from "~/components/dialogs/steps/ExternalRegisterForm.vue";
import ResourceBookingForm from "~/components/dialogs/steps/ResourceBookingForm.vue";
import StudentLoginForm from "~/components/dialogs/steps/StudentLoginForm.vue";
import UserTypeStep from "~/components/dialogs/steps/UserTypeStep.vue";

const {
  step,
  userType,
  student,
  external,
  booking,
  isSubmitting,
  errorMessage,
  bookingCompleted,
  reservaConfirmada,
  stepLabel,
  chooseUserType,
  goBack,
  submitAuth,
  submitBooking,
  resetFlow,
  isAuthenticated,
  logout,
} = useGrebAuth();
const isBookingCompleted = computed(() => Boolean(bookingCompleted.value));
const bookingError = computed(() => errorMessage.value || "");

function updateStudent(value: typeof student) {
  Object.assign(student, value);
}

function updateExternal(value: typeof external) {
  Object.assign(external, value);
}

function updateBooking(value: typeof booking) {
  Object.assign(booking, value);
}

function handleAuthSuccess() {
  submitAuth();
}

async function handleLogout() {
  await logout();
}

if (!isAuthenticated.value) {
  resetFlow();
}
</script>

<template>
  <main
    class="relative flex min-h-screen flex-col items-center justify-between bg-paper font-sans text-ink"
  >
    <header
      class="flex w-full items-center justify-between border-b border-line bg-white px-8 py-3.5"
    >
      <div class="flex items-center gap-6">
        <img
          src="/Logo_GREB.jpg"
          alt="UTN GREB"
          class="h-8 w-auto object-contain"
        />
      </div>

      <div v-if="isAuthenticated" class="flex items-center gap-4">
        <span
          v-if="!isBookingCompleted"
          class="inline-flex items-center gap-1.5 rounded-full bg-notebook-ink px-4 py-1.5 text-xs font-semibold text-white shadow-xs"
        >
          <svg
            class="size-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
          <span>Reservar</span>
        </span>
        <button
          v-else
          type="button"
          class="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent text-xs font-medium text-muted transition-colors hover:text-ink"
          @click="bookingCompleted = false"
        >
          <svg
            class="size-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
          <span>Reservar</span>
        </button>

        <span
          class="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          <svg
            class="size-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
            />
            <path d="M6 2v20" />
          </svg>
          <span>Ver mis reservas</span>
        </span>

        <span class="h-4 w-px bg-line" aria-hidden="true"></span>

        <button
          type="button"
          class="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent text-xs font-semibold text-muted transition-colors hover:text-ink disabled:cursor-wait disabled:opacity-65"
          :disabled="isSubmitting"
          @click="handleLogout"
        >
          <svg
            class="size-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span>{{
            isSubmitting ? "Cerrando sesión..." : "Cerrar sesión"
          }}</span>
        </button>
      </div>
    </header>

    <!-- Paso 3: Tarjeta blanca centrada a página completa -->
    <div
      v-if="step === 3"
      class="my-6 w-full max-w-4xl flex-1 px-4 max-tablet:my-3"
    >
      <section
        aria-labelledby="greb-booking-title"
        class="rounded-2xl border border-line bg-white p-6 shadow-card max-tablet:p-4"
      >
        <ResourceBookingForm
          :completed="isBookingCompleted"
          :error="bookingError"
          :loading="isSubmitting"
          :model-value="booking"
          :reserva="reservaConfirmada"
          @back="goBack"
          @submit="submitBooking"
          @update:model-value="updateBooking"
          @nueva-reserva="bookingCompleted = false"
        />
      </section>
    </div>

    <!-- Pasos 1 y 2: Diálogo con sidebar -->
    <div v-else class="my-auto flex w-full justify-center px-4 max-tablet:my-4">
      <section
        aria-labelledby="greb-title"
        class="relative z-1 w-full max-w-4xl animate-rise overflow-hidden rounded-2xl border border-line bg-white shadow-card"
      >
        <div
          class="grid min-h-128 grid-cols-[37%_63%] max-tablet:block max-tablet:min-h-0"
        >
          <aside
            class="relative flex flex-col justify-between overflow-hidden bg-notebook-ink p-8 text-white max-tablet:block max-tablet:min-h-0 max-tablet:p-4"
          >
            <div
              aria-hidden="true"
              class="pointer-events-none absolute -right-12 -bottom-12 size-64 rounded-full border border-notebook/20 max-tablet:hidden"
            >
              <div
                class="absolute inset-6 rounded-full border border-notebook/15"
              ></div>
              <div
                class="absolute inset-14 rounded-full border border-notebook/10"
              ></div>
            </div>

            <div class="relative z-1">
              <h2
                id="greb-title"
                class="font-sans text-2xl font-bold leading-tight text-white max-tablet:text-sm max-tablet:leading-snug max-tablet:whitespace-nowrap"
              >
                Gestor de Reservas<br class="max-tablet:hidden" />
                de Biblioteca
              </h2>
              <div
                class="mt-3.5 h-1 w-8 rounded-full bg-notebook max-tablet:hidden"
              ></div>
            </div>

            <div
              class="relative z-1 mt-auto space-y-2 pt-12 text-xs text-white/95 max-tablet:hidden"
            >
              <div class="flex items-center gap-2.5">
                <svg
                  aria-hidden="true"
                  class="size-4 shrink-0 text-coral"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>Horario de 10:00 a 22:00</span>
              </div>
              <div class="flex items-center gap-2.5">
                <svg
                  aria-hidden="true"
                  class="size-4 shrink-0 text-coral"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <rect height="12" rx="1" width="18" x="3" y="4" />
                  <path d="M2 20h20" />
                </svg>
                <span>Uso de salas y Notebooks</span>
              </div>
            </div>
          </aside>

          <div class="flex w-full flex-col justify-center p-10 max-tablet:p-6">
            <div :key="`step-wrapper-${step}`">
              <UserTypeStep
                v-if="step === 1"
                :selected="userType"
                @choose="chooseUserType"
              />
              <StudentLoginForm
                v-else-if="step === 2 && userType === 'student'"
                :error="errorMessage"
                :loading="isSubmitting"
                :model-value="student"
                @back="goBack"
                @login-success="handleAuthSuccess"
                @update:model-value="updateStudent"
              />
              <ExternalRegisterForm
                v-else-if="step === 2 && userType === 'external'"
                :error="errorMessage"
                :loading="isSubmitting"
                :model-value="external"
                @back="goBack"
                @register-success="handleAuthSuccess"
                @login-success="handleAuthSuccess"
                @update:model-value="updateExternal"
              />
            </div>
          </div>
        </div>
      </section>
    </div>

    <footer class="mb-6 space-y-0.5 text-center text-xs text-muted">
      <p class="font-semibold text-ink">
        Gestor de Reservas y Espacios de Biblioteca
      </p>
      <p class="text-mini text-faint">
        Universidad Tecnológica Nacional • Facultad Regional San Francisco • Av.
        de la Universidad 501, San Francisco, Córdoba.
      </p>
    </footer>
  </main>
</template>
