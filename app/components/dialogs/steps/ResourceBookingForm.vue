<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import EstadoDisponibilidad from "~/components/disponibilidad/EstadoDisponibilidad.vue";
import FiltroSalas from "~/components/disponibilidad/FiltroSalas.vue";
import GrillaDisponibilidad from "~/components/disponibilidad/GrillaDisponibilidad.vue";
import SelectorFecha from "~/components/disponibilidad/SelectorFecha.vue";
import { useGrebAuth } from "~/composables/useGrebAuth";
import {
  ACCIONES,
  BOTON_PRIMARIO,
  BOTON_SUAVE,
  ERROR,
  FLECHA_BOTON,
} from "~/constants/estilos";
import {
  BLOQUE_MINUTOS,
  etiquetaDuracion,
  formatearFechaLarga,
  horaAMinutos,
  minutosAHora,
} from "~/constants/horarios";
import type { ReservaConfirmada } from "~/api/reservas";
import type { ResourceBooking } from "~/types";

const props = defineProps<{
  modelValue: ResourceBooking;
  completed?: boolean;
  error?: string;
  loading?: boolean;
  reserva?: ReservaConfirmada | null;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: ResourceBooking];
  submit: [];
  back: [];
  nuevaReserva: [];
}>();

const { bookingExpiresAt, bookingCompleted } = useGrebAuth();

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
  duracionesPosibles,
  notebooksEnVentana,
} = useDisponibilidad();

const seleccion = ref<{ recursoId: number; inicio: string } | null>(null);
const duracion = ref(0);

const duraciones = computed(() =>
  seleccion.value
    ? duracionesPosibles(seleccion.value.recursoId, seleccion.value.inicio)
    : [],
);
const salaElegida = computed(
  () =>
    salas.value.find((sala) => sala.id === seleccion.value?.recursoId) ?? null,
);
const fin = computed(() =>
  seleccion.value && duracion.value
    ? minutosAHora(horaAMinutos(seleccion.value.inicio) + duracion.value)
    : "",
);
const notebooksLibres = computed(() =>
  seleccion.value
    ? notebooksEnVentana(seleccion.value.inicio, duracion.value)
    : 0,
);
const listo = computed(() => Boolean(salaElegida.value && duracion.value));

// Temporizador
const segundosRestantes = ref(300);
const haExpirado = ref(false);
let timerId: ReturnType<typeof setInterval> | null = null;

const timerActivo = computed(
  () => Boolean(seleccion.value) && !haExpirado.value,
);

