<script setup lang="ts">
import { onMounted } from "vue";
import EstadoDisponibilidad from "~/components/disponibilidad/EstadoDisponibilidad.vue";
import FiltroSalas from "~/components/disponibilidad/FiltroSalas.vue";
import GrillaDisponibilidad from "~/components/disponibilidad/GrillaDisponibilidad.vue";
import ReferenciaEstados from "~/components/disponibilidad/ReferenciaEstados.vue";
import SelectorFecha from "~/components/disponibilidad/SelectorFecha.vue";

const {
  bloques,
  fecha,
  cargando,
  errorMessage,
  abierta,
  esHoy,
  salas,
  salaSeleccionada,
  recursosVisibles,
  cargar,
  irAFecha,
  moverDias,
  irAHoy,
  seleccionarSala,
  estadoDe,
} = useDisponibilidad();

const { isAuthenticated, isSubmitting, logout } = useGrebAuth();

onMounted(cargar);
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
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 rounded-full bg-notebook-ink px-4 py-1.5 text-xs font-semibold text-white shadow-xs no-underline"
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

      <NuxtLink
        v-else
        to="/"
        class="cursor-pointer border-0 bg-transparent text-xs font-semibold text-muted transition-colors hover:text-ink no-underline"
      >
        Ingresar
      </NuxtLink>
    </header>

    <div class="my-6 w-full max-w-4xl flex-1 px-4 max-tablet:my-3">
      <section
        aria-labelledby="disponibilidad-titulo"
        class="rounded-2xl border border-line bg-white p-6 shadow-card max-tablet:p-4"
      >
        <div class="mb-5">
          <h1
            id="disponibilidad-titulo"
            class="font-sans text-2xl font-bold tracking-tight text-ink"
          >
            Disponibilidad
          </h1>
          <p class="mt-0.5 text-xs text-muted">
            Consultá qué lugares y notebooks hay disponibles
          </p>
        </div>

        <div class="flex flex-col gap-5">
          <SelectorFecha
            :deshabilitado="cargando"
            :es-hoy="esHoy"
            :fecha="fecha"
            @hoy="irAHoy"
            @mover="moverDias"
            @update:fecha="irAFecha"
          />

          <FiltroSalas
            v-if="abierta && salas.length"
            :salas="salas"
            :seleccionada="salaSeleccionada"
            @seleccionar="seleccionarSala"
          />

          <EstadoDisponibilidad
            :abierta="abierta"
            :cargando="cargando"
            :error-message="errorMessage"
            :sin-bloques="!bloques.length"
            @reintentar="cargar"
          >
            <GrillaDisponibilidad
              :bloques="bloques"
              :estado-de="estadoDe"
              :recursos="recursosVisibles"
            />
            <ReferenciaEstados />
          </EstadoDisponibilidad>
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
