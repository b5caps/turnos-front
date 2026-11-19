<script setup lang="ts">
import { ESTADO_SUAVE } from "~/constants/estilos";
import { formatearFechaCorta } from "~/constants/horarios";
import type { CausaCancelacion, EstadoTurno, Turno } from "~/types/admin";

defineProps<{
  turnos: Turno[];
  seleccionados: number[];
  paginaElegida: boolean;
  haySeleccionables: boolean;
}>();
const emit = defineEmits<{ alternar: [id: number]; alternarPagina: [] }>();

const CASILLA =
  "size-4 cursor-pointer accent-estado-cancelado disabled:cursor-not-allowed disabled:opacity-35";

const ETIQUETA: Record<EstadoTurno, string> = {
  pendiente: "Programado",
  activo: "Activo",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const CAUSA: Record<CausaCancelacion, string> = {
  USUARIO: "por el alumno",
  ADMINISTRADOR: "por un administrador",
  AUSENCIA: "por ausencia",
};

const ENCABEZADO =
  "bg-hairline px-6 py-3.5 text-left text-tiny font-bold tracking-wider uppercase";
const CELDA = "px-6 py-4 align-middle";
const INSIGNIA =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-mini font-bold whitespace-nowrap";
</script>

<template>
  <div class="rounded-xl border border-line bg-white shadow-card">
    <div class="overflow-x-auto max-tablet:hidden">
      <table class="w-full border-collapse text-sm">
        <caption class="sr-only">
          Turnos de la biblioteca
        </caption>
        <thead>
          <tr>
            <th :class="[ENCABEZADO, 'w-12']" scope="col">
              <span class="sr-only">Seleccionar página</span>
              <input
                aria-label="Seleccionar los turnos de esta página"
                :checked="paginaElegida"
                :class="CASILLA"
                :disabled="!haySeleccionables"
                type="checkbox"
                @change="emit('alternarPagina')"
              />
            </th>
            <th :class="[ENCABEZADO, 'w-20']" scope="col">ID</th>
            <th :class="ENCABEZADO" scope="col">Alumno</th>
            <th :class="ENCABEZADO" scope="col">Día</th>
            <th :class="ENCABEZADO" scope="col">Horario</th>
            <th :class="ENCABEZADO" scope="col">Notebook</th>
            <th :class="ENCABEZADO" scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="turno in turnos"
            :key="turno.id"
            :class="[
              'border-t border-hairline transition-colors',
              seleccionados.includes(turno.id) ? 'bg-paper' : 'hover:bg-paper',
            ]"
          >
            <td :class="CELDA">
              <input
                :aria-label="`Seleccionar el turno de ${turno.alumno}`"
                :checked="seleccionados.includes(turno.id)"
                :class="CASILLA"
                :disabled="!turno.cancelable"
                type="checkbox"
                @change="emit('alternar', turno.id)"
              />
            </td>
            <td :class="[CELDA, 'tabular-nums text-muted']">#{{ turno.id }}</td>
            <td :class="[CELDA, 'font-semibold text-ink']">
              {{ turno.alumno }}
            </td>
            <td :class="[CELDA, 'whitespace-nowrap text-ink']">
              {{ formatearFechaCorta(turno.fecha) }}
            </td>
            <td :class="[CELDA, 'tabular-nums whitespace-nowrap text-ink']">
              {{ turno.inicio }} a {{ turno.fin }}
            </td>
            <td :class="CELDA">
              <span
                v-if="turno.conNotebook"
                :class="[ESTADO_SUAVE.notebook, INSIGNIA]"
              >
                <svg
                  aria-hidden="true"
                  class="size-3"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 5h18v11H3zM2 20h20" />
                </svg>
                Sí
              </span>
              <span v-else class="text-muted">No</span>
            </td>
            <td :class="CELDA">
              <span :class="[ESTADO_SUAVE[turno.estado], INSIGNIA]">{{
                ETIQUETA[turno.estado]
              }}</span>
              <span
                v-if="turno.causaCancelacion"
                class="mt-1 block text-mini text-muted"
                >{{ CAUSA[turno.causaCancelacion] }}</span
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="turnos.length" class="tablet:hidden">
      <div
        class="flex items-center gap-3 border-b border-hairline bg-hairline px-4 py-3"
      >
        <input
          aria-label="Seleccionar los turnos de esta página"
          :checked="paginaElegida"
          :class="CASILLA"
          :disabled="!haySeleccionables"
          type="checkbox"
          @change="emit('alternarPagina')"
        />
        <span class="text-mini font-bold tracking-wider text-muted uppercase">
          Seleccionar página
        </span>
      </div>

      <ul class="m-0 list-none divide-y divide-hairline p-0">
        <li
          v-for="turno in turnos"
          :key="turno.id"
          :class="[
            'flex items-start gap-3 px-4 py-3.5',
            seleccionados.includes(turno.id) ? 'bg-paper' : '',
          ]"
        >
          <input
            :aria-label="`Seleccionar el turno de ${turno.alumno}`"
            :checked="seleccionados.includes(turno.id)"
            :class="[CASILLA, 'mt-1 shrink-0']"
            :disabled="!turno.cancelable"
            type="checkbox"
            @change="emit('alternar', turno.id)"
          />

          <div class="flex min-w-0 flex-1 flex-col gap-1.5">
            <div class="flex items-start justify-between gap-2">
              <span class="text-xs font-semibold break-words text-ink">
                {{ turno.alumno }}
              </span>
              <span
                :class="[ESTADO_SUAVE[turno.estado], INSIGNIA, 'shrink-0']"
                >{{ ETIQUETA[turno.estado] }}</span
              >
            </div>

            <span
              v-if="turno.causaCancelacion"
              class="text-right text-mini text-muted"
              >{{ CAUSA[turno.causaCancelacion] }}</span
            >

            <div
              class="flex flex-wrap items-center gap-x-3 gap-y-1 text-mini text-muted"
            >
              <span class="tabular-nums">#{{ turno.id }}</span>
              <span>{{ formatearFechaCorta(turno.fecha) }}</span>
              <span class="font-semibold text-ink tabular-nums">
                {{ turno.inicio }} a {{ turno.fin }}
              </span>
            </div>

            <span
              v-if="turno.conNotebook"
              :class="[ESTADO_SUAVE.notebook, INSIGNIA, 'w-fit']"
            >
              <svg
                aria-hidden="true"
                class="size-3"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path d="M3 5h18v11H3zM2 20h20" />
              </svg>
              Notebook
            </span>
          </div>
        </li>
      </ul>
    </div>

    <p
      v-if="!turnos.length"
      class="m-0 px-6 py-14 text-center text-sm text-muted max-tablet:px-4 max-tablet:py-10 max-tablet:text-xs"
    >
      No hay turnos que coincidan con este filtro.
    </p>
  </div>
</template>
