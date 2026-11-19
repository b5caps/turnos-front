<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import SelectorFecha from "~/components/disponibilidad/SelectorFecha.vue";
import { useBloqueosAdmin } from "~/composables/useBloqueosAdmin";
import {
  BOTON,
  BOTON_PRIMARIO,
  BOTON_SUAVE,
  CAMPO,
  ETIQUETA,
} from "~/constants/estilos";
import {
  aIsoConZona,
  formatearFechaCorta,
  partesDeIso,
} from "~/constants/horarios";
import type { CrearBloqueoInput } from "~/services/bloqueos";

const props = withDefaults(
  defineProps<{
    fechaInicial?: string;
  }>(),
  {
    fechaInicial: "",
  },
);

const emit = defineEmits<{
  volver: [];
}>();

const {
  bloqueos,
  bloqueosDelDia,
  salas,
  cargando,
  guardando,
  errorMessage,
  aviso,
  fechaSeleccionada,
  esHoy,
  irAFecha,
  moverDias,
  irAHoy,
  cargar,
  crear,
  eliminar,
  obtenerNombreSala,
  verificarReservasAfectadas,
} = useBloqueosAdmin();

watch(
  () => props.fechaInicial,
  (nueva) => {
    if (nueva) irAFecha(nueva);
  },
  { immediate: true },
);

const mostrandoFormulario = ref(false);

// Formulario reactivo
const salaSeleccionada = ref<string>(""); // "" = Todas las salas
const diaCompleto = ref<boolean>(true);
const fechaHasta = ref<string>("");
const horaInicio = ref<string>("10:00");
const horaFin = ref<string>("22:00");
const esIndefinido = ref<boolean>(false);
const motivo = ref<string>("");

// Detección de reservas afectadas
const reservasEnRango = ref(0);
const errorValidacion = ref("");

function resetForm() {
  salaSeleccionada.value = "";
  diaCompleto.value = true;
  fechaHasta.value = "";
  horaInicio.value = "10:00";
  horaFin.value = "22:00";
  esIndefinido.value = false;
  motivo.value = "";
  errorValidacion.value = "";
  reservasEnRango.value = 0;
  mostrandoFormulario.value = false;
}

// Abrir formulario configurado para día completo para todas las salas (Atajo)
function abrirDiaCompletoTodasLasSalas() {
  salaSeleccionada.value = "";
  diaCompleto.value = true;
  fechaHasta.value = fechaSeleccionada.value;
  horaInicio.value = "10:00";
  horaFin.value = "22:00";
  esIndefinido.value = false;
  motivo.value = "";
  mostrandoFormulario.value = true;
  comprobarReservas();
}

async function comprobarReservas() {
  errorValidacion.value = "";
  const hIni = diaCompleto.value ? "10:00" : horaInicio.value;
  const hFin = diaCompleto.value ? "22:00" : horaFin.value;

  if (!diaCompleto.value && !esIndefinido.value && hFin <= hIni) {
    reservasEnRango.value = 0;
    return;
  }

  const rId =
    salaSeleccionada.value === "" ? null : Number(salaSeleccionada.value);
  reservasEnRango.value = await verificarReservasAfectadas(hIni, hFin, rId);
}

// Vigilar cambios en los campos del formulario para recalcular reservas afectadas
watch(
  [
    salaSeleccionada,
    diaCompleto,
    horaInicio,
    horaFin,
    esIndefinido,
    fechaSeleccionada,
  ],
  () => {
    if (mostrandoFormulario.value) {
      comprobarReservas();
    }
  },
);

