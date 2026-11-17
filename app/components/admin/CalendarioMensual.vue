<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { BOTON, BOTON_PRIMARIO, BOTON_SUAVE } from "~/constants/estilos";
import { hoyIso } from "~/constants/horarios";
import { listarBloqueos, type Bloqueo } from "~/services/bloqueos";
import { obtenerFeriados, type Feriado } from "~/services/feriados";

const props = withDefaults(
  defineProps<{
    fechaSeleccionada?: string;
  }>(),
  {
    fechaSeleccionada: "",
  },
);

const emit = defineEmits<{
  seleccionarDia: [fechaIso: string];
}>();

const mesActual = ref<Date>(new Date());
const bloqueos = ref<Bloqueo[]>([]);
const feriados = ref<Feriado[]>([]);
const cargando = ref(false);
const errorMessage = ref("");

const DIAS_SEMANA = [
  { corto: "Lun", largo: "Lunes" },
  { corto: "Mar", largo: "Martes" },
  { corto: "Mié", largo: "Miércoles" },
  { corto: "Jue", largo: "Jueves" },
  { corto: "Vie", largo: "Viernes" },
  { corto: "Sáb", largo: "Sábado" },
  { corto: "Dom", largo: "Domingo" },
];

const tituloMes = computed(() => {
  const str = format(mesActual.value, "MMMM yyyy", { locale: es });
  return str.charAt(0).toUpperCase() + str.slice(1);
});

async function cargarDatos() {
  cargando.value = true;
  errorMessage.value = "";
  try {
    const [resBloqueos, resFeriados] = await Promise.all([
      listarBloqueos(),
      obtenerFeriados(),
    ]);
    bloqueos.value = resBloqueos;
    feriados.value = resFeriados.feriados;
  } catch (err: any) {
    errorMessage.value =
      err?.message || "No pudimos cargar los datos del calendario.";
  } finally {
    cargando.value = false;
  }
}

function mesAnterior() {
  mesActual.value = subMonths(mesActual.value, 1);
}

function mesSiguiente() {
  mesActual.value = addMonths(mesActual.value, 1);
}

function irAHoy() {
  mesActual.value = new Date();
  emit("seleccionarDia", hoyIso());
}

function onDiaClick(fechaIso: string) {
  emit("seleccionarDia", fechaIso);
}

const diasGrilla = computed(() => {
  const inicioMes = startOfMonth(mesActual.value);
  const finMes = endOfMonth(mesActual.value);
  // La semana comienza en lunes (weekStartsOn: 1)
  const inicioGrilla = startOfWeek(inicioMes, { weekStartsOn: 1 });
  const finGrilla = endOfWeek(finMes, { weekStartsOn: 1 });

  const diasIntervalo = eachDayOfInterval({
    start: inicioGrilla,
    end: finGrilla,
  });

  const feriadosMap = new Map<string, Feriado>();
  for (const f of feriados.value) {
    feriadosMap.set(f.fecha, f);
  }

  return diasIntervalo.map((dia) => {
    const fechaIso = format(dia, "yyyy-MM-dd");
    const numeroDia = dia.getDate();
    const esMesActual = isSameMonth(dia, mesActual.value);
    const esDiaHoy = isToday(dia);
    const seleccionado = props.fechaSeleccionada === fechaIso;

    // Feriado registrado
    const feriado = feriadosMap.get(fechaIso) || null;

    // Bloqueos activos que aplican a este día
    const bloqueosDelDia = bloqueos.value.filter((b) => {
      const fIni = b.fechaHoraInicio.slice(0, 10);
      const fFin = b.fechaHoraFin ? b.fechaHoraFin.slice(0, 10) : "9999-12-31";
      return fechaIso >= fIni && fechaIso <= fFin;
    });

    // Detectar si el día está bloqueado completo ("Cerrado")
    const bloqueoCompleto = bloqueosDelDia.find((b) => {
      const hIni = b.fechaHoraInicio.slice(11, 16);
      const hFin = b.fechaHoraFin ? b.fechaHoraFin.slice(11, 16) : "23:59";
      const fIni = b.fechaHoraInicio.slice(0, 10);
      const fFin = b.fechaHoraFin ? b.fechaHoraFin.slice(0, 10) : "9999-12-31";
      const abarcaTodoHorario =
        (hIni <= "10:00" &&
          (hFin >= "22:00" || !b.fechaHoraFin || hFin === "23:59")) ||
        (fIni < fechaIso && fFin > fechaIso);
      return abarcaTodoHorario;
    });

    const esCerradoCompleto = Boolean(bloqueoCompleto);
    const motivoCierre = bloqueoCompleto?.motivo || "";

    // Estado sintético del día
    let estado: "feriado" | "cerrado" | "parcial" | "libre" = "libre";
    if (feriado) {
      estado = "feriado";
    } else if (esCerradoCompleto) {
      estado = "cerrado";
    } else if (bloqueosDelDia.length > 0) {
      estado = "parcial";
    }

    return {
      fecha: dia,
      fechaIso,
      numeroDia,
      esMesActual,
      esHoy: esDiaHoy,
      seleccionado,
      feriado,
      esCerradoCompleto,
      motivoCierre,
      cantidadBloqueos: bloqueosDelDia.length,
      bloqueos: bloqueosDelDia,
      estado,
    };
  });
});

