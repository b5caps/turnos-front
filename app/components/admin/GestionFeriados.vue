<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useFeriados } from "~/composables/useFeriados";
import {
  BOTON_PRIMARIO,
  BOTON_SUAVE,
  CAMPO,
  ETIQUETA,
} from "~/constants/estilos";
import { formatearFechaLarga, hoyIso } from "~/constants/horarios";
import type { Feriado } from "~/services/feriados";

const {
  feriados,
  cargando,
  guardando,
  fuente,
  avisoFallback,
  errorMessage,
  aviso,
  cargar,
  crear,
  actualizar,
  eliminar,
} = useFeriados();

const mostrandoFormNuevo = ref(false);
const nuevaFecha = ref(hoyIso());
const nuevoNombre = ref("");
const errorValidacion = ref("");

// Estado para edición
const editandoFechaOriginal = ref<string | null>(null);
const editFecha = ref("");
const editNombre = ref("");

function iniciarEdicion(f: Feriado) {
  editandoFechaOriginal.value = f.fecha;
  editFecha.value = f.fecha;
  editNombre.value = f.nombre;
  errorValidacion.value = "";
}

function cancelarEdicion() {
  editandoFechaOriginal.value = null;
  editFecha.value = "";
  editNombre.value = "";
  errorValidacion.value = "";
}

async function guardarEdicion() {
  errorValidacion.value = "";
  if (!editandoFechaOriginal.value) return;

  if (!editFecha.value || !/^\d{4}-\d{2}-\d{2}$/.test(editFecha.value)) {
    errorValidacion.value = "Ingresá una fecha válida en formato YYYY-MM-DD.";
    return;
  }
  if (!editNombre.value.trim()) {
    errorValidacion.value = "El nombre del feriado no puede estar vacío.";
    return;
  }

  const exito = await actualizar(
    editandoFechaOriginal.value,
    editFecha.value,
    editNombre.value.trim(),
  );

  if (exito) {
    cancelarEdicion();
  }
}

async function agregarFeriado() {
  errorValidacion.value = "";

  if (!nuevaFecha.value || !/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha.value)) {
    errorValidacion.value = "Ingresá una fecha válida en formato YYYY-MM-DD.";
    return;
  }
  if (!nuevoNombre.value.trim()) {
    errorValidacion.value = "El nombre del feriado no puede estar vacío.";
    return;
  }

  const exito = await crear(nuevaFecha.value, nuevoNombre.value.trim());

  if (exito) {
    nuevoNombre.value = "";
    nuevaFecha.value = hoyIso();
    mostrandoFormNuevo.value = false;
  }
}

function fechaLegible(fechaStr: string) {
  const formateada = formatearFechaLarga(fechaStr);
  const anio = fechaStr.slice(0, 4);
  return `${formateada}, ${anio}`;
}