async function guardarBloqueo() {
  errorValidacion.value = "";

  const motivoLimpio = motivo.value.trim();
  if (!motivoLimpio) {
    errorValidacion.value = "Por favor ingresá un motivo para el bloqueo.";
    return;
  }
  if (motivoLimpio.length > 255) {
    errorValidacion.value = "El motivo no puede superar los 255 caracteres.";
    return;
  }

  const espacioId =
    salaSeleccionada.value === "" ? null : Number(salaSeleccionada.value);

  let input: CrearBloqueoInput;

  if (diaCompleto.value) {
    const fHasta = fechaHasta.value || fechaSeleccionada.value;
    if (fHasta < fechaSeleccionada.value) {
      errorValidacion.value =
        "La fecha final no puede ser anterior a la inicial.";
      return;
    }

    input = {
      tipo: "DIAS_COMPLETOS",
      fechaDesde: fechaSeleccionada.value,
      fechaHasta: fHasta,
      motivo: motivoLimpio,
    };
  } else {
    if (!esIndefinido.value && horaFin.value <= horaInicio.value) {
      errorValidacion.value =
        "La hora de fin debe ser posterior a la de inicio.";
      return;
    }

    input = {
      tipo: "FRANJA",
      fechaHoraInicio: aIsoConZona(fechaSeleccionada.value, horaInicio.value),
      fechaHoraFin: esIndefinido.value
        ? null
        : aIsoConZona(fechaSeleccionada.value, horaFin.value),
      motivo: motivoLimpio,
    };
  }

  const exito = await crear(espacioId, input);
  if (exito) {
    resetForm();
  }
}

function formatearRango(inicioIso: string, finIso: string | null) {
  const hIni = partesDeIso(inicioIso).hora;
  if (!finIso) {
    return `Desde ${hIni} hs (Indefinido)`;
  }
  const hFin = partesDeIso(finIso).hora;

  if (
    (hIni === "00:00" && hFin === "23:59") ||
    (hIni === "10:00" && hFin === "22:00")
  ) {
    return "Día completo";
  }
  return `${hIni} a ${hFin} hs`;
}

