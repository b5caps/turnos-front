<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AdminHeader from "~/components/admin/AdminHeader.vue";
import GrillaTurnos from "~/components/admin/GrillaTurnos.vue";
import TarjetaMetrica from "~/components/admin/TarjetaMetrica.vue";
import { BOTON, BOTON_SUAVE, CAMPO, ETIQUETA } from "~/constants/estilos";
import { formatearFechaCorta } from "~/constants/horarios";
import type { FiltroTurno } from "~/types/admin";

definePageMeta({ middleware: "admin" });

const {
  visibles,
  encontrados,
  metricas,
  filtro,
  busqueda,
  pagina,
  totalPaginas,
  porPagina,
  cargando,
  errorMessage,
  cargar,
  filtrarPor,
  irAPagina,
  seleccionados,
  elegidos,
  cancelablesVisibles,
  paginaElegida,
  cancelando,
  aviso,
  alternar,
  alternarPagina,
  limpiarSeleccion,
  cancelarSeleccionados,
  horaFormateada,
} = useTurnosAdmin();

const confirmando = ref(false);
const motivo = ref("");

async function confirmarCancelacion() {
  await cancelarSeleccionados(motivo.value);
  confirmando.value = false;
  motivo.value = "";
}

const desde = computed(() => (pagina.value - 1) * porPagina + 1);
const hasta = computed(() =>
  Math.min(pagina.value * porPagina, encontrados.value.length),
);

const FILTROS: { valor: FiltroTurno; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "pendiente", etiqueta: "Programados" },
  { valor: "activo", etiqueta: "Activos" },
  { valor: "finalizado", etiqueta: "Finalizados" },
  { valor: "cancelado", etiqueta: "Cancelados" },
];

const CHIP =
  "cursor-pointer rounded-lg border px-3.5 py-1.5 text-tiny font-semibold transition-colors";
const CHIP_ACTIVO = "border-notebook-ink bg-notebook-ink text-white";
const CHIP_INACTIVO = "border-line bg-white text-muted hover:text-ink";
const PAGINA =
  "cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors not-disabled:hover:border-forest disabled:cursor-not-allowed disabled:opacity-40";

onMounted(cargar);
</script>