onMounted(cargarDatos);
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Encabezado y controles de navegación del mes -->
    <div
      class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 shadow-card"
    >
      <div class="flex items-center gap-3">
        <h2 class="m-0 font-sans text-2xl font-bold tracking-tight text-ink">
          {{ tituloMes }}
        </h2>
        <span
          v-if="cargando"
          class="rounded-full bg-paper px-2.5 py-0.5 text-micro font-medium text-muted"
        >
          Actualizando…
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          :class="[
            BOTON_SUAVE,
            'rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-bold text-ink hover:border-forest',
          ]"
          @click="irAHoy"
        >
          Hoy
        </button>

        <div class="flex items-center gap-1">
          <button
            type="button"
            aria-label="Mes anterior"
            :class="[
              BOTON_SUAVE,
              'size-8 rounded-lg border border-line bg-white p-0 text-ink hover:border-forest flex items-center justify-center',
            ]"
            @click="mesAnterior"
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
          </button>
          <button
            type="button"
            aria-label="Mes siguiente"
            :class="[
              BOTON_SUAVE,
              'size-8 rounded-lg border border-line bg-white p-0 text-ink hover:border-forest flex items-center justify-center',
            ]"
            @click="mesSiguiente"
          >
            <svg
              class="size-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          :class="[
            BOTON_SUAVE,
            'ml-2 text-xs font-semibold text-muted hover:text-ink',
          ]"
          :disabled="cargando"
          @click="cargarDatos"
        >
          Refrescar
        </button>
      </div>
    </div>

    <!-- Error al cargar datos -->
    <div
      v-if="errorMessage"
      class="flex items-center justify-between rounded-xl bg-estado-cancelado-suave px-5 py-3 text-tiny text-estado-cancelado"
    >
      <span>{{ errorMessage }}</span>
      <button :class="BOTON_SUAVE" type="button" @click="cargarDatos">
        Reintentar
      </button>
    </div>

    <!-- Contenedor de la grilla mensual en cuadraditos -->
    <div
      class="rounded-2xl border border-line bg-white p-4 shadow-card tablet:p-6"
    >
      <!-- Cabecera de días de la semana -->
      <div class="grid grid-cols-7 gap-2 pb-3 tablet:gap-3">
        <div
          v-for="diaSem in DIAS_SEMANA"
          :key="diaSem.corto"
          class="text-center text-micro font-bold tracking-wider uppercase text-muted"
        >
          <span class="max-tablet:hidden">{{ diaSem.largo }}</span>
          <span class="tablet:hidden">{{ diaSem.corto }}</span>
        </div>
      </div>

      <!-- Grilla de cuadraditos del mes -->
      <div class="grid grid-cols-7 gap-2 tablet:gap-3">
        <button
          v-for="dia in diasGrilla"
          :key="dia.fechaIso"
          type="button"
          :class="[
            'group relative flex min-h-[85px] tablet:min-h-[115px] flex-col justify-between rounded-xl border p-2 text-left transition-all cursor-pointer outline-none focus:ring-2 focus:ring-forest',
            dia.esHoy
              ? 'border-2 border-forest bg-mint/15 shadow-xs'
              : dia.seleccionado
                ? 'border-2 border-notebook-ink bg-notebook/15 shadow-xs'
                : dia.esMesActual
                  ? 'border-line bg-white hover:border-forest/60 hover:shadow-card'
                  : 'border-hairline bg-paper/40 opacity-45 text-faint',
          ]"
          @click="onDiaClick(dia.fechaIso)"
        >
          <!-- Fila superior: número de día y marcador -->
          <div class="flex items-center justify-between w-full">
            <span
              :class="[
                'text-xs font-bold leading-none',
                dia.esHoy
                  ? 'size-6 rounded-full bg-forest text-white flex items-center justify-center font-bold text-mini shadow-xs'
                  : dia.esMesActual
                    ? 'text-ink'
                    : 'text-faint',
              ]"
            >
              {{ dia.numeroDia }}
            </span>

            <span
              v-if="dia.esHoy"
              class="max-tablet:hidden rounded-full bg-forest/10 px-1.5 py-0.5 text-[9px] font-bold text-forest uppercase"
            >
              Hoy
            </span>
          </div>

          <!-- Contenido central: feriado, cerrado completo, parcial o libre -->
          <div class="my-1 flex flex-col gap-1 w-full overflow-hidden">
            <!-- Feriado con su nombre visible -->
            <div
              v-if="dia.feriado"
              class="rounded bg-coral/10 border border-coral/25 px-1.5 py-0.5 text-micro font-bold text-coral-dark truncate w-full"
              :title="`Feriado: ${dia.feriado.nombre}`"
            >
              <span class="max-tablet:truncate">{{ dia.feriado.nombre }}</span>
            </div>

            <!-- Bloqueo completo: "Cerrado" -->
            <div
              v-if="dia.esCerradoCompleto"
              class="rounded bg-estado-cancelado-suave border border-estado-cancelado/20 px-1.5 py-0.5 text-micro font-bold text-estado-cancelado truncate w-full"
              :title="
                dia.motivoCierre
                  ? `Cerrado: ${dia.motivoCierre}`
                  : 'Día cerrado completo'
              "
            >
              <span>Cerrado</span>
              <span
                v-if="dia.motivoCierre"
                class="hidden tablet:inline font-normal opacity-85 ml-1 text-[9px]"
              >
                ({{ dia.motivoCierre }})
              </span>
            </div>

            <!-- Bloqueos parciales (si no está cerrado completo) -->
            <div
              v-else-if="dia.cantidadBloqueos > 0"
              class="rounded bg-estado-pendiente-suave border border-estado-pendiente/20 px-1.5 py-0.5 text-micro font-semibold text-estado-pendiente truncate w-full"
              :title="`${dia.cantidadBloqueos} ${dia.cantidadBloqueos === 1 ? 'bloqueo registrado' : 'bloqueos registrados'}`"
            >
              <span>
                {{ dia.cantidadBloqueos }}
                {{ dia.cantidadBloqueos === 1 ? "bloqueo" : "bloqueos" }}
              </span>
            </div>

            <!-- Libre -->
            <div
              v-else-if="dia.esMesActual && !dia.feriado"
              class="text-micro font-medium text-faint"
            >
              Libre
            </div>
          </div>

          <!-- Pie del cuadradito -->
          <div class="flex items-center justify-end w-full pt-0.5">
            <span
              class="text-[9px] font-semibold text-faint group-hover:text-forest transition-colors flex items-center gap-0.5"
            >
              <span>Configurar</span>
              <span>→</span>
            </span>
          </div>
        </button>
      </div>

      <!-- Leyenda de colores y estados del calendario -->
      <div
        class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4 text-mini text-muted"
      >
        <div class="flex flex-wrap items-center gap-4">
          <span class="font-bold text-ink text-micro uppercase tracking-wider">
            Estados:
          </span>
          <div class="flex items-center gap-1.5">
            <span
              class="size-3 rounded-sm bg-coral/10 border border-coral/30"
            ></span>
            <span>Feriado nacional o asueto</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span
              class="size-3 rounded-sm bg-estado-cancelado-suave border border-estado-cancelado/30"
            ></span>
            <span>Cerrado (bloqueo completo)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span
              class="size-3 rounded-sm bg-estado-pendiente-suave border border-estado-pendiente/30"
            ></span>
            <span>Bloqueo parcial</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-white border border-line"></span>
            <span>Libre</span>
          </div>
        </div>

        <p class="m-0 text-micro text-faint">
          Hacé clic en cualquier día para abrir su panel de configuración de
          bloqueos.
        </p>
      </div>
    </div>
  </div>
</template>
