<script setup lang="ts">
import { ref } from "vue";
import AdminHeader from "~/components/admin/AdminHeader.vue";
import CalendarioMensual from "~/components/admin/CalendarioMensual.vue";
import GestionBloqueos from "~/components/admin/GestionBloqueos.vue";
import GestionFeriados from "~/components/admin/GestionFeriados.vue";

definePageMeta({ middleware: "admin" });

const subseccionActiva = ref<"calendario" | "bloqueos" | "feriados">(
  "calendario",
);
const fechaSeleccionadaDia = ref<string>("");

function onSeleccionarDia(fechaIso: string) {
  fechaSeleccionadaDia.value = fechaIso;
  subseccionActiva.value = "bloqueos";
}
</script>

<template>
  <main class="min-h-screen bg-paper font-sans text-ink">
    <AdminHeader pagina-actual="calendario" />

    <div
      class="mx-auto w-[min(100%,1180px)] px-8 py-8 max-tablet:px-5 max-tablet:py-6"
    >
      <div
        class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4"
      >
        <div>
          <h1 class="m-0 text-4xl font-bold tracking-tight">
            Configuración de fechas
          </h1>
          <p class="mt-2 mb-0 text-xs text-muted">
            Administrá el calendario mensual, los bloqueos temporales de salas,
            feriados nacionales y días no laborables de la biblioteca.
          </p>
        </div>

        <nav class="flex items-center gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="subseccionActiva === 'calendario'"
            :class="[
              'cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-colors',
              subseccionActiva === 'calendario'
                ? 'bg-notebook-ink text-white shadow-xs'
                : 'bg-white border border-line text-muted hover:text-ink',
            ]"
            @click="subseccionActiva = 'calendario'"
          >
            Calendario Mensual
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="subseccionActiva === 'bloqueos'"
            :class="[
              'cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-colors',
              subseccionActiva === 'bloqueos'
                ? 'bg-notebook-ink text-white shadow-xs'
                : 'bg-white border border-line text-muted hover:text-ink',
            ]"
            @click="subseccionActiva = 'bloqueos'"
          >
            Bloqueos de Salas
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="subseccionActiva === 'feriados'"
            :class="[
              'cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-colors',
              subseccionActiva === 'feriados'
                ? 'bg-notebook-ink text-white shadow-xs'
                : 'bg-white border border-line text-muted hover:text-ink',
            ]"
            @click="subseccionActiva = 'feriados'"
          >
            Feriados y No Laborables
          </button>
        </nav>
      </div>

      <!-- Vistas según pestaña seleccionada -->
      <CalendarioMensual
        v-if="subseccionActiva === 'calendario'"
        :fecha-seleccionada="fechaSeleccionadaDia"
        @seleccionar-dia="onSeleccionarDia"
      />
      <GestionBloqueos
        v-else-if="subseccionActiva === 'bloqueos'"
        :fecha-inicial="fechaSeleccionadaDia"
        @volver="subseccionActiva = 'calendario'"
      />
      <GestionFeriados v-else-if="subseccionActiva === 'feriados'" />
    </div>
  </main>
</template>