const tiempoFormateado = computed(() => {
  const minutos = Math.floor(segundosRestantes.value / 60);
  const seg = segundosRestantes.value % 60;
  return `${String(minutos).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
});

function detenerTemporizador() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function iniciarTemporizador() {
  detenerTemporizador();
  segundosRestantes.value = 300;
  haExpirado.value = false;
  bookingExpiresAt.value = Date.now() + 300 * 1000;
  timerId = setInterval(() => {
    segundosRestantes.value -= 1;
    if (segundosRestantes.value <= 0) {
      detenerTemporizador();
      haExpirado.value = true;
      seleccion.value = null;
      duracion.value = 0;
      sincronizar();
      bookingExpiresAt.value = Date.now() - 1000;
    }
  }, 1000);
}

function volverAtras() {
  detenerTemporizador();
  bookingExpiresAt.value = null;
  emit("back");
}

function iniciarNuevaReserva() {
  seleccion.value = null;
  duracion.value = 0;
  bookingCompleted.value = false;
  detenerTemporizador();
  segundosRestantes.value = 300;
  haExpirado.value = false;
  bookingExpiresAt.value = null;
  emit("update:modelValue", {
    ...props.modelValue,
    resource: "",
    resourceId: 0,
    startTime: "",
    endTime: "",
    wantsComputer: false,
    computerConditionsAccepted: false,
  });
  emit("nuevaReserva");
}

const SELECT =
  "w-auto cursor-pointer border border-line bg-white px-3 py-2 text-xs text-ink rounded-lg outline-none transition focus:border-forest focus:ring-1 focus:ring-forest";
const TICK =
  "flex cursor-pointer flex-row items-start gap-2.5 text-xs font-semibold text-ink";

function elegir(recursoId: number, inicio: string) {
  seleccion.value = { recursoId, inicio };
  duracion.value = duraciones.value[0] ?? 0;
  iniciarTemporizador();
}

function actualizarBooleano(
  campo: "wantsComputer" | "computerConditionsAccepted",
  valor: boolean,
) {
  emit("update:modelValue", {
    ...props.modelValue,
    [campo]: valor,
    ...(campo === "wantsComputer" && !valor
      ? { computerConditionsAccepted: false }
      : {}),
  });
}

function sincronizar() {
  emit("update:modelValue", {
    ...props.modelValue,
    resource: salaElegida.value?.nombre ?? "",
    resourceId: salaElegida.value?.id ?? 0,
    date: fecha.value,
    startTime: seleccion.value?.inicio ?? "",
    endTime: fin.value,
  });
}

watch(fecha, () => {
  seleccion.value = null;
  duracion.value = 0;
  detenerTemporizador();
  segundosRestantes.value = 300;
  haExpirado.value = false;
  bookingExpiresAt.value = null;
});

watch([seleccion, duracion], sincronizar);

watch(notebooksLibres, (libres) => {
  if (!libres && props.modelValue.wantsComputer)
    actualizarBooleano("wantsComputer", false);
});

watch(
  () => props.completed,
  (confirmada) => {
    if (confirmada) {
      detenerTemporizador();
      bookingExpiresAt.value = null;
      cargar();
    }
  },
);

onMounted(cargar);

onUnmounted(() => {
  detenerTemporizador();
  bookingExpiresAt.value = null;
});
</script>

<template>
  <div>
    <div v-if="completed" class="flex flex-col">
      <!-- Encabezado con check verde y título -->
      <div class="flex items-center gap-3.5">
        <div
          class="flex size-9 shrink-0 items-center justify-center rounded-full bg-mint text-forest-deep"
        >
          <svg
            class="size-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m9 12 2 2 4-4"
            />
          </svg>
        </div>
        <h2
          class="font-sans text-xl font-bold tracking-tight text-ink md:text-2xl"
        >
          ¡Reserva realizada con éxito!
        </h2>
      </div>

      <!-- Bloque DETALLE DEL TURNO con borde fino -->
      <div
        class="mt-6 rounded-xl border border-line bg-white p-6 max-tablet:p-4"
      >
        <p
          class="mb-4 text-micro font-bold tracking-wider text-muted uppercase"
        >
          DETALLE DEL TURNO
        </p>

        <dl class="m-0 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-xs">
          <dt class="text-muted">Espacio</dt>
          <dd class="m-0 font-bold text-ink">{{ reserva?.sala }}</dd>

          <dt class="text-muted">Día</dt>
          <dd class="m-0 font-bold text-ink">
            {{ reserva ? formatearFechaLarga(reserva.fecha) : "" }}
          </dd>

          <dt class="text-muted">Horario</dt>
          <dd class="m-0 font-bold text-ink">
            {{ reserva?.inicio }} a {{ reserva?.fin }}
          </dd>

          <template v-if="reserva?.notebook">
            <dt class="text-muted">Notebook</dt>
            <dd class="m-0 font-bold text-ink">{{ reserva.notebook }}</dd>
          </template>

          <template v-if="reserva?.id">
            <dt class="text-muted">Código</dt>
            <dd class="m-0 font-bold text-ink">#{{ reserva.id }}</dd>
          </template>
        </dl>

        <div class="mt-6">
          <span
            class="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-notebook-ink transition-colors hover:underline"
          >
            Ver mis reservas →
          </span>
        </div>
      </div>

      <!-- Botón "Nueva reserva" sólido abajo a la derecha, separado por línea fina -->
      <div class="mt-8 flex justify-end border-t border-line pt-6">
        <button
          type="button"
          class="cursor-pointer rounded-full bg-notebook-ink px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:opacity-90"
          @click="iniciarNuevaReserva"
        >
          Nueva reserva
        </button>
      </div>
    </div>

    <div v-else class="flex flex-col gap-5">
      <div class="flex items-center justify-between gap-4">
        <h2 class="font-sans text-2xl font-bold tracking-tight text-ink">
          Reservá un recurso
        </h2>

        <div
          v-if="timerActivo"
          :class="[
            'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold transition-all',
            segundosRestantes < 60
              ? 'animate-pulse border-danger/30 bg-danger/10 text-danger'
              : 'border-full-ink/20 bg-conditions text-full-ink',
          ]"
        >
          <svg
            class="size-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span
            >Tiempo restante:
            <strong class="font-mono font-bold">{{
              tiempoFormateado
            }}</strong></span
          >
        </div>
      </div>

      <div
        v-if="haExpirado"
        class="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger"
      >
        <svg
          class="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
        <span>
          El tiempo para completar tu reserva ha vencido. Por favor, seleccioná
          nuevamente un horario.
        </span>
      </div>

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
          :bloques-seleccionados="duracion / BLOQUE_MINUTOS"
          compacto
          :estado-de="estadoDe"
          :recursos="recursosVisibles"
          seleccionable
          :seleccion="seleccion"
          @seleccionar="elegir"
        />
      </EstadoDisponibilidad>

      <div
        v-if="listo"
        class="flex flex-wrap items-center justify-between gap-4 rounded-r-xl border-l-4 border-notebook-ink bg-notebook/20 p-4"
      >
        <h3 class="m-0 text-sm font-bold text-ink">Selecciona la duración</h3>
        <p class="m-0 text-xs text-ink">
          <strong class="font-bold text-ink">{{ salaElegida?.nombre }}</strong>
          · {{ seleccion?.inicio }} a {{ fin }}
        </p>
        <label
          class="flex flex-row items-center gap-2 text-micro font-bold tracking-wider text-ink uppercase"
        >
          Duración
          <select
            :class="SELECT"
            :value="duracion"
            @change="
              duracion = Number(($event.target as HTMLSelectElement).value)
            "
          >
            <option v-for="opcion in duraciones" :key="opcion" :value="opcion">
              {{ etiquetaDuracion(opcion) }}
            </option>
          </select>
        </label>
      </div>

      <label
        v-if="listo && notebooksLibres"
        :class="[TICK, 'rounded-xl border border-line bg-white p-3']"
      >
        <input
          :checked="modelValue.wantsComputer"
          class="mt-0.5 size-4 accent-notebook-ink"
          type="checkbox"
          @change="
            actualizarBooleano(
              'wantsComputer',
              ($event.target as HTMLInputElement).checked,
            )
          "
        />
        <span class="flex flex-col gap-1">
          <strong class="text-ink">¿Querés sumar una notebook?</strong>
          <small class="text-mini font-normal leading-normal text-muted"
            >Solo se usan dentro de la biblioteca, durante tu reserva.</small
          >
        </span>
      </label>

      <div
        v-if="modelValue.wantsComputer"
        class="rounded-r-xl border-l-4 border-coral bg-conditions p-4 text-xs text-ink"
      >
        <strong class="font-bold text-ink"
          >Condiciones de uso de la notebook</strong
        >
        <p class="mt-1 mb-2.5 text-mini leading-normal text-muted">
          El uso está limitado al horario reservado y a la normativa de la
          biblioteca.
        </p>
        <label :class="[TICK, 'items-center text-xs']">
          <input
            :checked="modelValue.computerConditionsAccepted"
            class="size-4 accent-notebook-ink"
            type="checkbox"
            @change="
              actualizarBooleano(
                'computerConditionsAccepted',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <span>Acepto las condiciones</span>
        </label>
      </div>

      <p v-if="error" :class="ERROR">{{ error }}</p>

      <div :class="ACCIONES">
        <button :class="BOTON_SUAVE" type="button" @click="volverAtras">
          ← Volver
        </button>
        <button
          :class="BOTON_PRIMARIO"
          :disabled="
            loading ||
            haExpirado ||
            !listo ||
            (modelValue.wantsComputer && !modelValue.computerConditionsAccepted)
          "
          type="button"
          @click="emit('submit')"
        >
          {{ loading ? "Confirmando…" : "Confirmar reserva" }}
          <span :class="FLECHA_BOTON">→</span>
        </button>
      </div>
    </div>
  </div>
</template>