onMounted(async () => {
  await cargar();
  comprobarReservas();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Botón de retorno al calendario si se ingresó desde un día específico -->
    <div v-if="props.fechaInicial" class="flex items-center">
      <button
        type="button"
        :class="[
          BOTON_SUAVE,
          'inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:underline p-0',
        ]"
        @click="emit('volver')"
      >
        <svg
          class="size-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span>← Volver al calendario mensual</span>
      </button>
    </div>

    <!-- Panel del día seleccionado -->
    <div
      class="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-card"
    >
      <div
        class="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4"
      >
        <div>
          <h2 class="m-0 text-xl font-bold tracking-tight text-ink">
            Gestión por Día
          </h2>
          <p class="mt-1 mb-0 text-xs text-muted">
            Seleccioná un día del calendario para revisar, crear o eliminar
            bloqueos de disponibilidad.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            v-if="!mostrandoFormulario"
            :class="BOTON_SUAVE"
            type="button"
            @click="abrirDiaCompletoTodasLasSalas"
          >
            Bloquear día completo
          </button>
          <button
            v-if="!mostrandoFormulario"
            :class="BOTON_PRIMARIO"
            type="button"
            @click="
              mostrandoFormulario = true;
              comprobarReservas();
            "
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
            <span>Nuevo bloqueo</span>
          </button>
        </div>
      </div>

      <!-- Selector de Fecha Reutilizado -->
      <SelectorFecha
        :deshabilitado="cargando"
        :es-hoy="esHoy"
        :fecha="fechaSeleccionada"
        @hoy="irAHoy"
        @mover="moverDias"
        @update:fecha="irAFecha"
      />
    </div>

    <!-- Alertas globales -->
    <p
      v-if="aviso"
      class="rounded-xl bg-estado-activo-suave px-5 py-3 text-tiny font-medium text-estado-activo"
    >
      {{ aviso }}
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

    <!-- Formulario de Creación de Bloqueo -->
    <form
      v-if="mostrandoFormulario"
      class="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-card"
      @submit.prevent="guardarBloqueo"
    >
      <div class="flex items-center justify-between border-b border-line pb-3">
        <div>
          <h3 class="m-0 text-base font-bold text-ink">
            Bloquear disponibilidad en
            {{ formatearFechaCorta(fechaSeleccionada) }}
          </h3>
          <p class="mt-0.5 mb-0 text-mini text-muted">
            Configurá el alcance y el tipo de bloqueo para este día.
          </p>
        </div>
        <button :class="BOTON_SUAVE" type="button" @click="resetForm">
          Cancelar
        </button>
      </div>

      <!-- Error local de validación -->
      <p
        v-if="errorValidacion"
        class="m-0 rounded-lg bg-estado-cancelado-suave px-4 py-2.5 text-xs font-semibold text-estado-cancelado"
      >
        {{ errorValidacion }}
      </p>

      <!-- Selector de Sala / Alcance -->
      <div class="grid grid-cols-1 gap-4">
        <label :class="ETIQUETA">
          Alcance del bloqueo
          <select
            v-model="salaSeleccionada"
            :class="CAMPO"
            @change="comprobarReservas"
          >
            <option value="">Todas las salas activas</option>
            <option v-for="sala in salas" :key="sala.id" :value="sala.id">
              {{ sala.identificador }} (Capacidad:
              {{ sala.capacidad }} personas)
            </option>
          </select>
        </label>
      </div>

      <!-- Configuración de Horario (Días completos vs Franja horaria) -->
      <div
        class="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4"
      >
        <div class="flex flex-wrap items-center gap-6">
          <label
            class="flex items-center gap-2.5 text-xs font-semibold text-ink cursor-pointer"
          >
            <input
              v-model="diaCompleto"
              class="size-4 rounded accent-forest"
              :value="true"
              type="radio"
              :name="'modalidad'"
              @change="comprobarReservas"
            />
            <span>Días completos</span>
          </label>

          <label
            class="flex items-center gap-2.5 text-xs font-semibold text-ink cursor-pointer"
          >
            <input
              v-model="diaCompleto"
              class="size-4 rounded accent-forest"
              :value="false"
              type="radio"
              :name="'modalidad'"
              @change="comprobarReservas"
            />
            <span>Franja horaria</span>
          </label>
        </div>

        <!-- Opciones de Días completos -->
        <div
          v-if="diaCompleto"
          class="grid grid-cols-2 gap-4 border-t border-line/60 pt-3 max-tablet:grid-cols-1"
        >
          <label :class="ETIQUETA">
            Fecha desde
            <input
              :value="fechaSeleccionada"
              :class="CAMPO"
              disabled
              type="date"
            />
          </label>
          <label :class="ETIQUETA">
            Fecha hasta (inclusive)
            <input
              v-model="fechaHasta"
              :class="CAMPO"
              :min="fechaSeleccionada"
              type="date"
              @change="comprobarReservas"
            />
          </label>
        </div>

        <!-- Opciones de Franja horaria -->
        <div v-else class="flex flex-col gap-3 border-t border-line/60 pt-3">
          <div class="grid grid-cols-2 gap-4 max-tablet:grid-cols-1">
            <label :class="ETIQUETA">
              Hora de inicio
              <input
                v-model="horaInicio"
                :class="CAMPO"
                required
                step="900"
                type="time"
                @change="comprobarReservas"
              />
            </label>
            <label :class="ETIQUETA">
              Hora de fin
              <input
                v-model="horaFin"
                :class="CAMPO"
                :disabled="esIndefinido"
                required
                step="900"
                type="time"
                @change="comprobarReservas"
              />
            </label>
          </div>

          <label
            class="flex items-center gap-2 text-xs text-muted cursor-pointer"
          >
            <input
              v-model="esIndefinido"
              type="checkbox"
              class="size-3.5 rounded accent-forest"
              @change="comprobarReservas"
            />
            <span>Bloqueo indefinido (sin horario de fin definido)</span>
          </label>
        </div>
      </div>

      <!-- Motivo Obligatorio (1 a 255 caracteres en backend) -->
      <label :class="ETIQUETA">
        Motivo del bloqueo *
        <input
          v-model="motivo"
          :class="CAMPO"
          maxlength="255"
          placeholder="Ej: Semana del museo, Feriado institucional, Mantenimiento..."
          required
          type="text"
        />
      </label>

      <!-- Aviso de Reservas Existentes en el Rango -->
      <div
        v-if="reservasEnRango > 0"
        class="rounded-xl border border-coral/40 bg-conditions p-4 text-xs text-coral-dark"
      >
        <div class="flex items-start gap-2.5">
          <svg
            class="size-4 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
            />
            <line x1="12" x2="12" y1="9" y2="13" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
          </svg>
          <div>
            <strong class="font-bold">Atención:</strong> Hay
            {{ reservasEnRango }} reserva(s) existente(s) en este rango. Las
            reservas existentes se mantienen.
          </div>
        </div>
      </div>

      <!-- Acciones del Formulario -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <button :class="BOTON_SUAVE" type="button" @click="resetForm">
          Descartar
        </button>
        <button :class="BOTON_PRIMARIO" :disabled="guardando" type="submit">
          {{ guardando ? "Guardando..." : "Confirmar bloqueo" }}
        </button>
      </div>
    </form>

    <!-- Lista de Bloqueos del Día Seleccionado -->
    <div class="rounded-2xl border border-line bg-white p-6 shadow-card">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="m-0 text-base font-bold text-ink">
            Bloqueos del día: {{ formatearFechaCorta(fechaSeleccionada) }}
          </h3>
          <p class="mt-0.5 mb-0 text-mini text-muted">
            {{ bloqueosDelDia.length }}
            {{
              bloqueosDelDia.length === 1
                ? "bloqueo registrado"
                : "bloqueos registrados"
            }}
          </p>
        </div>

        <button
          :class="BOTON_SUAVE"
          :disabled="cargando"
          type="button"
          @click="cargar"
        >
          Actualizar
        </button>
      </div>

      <p v-if="cargando" class="py-10 text-center text-xs text-muted">
        Cargando bloqueos…
      </p>

      <div
        v-else-if="!bloqueosDelDia.length"
        class="py-12 text-center text-xs text-muted"
      >
        <p class="m-0">
          No hay bloqueos registrados para este día. Las salas se encuentran
          disponibles en su horario habitual.
        </p>
      </div>

      <div v-else>
        <div class="overflow-x-auto max-tablet:hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                class="border-b border-line text-micro tracking-wider uppercase text-muted"
              >
                <th class="py-3 px-3">Sala</th>
                <th class="py-3 px-3">Horario</th>
                <th class="py-3 px-3">Motivo</th>
                <th class="py-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr
                v-for="b in bloqueosDelDia"
                :key="b.id"
                class="hover:bg-paper/50 transition-colors"
              >
                <td class="py-3 px-3 font-semibold text-ink">
                  {{ obtenerNombreSala(b.recursoId) }}
                </td>

                <td class="py-3 px-3 text-ink">
                  {{ formatearRango(b.fechaHoraInicio, b.fechaHoraFin) }}
                </td>

                <td
                  class="py-3 px-3 text-muted max-w-xs truncate"
                  :title="b.motivo"
                >
                  {{ b.motivo }}
                </td>

                <td class="py-3 px-3 text-right whitespace-nowrap">
                  <button
                    class="cursor-pointer text-xs font-semibold text-danger hover:underline disabled:opacity-50"
                    :disabled="guardando"
                    type="button"
                    @click="eliminar(b.id)"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul class="m-0 list-none divide-y divide-line p-0 tablet:hidden">
          <li
            v-for="b in bloqueosDelDia"
            :key="b.id"
            class="flex flex-col gap-1.5 py-3"
          >
            <div class="flex items-start justify-between gap-3">
              <span class="text-xs font-semibold break-words text-ink">
                {{ obtenerNombreSala(b.recursoId) }}
              </span>
              <span class="shrink-0 text-xs text-ink">
                {{ formatearRango(b.fechaHoraInicio, b.fechaHoraFin) }}
              </span>
            </div>

            <p class="m-0 text-micro break-words text-muted">{{ b.motivo }}</p>

            <button
              class="w-fit cursor-pointer text-xs font-semibold text-danger hover:underline disabled:opacity-50"
              :disabled="guardando"
              type="button"
              @click="eliminar(b.id)"
            >
              Eliminar
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
