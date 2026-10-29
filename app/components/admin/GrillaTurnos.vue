<script setup lang="ts">
import { ESTADO_SUAVE } from "~/constants/estilos";
import { formatearFechaLarga } from "~/constants/horarios";
import type { EstadoTurno, Turno } from "~/types/admin";

defineProps<{ turnos: Turno[] }>();

const ETIQUETA: Record<EstadoTurno, string> = {
  pendiente: "Pendiente",
  activo: "Activo",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const ENCABEZADO =
  "bg-hairline px-6 py-3.5 text-left text-tiny font-bold tracking-wider uppercase";
const CELDA = "px-6 py-4 align-middle";
</script>

<template>
  <div
    class="overflow-x-auto rounded-xl border border-line bg-white shadow-card"
  >
    <table class="w-full border-collapse text-sm">
      <caption class="sr-only">
        Turnos de la biblioteca
      </caption>
      <thead>
        <tr>
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
          class="border-t border-hairline transition-colors hover:bg-paper"
        >
          <td :class="[CELDA, 'tabular-nums text-muted']">#{{ turno.id }}</td>
          <td :class="[CELDA, 'font-semibold text-ink']">
            {{ turno.alumno }}
          </td>
          <td :class="[CELDA, 'whitespace-nowrap text-ink']">
            {{ formatearFechaLarga(turno.fecha) }}
          </td>
          <td :class="[CELDA, 'tabular-nums whitespace-nowrap text-ink']">
            {{ turno.inicio }} a {{ turno.fin }}
          </td>
          <td :class="CELDA">
            <span
              v-if="turno.conNotebook"
              :class="[
                ESTADO_SUAVE.notebook,
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-mini font-bold',
              ]"
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
            <span
              :class="[
                ESTADO_SUAVE[turno.estado],
                'inline-block rounded-full px-3 py-1.5 text-mini font-bold whitespace-nowrap',
              ]"
              >{{ ETIQUETA[turno.estado] }}</span
            >
          </td>
        </tr>
      </tbody>
    </table>

    <p
      v-if="!turnos.length"
      class="m-0 px-6 py-14 text-center text-sm text-muted"
    >
      No hay turnos que coincidan con este filtro.
    </p>
  </div>
</template>