onMounted(cargar);
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Encabezado de la sección -->
    <div
      class="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4"
    >
      <div>
        <h2 class="m-0 text-xl font-bold tracking-tight text-ink">
          Feriados y Días No Laborables
        </h2>
        <p class="mt-1 mb-0 text-xs text-muted">
          Sincronizado con la API pública de feriados nacionales argentinos para
          el año en curso y el próximo. Los días marcados inhabilitan turnos en
          el calendario de reservas.
        </p>
      </div>

      <button
        v-if="!mostrandoFormNuevo"
        :class="BOTON_PRIMARIO"
        type="button"
        @click="mostrandoFormNuevo = true"
      >
        <svg
          class="size-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Agregar feriado</span>
      </button>
    </div>

    <!-- Aviso discreto de fallback si se usa caché o mock -->
    <div
      v-if="avisoFallback"
      class="flex items-center gap-2.5 rounded-xl border border-line bg-paper px-5 py-3 text-tiny text-muted"
    >
      <svg
        class="size-4 shrink-0 text-faint"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
      <span>{{ avisoFallback }}</span>
    </div>

    <!-- Alertas globales -->
    <p
      v-if="aviso"
      class="rounded-xl bg-estado-activo-suave px-5 py-3 text-tiny font-medium text-estado-activo"
    >
      {{ aviso }}
    </p>

    <p
      v-if="errorValidacion"
      class="m-0 rounded-lg bg-estado-cancelado-suave px-4 py-2.5 text-xs font-semibold text-estado-cancelado"
    >
      {{ errorValidacion }}
    </p>

    <div
      v-if="errorMessage"
      class="flex items-center justify-between rounded-xl bg-estado-cancelado-suave px-5 py-3 text-tiny text-estado-cancelado"
    >
      <span>{{ errorMessage }}</span>
      <button :class="BOTON_SUAVE" type="button" @click="cargar">
        Reintentar
      </button>
    </div>

    <!-- Formulario para Agregar Feriado Manual -->
    <form
      v-if="mostrandoFormNuevo"
      class="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-card"
      @submit.prevent="agregarFeriado"
    >
      <div class="flex items-center justify-between border-b border-line pb-3">
        <div>
          <h3 class="m-0 text-base font-bold text-ink">
            Nuevo feriado institucional o asueto
          </h3>
          <p class="mt-0.5 mb-0 text-mini text-muted">
            Este feriado se registrará con origen <strong>MANUAL</strong> y no
            permitirá generar reservas para esa fecha.
          </p>
        </div>
        <button
          :class="BOTON_SUAVE"
          type="button"
          @click="mostrandoFormNuevo = false"
        >
          Cancelar
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4 tablet:grid-cols-2">
        <label :class="ETIQUETA">
          Fecha del feriado
          <input v-model="nuevaFecha" :class="CAMPO" required type="date" />
        </label>

        <label :class="ETIQUETA">
          Nombre o motivo
          <input
            v-model="nuevoNombre"
            :class="CAMPO"
            maxlength="120"
            placeholder="Ej: Día del Estudiante, Asueto patronal..."
            required
            type="text"
          />
        </label>
      </div>

      <div class="flex items-center justify-end gap-3 pt-2">
        <button
          :class="BOTON_SUAVE"
          type="button"
          @click="mostrandoFormNuevo = false"
        >
          Descartar
        </button>
        <button :class="BOTON_PRIMARIO" :disabled="guardando" type="submit">
          {{ guardando ? "Guardando..." : "Guardar feriado" }}
        </button>
      </div>
    </form>

    <!-- Modal / Formulario de Edición de Feriado -->
    <div
      v-if="editandoFechaOriginal"
      class="flex flex-col gap-4 rounded-2xl border border-line bg-conditions p-6 shadow-card"
    >
      <div
        class="flex items-center justify-between border-b border-coral/30 pb-3"
      >
        <div>
          <h3 class="m-0 text-base font-bold text-ink">Modificar feriado</h3>
          <p class="mt-0.5 mb-0 text-mini text-coral-dark">
            Al editar este feriado, su origen quedará fijado como
            <strong>MANUAL</strong>.
          </p>
        </div>
        <button :class="BOTON_SUAVE" type="button" @click="cancelarEdicion">
          Cancelar
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4 tablet:grid-cols-2">
        <label :class="ETIQUETA">
          Fecha
          <input v-model="editFecha" :class="CAMPO" required type="date" />
        </label>

        <label :class="ETIQUETA">
          Nombre
          <input
            v-model="editNombre"
            :class="CAMPO"
            maxlength="120"
            required
            type="text"
          />
        </label>
      </div>

      <div class="flex items-center justify-end gap-3 pt-2">
        <button :class="BOTON_SUAVE" type="button" @click="cancelarEdicion">
          Descartar
        </button>
        <button
          :class="BOTON_PRIMARIO"
          :disabled="guardando"
          type="button"
          @click="guardarEdicion"
        >
          {{ guardando ? "Guardando..." : "Guardar cambios" }}
        </button>
      </div>
    </div>

    <!-- Lista de Feriados -->
    <div class="rounded-2xl border border-line bg-white p-6 shadow-card">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="m-0 text-base font-bold text-ink">
            Feriados registrados ({{ feriados.length }})
          </h3>
          <p class="mt-0.5 mb-0 text-mini text-muted">
            Año en curso y próximo año
          </p>
        </div>

        <button
          :class="BOTON_SUAVE"
          :disabled="cargando"
          type="button"
          @click="cargar"
        >
          Actualizar lista
        </button>
      </div>

      <p v-if="cargando" class="py-10 text-center text-xs text-muted">
        Cargando feriados…
      </p>

      <div
        v-else-if="!feriados.length"
        class="py-12 text-center text-xs text-muted"
      >
        <p class="m-0">No hay feriados cargados actualmente.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              class="border-b border-line text-micro tracking-wider uppercase text-muted"
            >
              <th class="py-3 px-3">Fecha</th>
              <th class="py-3 px-3">Nombre</th>
              <th class="py-3 px-3">Origen</th>
              <th class="py-3 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr
              v-for="f in feriados"
              :key="f.fecha"
              class="hover:bg-paper/50 transition-colors"
            >
              <td class="py-3 px-3 font-semibold text-ink whitespace-nowrap">
                {{ fechaLegible(f.fecha) }}
              </td>

              <td class="py-3 px-3 text-ink">
                {{ f.nombre }}
              </td>

              <td class="py-3 px-3">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-micro font-bold',
                    f.origen === 'MANUAL'
                      ? 'bg-mint text-forest-deep'
                      : 'bg-notebook text-notebook-ink',
                  ]"
                >
                  {{ f.origen }}
                </span>
              </td>

              <td class="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                <button
                  :class="BOTON_SUAVE"
                  :disabled="guardando"
                  type="button"
                  @click="iniciarEdicion(f)"
                >
                  Modificar
                </button>
                <button
                  class="cursor-pointer text-xs font-semibold text-danger hover:underline disabled:opacity-50"
                  :disabled="guardando"
                  type="button"
                  @click="eliminar(f.fecha)"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
