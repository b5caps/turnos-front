<script setup lang="ts">
import { onMounted } from "vue";
import FiltroEstados from "~/components/reservas/FiltroEstados.vue";
import TarjetaReserva from "~/components/reservas/TarjetaReserva.vue";
import { BOTON_SUAVE } from "~/constants/estilos";

const {
  usuario,
  reservas,
  filtro,
  cargando,
  errorMessage,
  aviso,
  cancelando,
  cargar,
  filtrarPor,
  cancelar,
} = useMisReservas();

const { isSubmitting, logout } = useGrebAuth();

onMounted(cargar);
</script>

<template>
  <main
    class="relative flex min-h-screen flex-col items-center justify-between bg-paper font-sans text-ink"
  >
    <header
      class="sticky top-0 z-50 flex w-full items-center justify-between border-b border-line bg-white px-8 py-3.5"
    >
      <div class="flex items-center gap-6">
        <img
          src="/Logo_GREB.jpg"
          alt="UTN GREB"
          class="h-8 w-auto object-contain"
        />
      </div>

      <div class="flex items-center gap-4">
        <NuxtLink
          to="/"
          class="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink no-underline"
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
        </NuxtLink>

        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-notebook-ink px-4 py-1.5 text-xs font-semibold text-white shadow-xs"
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
          @click="logout"
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

    <div class="my-6 w-full max-w-4xl flex-1 px-4 max-tablet:my-3">
      <section
        aria-labelledby="mis-reservas-titulo"
        class="rounded-2xl border border-line bg-white p-6 shadow-card max-tablet:p-4"
      >
        <div class="mb-5">
          <h1
            id="mis-reservas-titulo"
            class="font-sans text-2xl font-bold tracking-tight text-ink"
          >
            Mis reservaciones
          </h1>
        </div>

        <div
          v-if="!usuario"
          class="flex flex-col items-center gap-3 py-12 text-center"
        >
          <p class="m-0 text-xs text-muted">
            Iniciá sesión para ver tus reservas.
          </p>
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-1.5 rounded-full bg-notebook-ink px-4 py-1.5 text-xs font-semibold text-white shadow-xs no-underline"
          >
            Ingresar
          </NuxtLink>
        </div>

        <template v-else>
          <div class="mb-4">
            <FiltroEstados
              :deshabilitado="cargando"
              :seleccionado="filtro"
              @seleccionar="filtrarPor"
            />
          </div>

          <p
            v-if="aviso"
            class="mb-4 rounded-lg bg-mint p-3 text-xs font-medium text-forest-deep"
          >
            {{ aviso }}
          </p>

          <p v-if="cargando" class="py-8 text-center text-xs text-muted">
            Cargando tus reservas…
          </p>

          <div
            v-else-if="errorMessage"
            class="flex flex-col items-center gap-2.5 py-8 text-center text-xs text-danger"
          >
            <p class="m-0">{{ errorMessage }}</p>
            <button :class="BOTON_SUAVE" type="button" @click="cargar">
              Reintentar
            </button>
          </div>

          <div
            v-else-if="!reservas.length"
            class="flex flex-col items-center gap-3 py-12 text-center"
          >
            <p class="m-0 text-xs text-muted">
              Todavía no tenés reservas con este filtro.
            </p>
            <NuxtLink
              to="/"
              class="inline-flex items-center gap-1.5 rounded-full bg-notebook-ink px-4 py-1.5 text-xs font-semibold text-white shadow-xs no-underline"
            >
              Reservar un espacio
            </NuxtLink>
          </div>

          <div v-else class="flex flex-col gap-3.5">
            <TarjetaReserva
              v-for="reserva in reservas"
              :key="reserva.id"
              :cancelando="cancelando === reserva.id"
              :reserva="reserva"
              @cancelar="cancelar"
            />
          </div>
        </template>
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
