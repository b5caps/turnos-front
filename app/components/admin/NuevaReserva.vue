<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { crearReserva } from "~/api/reservas";
import {
  BOTON,
  BOTON_SUAVE,
  CAMPO,
  ERROR,
  ETIQUETA,
} from "~/constants/estilos";
import { etiquetaDuracion, hoyIso } from "~/constants/horarios";
import type { AlumnoConocido } from "~/types/admin";

const props = defineProps<{ alumnos: AlumnoConocido[] }>();
const emit = defineEmits<{ creada: [mensaje: string]; cerrar: [] }>();

const {
  bloques,
  fecha,
  cargando,
  abierta,
  salas,
  cargar,
  irAFecha,
  duracionesPosibles,
  notebooksEnVentana,
} = useDisponibilidad();

const alumnoId = ref<number | null>(props.alumnos[0]?.id ?? null);
const idManual = ref("");
const usarIdManual = ref(false);
const salaId = ref<number | null>(null);
const inicio = ref("");
const duracion = ref(0);
const conNotebook = ref(false);
const enviando = ref(false);
const errorMessage = ref("");

const duraciones = computed(() =>
  salaId.value && inicio.value
    ? duracionesPosibles(salaId.value, inicio.value)
    : [],
);

const notebooksLibres = computed(() =>
  inicio.value && duracion.value
    ? notebooksEnVentana(inicio.value, duracion.value)
    : 0,
);

const usuarioElegido = computed(() =>
  usarIdManual.value ? Number(idManual.value) : alumnoId.value,
);

const salaElegida = computed(() =>
  salas.value.find((sala) => sala.id === salaId.value),
);

const finCalculado = computed(() => {
  if (!inicio.value || !duracion.value) return "";
  const [h, m] = inicio.value.split(":").map(Number);
  const total = h! * 60 + m! + duracion.value;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});

const listo = computed(
  () =>
    Boolean(usuarioElegido.value) &&
    Boolean(salaId.value) &&
    Boolean(inicio.value) &&
    duracion.value > 0,
);

watch([salaId, inicio], () => {
  duracion.value = 0;
  conNotebook.value = false;
});

watch(duraciones, (opciones) => {
  if (!opciones.includes(duracion.value)) duracion.value = opciones[0] ?? 0;
});

async function confirmar() {
  errorMessage.value = "";
  if (!listo.value || !salaElegida.value) return;

  enviando.value = true;
  try {
    const creada = await crearReserva({
      usuarioId: usuarioElegido.value!,
      fecha: fecha.value,
      inicio: inicio.value,
      fin: finCalculado.value,
      salaId: salaId.value!,
      salaNombre: salaElegida.value.nombre,
      conNotebook: conNotebook.value,
    });
    emit(
      "creada",
      `Reserva #${creada.id} creada para ${salaElegida.value.nombre}.`,
    );
  } catch (fallo) {
    errorMessage.value =
      fallo instanceof Error ? fallo.message : "No pudimos crear la reserva.";
  } finally {
    enviando.value = false;
  }
}

cargar();
</script>

<template>
  <form
    class="mb-3 rounded-xl border border-line bg-white p-5 shadow-card"
    @submit.prevent="confirmar"
  >
    <h3
      class="m-0 mb-4 text-tiny font-bold tracking-wider text-muted uppercase"
    >
      Nueva reserva
    </h3>

    <div class="grid grid-cols-4 gap-4 max-tablet:grid-cols-1">
      <label :class="ETIQUETA">
        Alumno
        <select
          v-if="!usarIdManual"
          v-model.number="alumnoId"
          :class="[CAMPO, 'text-tiny']"
        >
          <option v-for="alumno in alumnos" :key="alumno.id" :value="alumno.id">
            {{ alumno.nombre }}
          </option>
        </select>
        <input
          v-else
          v-model="idManual"
          :class="[CAMPO, 'text-tiny']"
          inputmode="numeric"
          placeholder="Id del usuario"
          type="text"
        />
        <button
          class="cursor-pointer self-start border-0 bg-transparent p-0 text-mini font-semibold text-muted hover:text-ink"
          type="button"
          @click="usarIdManual = !usarIdManual"
        >
          {{ usarIdManual ? "Elegir de la lista" : "No está en la lista" }}
        </button>
      </label>

      <label :class="ETIQUETA">
        Día
        <input
          :class="[CAMPO, 'text-tiny']"
          :min="hoyIso()"
          type="date"
          :value="fecha"
          @input="irAFecha(($event.target as HTMLInputElement).value)"
        />
      </label>

      <label :class="ETIQUETA">
        Sala
        <select
          v-model.number="salaId"
          :class="[CAMPO, 'text-tiny']"
          :disabled="!abierta"
        >
          <option :value="null">Elegí una sala</option>
          <option v-for="sala in salas" :key="sala.id" :value="sala.id">
            {{ sala.nombre }}
          </option>
        </select>
      </label>

      <label :class="ETIQUETA">
        Desde
        <select
          v-model="inicio"
          :class="[CAMPO, 'text-tiny']"
          :disabled="!salaId"
        >
          <option value="">Elegí un horario</option>
          <option v-for="bloque in bloques" :key="bloque" :value="bloque">
            {{ bloque }}
          </option>
        </select>
      </label>
    </div>

    <div class="mt-4 flex flex-wrap items-end gap-4">
      <label :class="[ETIQUETA, 'w-40']">
        Duración
        <select
          v-model.number="duracion"
          :class="[CAMPO, 'text-tiny']"
          :disabled="!duraciones.length"
        >
          <option v-if="!duraciones.length" :value="0">
            Sin horarios libres
          </option>
          <option v-for="opcion in duraciones" :key="opcion" :value="opcion">
            {{ etiquetaDuracion(opcion) }}
          </option>
        </select>
      </label>

      <label class="flex items-center gap-2 pb-2 text-tiny text-ink">
        <input
          v-model="conNotebook"
          class="size-4 cursor-pointer disabled:opacity-40"
          :disabled="!notebooksLibres"
          type="checkbox"
        />
        Sumar notebook
        <span class="text-mini text-muted">({{ notebooksLibres }} libres)</span>
      </label>

      <div class="ml-auto flex items-center gap-3">
        <button :class="BOTON_SUAVE" type="button" @click="emit('cerrar')">
          Cancelar
        </button>
        <button
          :class="[BOTON, 'bg-estado-activo text-white disabled:opacity-40']"
          :disabled="!listo || enviando || cargando"
          type="submit"
        >
          {{ enviando ? "Creando..." : "Crear reserva" }}
        </button>
      </div>
    </div>

    <p v-if="errorMessage" :class="ERROR">{{ errorMessage }}</p>
  </form>
</template>
