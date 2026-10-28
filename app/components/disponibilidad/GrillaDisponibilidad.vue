<script setup lang="ts">
import { computed } from "vue";
import {
  BLOQUE_MINUTOS,
  horaAMinutos,
  minutosAHora,
} from "~/constants/horarios";
import type {
  BloqueDisponibilidad,
  EstadoBloque,
  RecursoDisponibilidad,
} from "~/types/disponibilidad";

const props = withDefaults(
  defineProps<{
    recursos: RecursoDisponibilidad[];
    bloques: string[];
    estadoDe: (bloque: BloqueDisponibilidad) => EstadoBloque;
    seleccionable?: boolean;
    seleccion?: { recursoId: number; inicio: string } | null;
    bloquesSeleccionados?: number;
    compacto?: boolean;
  }>(),
  {
    seleccionable: false,
    seleccion: null,
    bloquesSeleccionados: 1,
    compacto: false,
  },
);

const emit = defineEmits<{
  seleccionar: [recursoId: number, inicio: string];
}>();

const COLOR_SALA: Record<EstadoBloque, string> = {
  disponible: "bg-mint text-forest-deep",
  sin_cupos: "bg-full text-full-ink",
  bloqueado: "bg-blocked text-blocked-ink",
  fuera_de_horario: "bg-closed text-faint",
  pasado: "bg-closed text-past-ink",
};

const COLOR_NOTEBOOK: Record<EstadoBloque, string> = {
  disponible: "bg-notebook text-notebook-ink",
  sin_cupos: "bg-full text-full-ink",
  bloqueado: "bg-notebook-off text-notebook-off-ink",
  fuera_de_horario: "bg-notebook-off text-notebook-off-ink",
  pasado: "bg-notebook-off text-notebook-off-ink",
};

const desdeSeleccionado = computed(() =>
  props.seleccion ? props.bloques.indexOf(props.seleccion.inicio) : -1,
);
const cierre = computed(() => {
  const ultimo = props.bloques[props.bloques.length - 1];
  return ultimo ? minutosAHora(horaAMinutos(ultimo) + BLOQUE_MINUTOS) : "";
});
const ocultarPalabra = computed(() => props.compacto);

const filas = computed(() =>
  props.bloques.map((inicio, indice) => ({
    inicio,
    enPunto: inicio.endsWith(":00"),
    celdas: props.recursos.map((recurso) => {
      const esNotebook = recurso.tipo === "NOTEBOOK";
      const bloque = recurso.bloques[indice];
      const estado = bloque
        ? props.estadoDe(bloque)
        : ("fuera_de_horario" as EstadoBloque);
      const elegible =
        props.seleccionable && !esNotebook && estado === "disponible";
      const dentroSeleccion =
        props.seleccion?.recursoId === recurso.id &&
        desdeSeleccionado.value >= 0 &&
        indice >= desdeSeleccionado.value &&
        indice < desdeSeleccionado.value + props.bloquesSeleccionados;
      return {
        clave: `${recurso.id}-${inicio}`,
        recursoId: recurso.id,
        inicio,
        esNotebook,
        elegible,
        color: dentroSeleccion
          ? "bg-notebook-ink font-bold text-white"
          : esNotebook
            ? COLOR_NOTEBOOK[estado]
            : COLOR_SALA[estado],
        ...contenidoDe(esNotebook, bloque, estado),
      };
    }),
  })),
);

function contenidoDe(
  esNotebook: boolean,
  bloque: BloqueDisponibilidad | undefined,
  estado: EstadoBloque,
) {
  if (estado === "disponible" && bloque) {
    if (esNotebook) return { valor: "", palabra: "Disponible" };
    return {
      valor: String(bloque.cuposLibres),
      palabra: bloque.cuposLibres === 1 ? "libre" : "libres",
    };
  }
  if (estado === "pasado") return { valor: "", palabra: "—" };
  if (estado === "sin_cupos")
    return { valor: "", palabra: esNotebook ? "No disponible" : "completa" };
  if (estado === "bloqueado")
    return { valor: "", palabra: esNotebook ? "No disponible" : "bloqueada" };
  return { valor: "", palabra: "cerrada" };
}
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-line bg-white p-2">
    <table
      class="w-full border-separate border-spacing-0.5"
      :class="compacto ? 'text-mini' : 'text-xs max-tablet:text-mini'"
    >
      <thead>
        <tr>
          <th
            class="sticky top-0 z-1 w-18 border-b border-line bg-white py-2.5 text-center text-mini font-semibold text-muted"
          >
            Hora
          </th>
          <th
            v-for="(recurso, i) in recursos"
            :key="`encabezado-${recurso.id}`"
            class="sticky top-0 z-1 border-b border-line bg-white px-2 py-2.5 text-center"
            :class="
              i > 0 && i < recursos.length - 1 ? 'hidden md:table-cell' : ''
            "
          >
            <div class="flex flex-col items-center justify-center gap-0.5">
              <strong class="font-sans text-xs font-bold text-ink">{{
                recurso.nombre
              }}</strong>
              <small class="text-micro text-muted">{{
                recurso.tipo === "NOTEBOOK"
                  ? `${recurso.capacidad} equipos`
                  : `${recurso.capacidad} lugares`
              }}</small>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="fila in filas" :key="fila.inicio">
          <td
            class="py-1.5 text-center font-mono text-mini text-muted"
            :class="[fila.enPunto ? 'font-bold text-ink' : 'text-faint']"
          >
            {{ fila.inicio }}
          </td>
          <td
            v-for="(celda, i) in fila.celdas"
            :key="celda.clave"
            class="p-0 text-center"
            :class="
              i > 0 && i < fila.celdas.length - 1 ? 'hidden md:table-cell' : ''
            "
          >
            <component
              :is="celda.elegible ? 'button' : 'div'"
              class="flex w-full items-center justify-center gap-1 rounded-sm text-center leading-tight py-1.5 px-1 font-[inherit] transition-opacity"
              :class="[
                celda.color,
                celda.elegible &&
                  'cursor-pointer hover:opacity-85 hover:ring-1 hover:ring-notebook-ink',
              ]"
              :type="celda.elegible ? 'button' : undefined"
              @click="
                celda.elegible &&
                emit('seleccionar', celda.recursoId, celda.inicio)
              "
            >
              <span
                v-if="celda.valor"
                :class="
                  ocultarPalabra
                    ? 'text-tiny font-bold'
                    : 'max-tablet:text-tiny max-tablet:font-bold'
                "
                >{{ celda.valor }}</span
              >
              <span
                :class="
                  celda.valor &&
                  (ocultarPalabra ? 'hidden' : 'max-tablet:hidden')
                "
                >{{ celda.palabra }}</span
              >
            </component>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td
            :colspan="recursos.length + 1"
            class="border-t border-line px-2.5 py-2 text-micro text-faint"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-mini font-bold text-muted">{{ cierre }}</span>
              cierra la biblioteca
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
