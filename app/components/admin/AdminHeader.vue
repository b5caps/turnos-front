<script setup lang="ts">
import { ref } from "vue";
import { cerrarSesionApi, limpiarToken, obtenerToken } from "~/api/auth";

defineProps<{
  paginaActual: "turnos" | "calendario" | "qr";
}>();

const ENLACE_ACTIVO =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-notebook-ink px-4 py-1.5 text-xs font-semibold text-white shadow-xs no-underline max-tablet:px-3 max-tablet:py-1 max-tablet:text-tiny";
const ENLACE =
  "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink no-underline max-tablet:px-2 max-tablet:py-1 max-tablet:text-tiny";

const saliendo = ref(false);

async function salir() {
  saliendo.value = true;
  try {
    const token = obtenerToken();
    if (token) await cerrarSesionApi(token);
  } catch {
  } finally {
    limpiarToken();
    await navigateTo("/admin/login");
  }
}
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-line bg-white px-8 py-3.5 max-tablet:px-4 max-tablet:py-3"
  >
    <div
      class="flex items-center justify-between gap-4 max-tablet:flex-col max-tablet:items-stretch max-tablet:gap-3"
    >
      <div class="flex items-center gap-4">
        <img
          alt="UTN GREB"
          class="h-8 w-auto object-contain max-tablet:h-7"
          src="/Logo_GREB.jpg"
        />
        <span
          class="rounded-full bg-notebook px-2.5 py-1 text-tiny font-bold tracking-wider text-notebook-ink uppercase max-tablet:text-mini"
        >
          Administración
        </span>
      </div>

      <nav class="flex items-center gap-4 max-tablet:gap-1">
        <NuxtLink
          :class="paginaActual === 'turnos' ? ENLACE_ACTIVO : ENLACE"
          to="/admin"
        >
          <svg
            class="size-3.5 shrink-0"
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
          <span>Turnos</span>
        </NuxtLink>

        <NuxtLink
          :class="paginaActual === 'calendario' ? ENLACE_ACTIVO : ENLACE"
          to="/admin/calendario"
        >
          <svg
            class="size-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
            />
            <path d="m14 14 2 2 4-4" />
          </svg>
          <span class="max-tablet:hidden">Configuración de fechas</span>
          <span class="tablet:hidden">Fechas</span>
        </NuxtLink>

        <NuxtLink
          :class="paginaActual === 'qr' ? ENLACE_ACTIVO : ENLACE"
          to="/admin/qr"
        >
          <svg
            class="size-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <rect height="5" rx="1" width="5" x="3" y="3" />
            <rect height="5" rx="1" width="5" x="16" y="3" />
            <rect height="5" rx="1" width="5" x="3" y="16" />
            <path
              d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M12 12v9M16 12h5"
            />
          </svg>
          <span>QR<span class="max-tablet:hidden"> de salas</span></span>
        </NuxtLink>

        <span
          aria-hidden="true"
          class="h-4 w-px bg-line max-tablet:hidden"
        ></span>

        <button
          aria-label="Cerrar sesión"
          class="flex shrink-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent text-xs font-semibold text-muted transition-colors hover:text-ink disabled:cursor-wait disabled:opacity-65 max-tablet:ml-auto max-tablet:text-tiny"
          :disabled="saliendo"
          type="button"
          @click="salir"
        >
          <svg
            class="size-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span class="max-tablet:hidden">{{
            saliendo ? "Cerrando sesión..." : "Cerrar sesión"
          }}</span>
        </button>
      </nav>
    </div>
  </header>
</template>