<template>
  <main class="min-h-screen bg-paper font-sans text-ink">
    <AdminHeader pagina-actual="turnos" />

    <div
      class="mx-auto w-[min(100%,1180px)] px-8 py-8 max-tablet:px-5 max-tablet:py-6"
    >
      <h1 class="m-0 text-4xl font-bold tracking-tight">Turnos</h1>

      <div class="mt-7 mb-3 flex items-baseline justify-between gap-3">
        <h2 class="text-big font-bold tracking-wider uppercase">Métricas</h2>
        <span v-if="horaFormateada" class="text-xs font-normal text-muted">
          Actualizado {{ horaFormateada }}
        </span>
      </div>
      <div
        v-if="metricas"
        class="grid grid-cols-5 gap-4 max-tablet:grid-cols-2"
      >
        <TarjetaMetrica
          etiqueta="Reservas de hoy"
          tono="finalizado"
          :valor="metricas.reservasHoy"
        />
        <TarjetaMetrica
          etiqueta="En curso ahora"
          tono="activo"
          :valor="metricas.enCurso"
        />
        <TarjetaMetrica
          :detalle="`${metricas.salasOcupadas} de ${metricas.totalSalas} salas`"
          etiqueta="Ocupación de salas"
          tono="pendiente"
          :valor="`${Math.round(metricas.ocupacionSalas)}%`"
        />
        <TarjetaMetrica
          etiqueta="Canceladas hoy"
          tono="cancelado"
          :valor="metricas.canceladas"
        />
        <TarjetaMetrica
          :detalle="`${metricas.notebooksLibres} de ${metricas.totalNotebooks} en total`"
          etiqueta="Notebooks libres"
          tono="notebook"
          :valor="metricas.notebooksLibres"
        />
      </div>

      <h2 class="mt-8 mb-3 text-big font-bold tracking-wider uppercase">
        Grilla de turnos
      </h2>

      <div
        v-if="aviso"
        class="mb-4 flex items-center justify-between rounded-xl border border-forest/20 bg-mint px-5 py-3 text-xs font-semibold text-forest-deep"
      >
        <span>{{ aviso }}</span>
        <button
          type="button"
          class="cursor-pointer text-xs font-bold text-forest-deep underline hover:opacity-80"
          @click="aviso = ''"
        >
          Cerrar
        </button>
      </div>

      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label class="relative w-72 max-tablet:w-full">
          <span class="sr-only">Buscar por alumno</span>
          <input
            v-model="busqueda"
            :class="[CAMPO, 'py-2.5 pl-9 text-tiny']"
            placeholder="Buscar por alumno…"
            type="search"
          />
          <svg
            aria-hidden="true"
            class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </label>
        <div
          aria-label="Filtrar por estado"
          class="flex flex-wrap gap-2"
          role="group"
        >
          <button
            v-for="opcion in FILTROS"
            :key="opcion.valor"
            :class="[
              CHIP,
              filtro === opcion.valor ? CHIP_ACTIVO : CHIP_INACTIVO,
            ]"
            type="button"
            @click="filtrarPor(opcion.valor)"
          >
            {{ opcion.etiqueta }}
          </button>
        </div>
      </div>

      <p
        v-if="cargando"
        class="m-0 rounded-xl border border-line bg-white px-5 py-12 text-center text-tiny text-muted"
      >
        Cargando turnos…
      </p>
      <div
        v-else-if="errorMessage"
        class="flex flex-col items-center gap-2.5 rounded-xl border border-line bg-white px-5 py-12 text-center text-tiny text-danger"
      >
        <p class="m-0">{{ errorMessage }}</p>
        <button :class="BOTON_SUAVE" type="button" @click="cargar">
          Reintentar
        </button>
      </div>
      <template v-else>
        <div
          class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-5 py-3"
        >
          <div class="flex items-center gap-3">
            <span class="text-tiny text-muted">
              {{
                seleccionados.length
                  ? `${seleccionados.length} ${seleccionados.length === 1 ? "turno elegido" : "turnos elegidos"}`
                  : "Elegí turnos para cancelarlos"
              }}
            </span>
            <button
              v-if="seleccionados.length"
              :class="BOTON_SUAVE"
              type="button"
              @click="limpiarSeleccion"
            >
              Limpiar
            </button>
          </div>
          <button
            :class="[
              BOTON,
              'bg-estado-cancelado text-white disabled:cursor-not-allowed disabled:opacity-40',
            ]"
            :disabled="!seleccionados.length || cancelando"
            type="button"
            @click="confirmando = true"
          >
            {{ cancelando ? "Cancelando..." : "Cancelar turnos" }}
          </button>
        </div>

        <form
          v-if="confirmando"
          class="mb-3 flex flex-wrap items-end gap-3 rounded-xl border border-estado-cancelado/30 bg-estado-cancelado-suave px-5 py-4"
          @submit.prevent="confirmarCancelacion"
        >
          <ul
            class="m-0 max-h-40 w-full list-none overflow-auto rounded-lg bg-white/70 p-3 text-tiny"
          >
            <li
              v-for="turno in elegidos"
              :key="turno.id"
              class="flex flex-wrap gap-x-2 py-0.5"
            >
              <span class="tabular-nums text-muted">#{{ turno.id }}</span>
              <span class="font-semibold text-ink">{{ turno.alumno }}</span>
              <span class="text-muted"
                >{{ formatearFechaCorta(turno.fecha) }}, {{ turno.inicio }} a
                {{ turno.fin }}</span
              >
            </li>
          </ul>

          <label :class="[ETIQUETA, 'flex-1']">
            Motivo (opcional)
            <input
              v-model="motivo"
              :class="[CAMPO, 'text-tiny']"
              maxlength="255"
              placeholder="Se suspendió la actividad"
              type="text"
            />
          </label>
          <button
            :class="BOTON_SUAVE"
            type="button"
            @click="confirmando = false"
          >
            Volver
          </button>
          <button
            :class="[BOTON, 'bg-estado-cancelado text-white']"
            :disabled="cancelando"
            type="submit"
          >
            Confirmar cancelación de {{ seleccionados.length }}
          </button>
        </form>

        <GrillaTurnos
          :hay-seleccionables="cancelablesVisibles.length > 0"
          :seleccionados="seleccionados"
          :pagina-elegida="paginaElegida"
          :turnos="visibles"
          @alternar="alternar"
          @alternar-pagina="alternarPagina"
        />

        <div
          v-if="encontrados.length"
          class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted"
        >
          <span
            >Mostrando {{ desde }}–{{ hasta }} de
            {{ encontrados.length }}
            {{ encontrados.length === 1 ? "turno" : "turnos" }}</span
          >
          <div v-if="totalPaginas > 1" class="flex items-center gap-2">
            <button
              :class="PAGINA"
              :disabled="pagina === 1"
              type="button"
              @click="irAPagina(pagina - 1)"
            >
              Anterior
            </button>
            <span class="tabular-nums"
              >Página {{ pagina }} de {{ totalPaginas }}</span
            >
            <button
              :class="PAGINA"
              :disabled="pagina === totalPaginas"
              type="button"
              @click="irAPagina(pagina + 1)"
            >
              Siguiente
            </button>
          </div>
        </div>
      </template>
    </div>
  </main>
</template>
