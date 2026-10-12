<script setup lang="ts">
import { computed, ref } from "vue";
import {
  etiquetaDuracion,
  formatearFechaLarga,
  horaAMinutos,
} from "~/constants/horarios";
import {
  BOTON_PRIMARIO,
  BOTON_SUAVE,
  CAMPO,
  ETIQUETA,
} from "~/constants/estilos";
import type { EstadoReserva, ReservaPropia } from "~/types/reservas";

const props = defineProps<{ reserva: ReservaPropia; cancelando: boolean }>();
const emit = defineEmits<{ cancelar: [id: number, motivo: string] }>();

const confirmando = ref(false);
const motivo = ref("");

const INSIGNIA: Record<EstadoReserva, string> = {
  activa: "bg-success text-forest",
  cancelada: "bg-full text-full-ink",
  finalizada: "bg-blocked text-blocked-ink",
};
const ETIQUETA_ESTADO: Record<EstadoReserva, string> = {
  activa: "Activa",
  cancelada: "Cancelada",
  finalizada: "Finalizada",
};

const duracion = computed(() =>
  etiquetaDuracion(
    horaAMinutos(props.reserva.fin) - horaAMinutos(props.reserva.inicio),
  ),
);

function confirmar() {
  emit("cancelar", props.reserva.id, motivo.value);
  confirmando.value = false;
  motivo.value = "";
}

function cerrar() {
  confirmando.value = false;
  motivo.value = "";
}
</script>

<template>
  <article class="flex flex-col gap-4 border border-line bg-white p-5">
    <div class="flex items-start justify-between gap-4 max-tablet:flex-col">
      <div class="flex flex-col gap-1">
        <strong
          class="font-serif text-xl font-normal tracking-tight max-tablet:text-lg"
          >{{ formatearFechaLarga(reserva.fecha) }}</strong
        >
        <span class="text-xs text-muted"
          >{{ reserva.inicio }} a {{ reserva.fin }} · {{ duracion }}</span
        >
        <span class="text-mini text-footer">Código #{{ reserva.id }}</span>
      </div>
      <span
        :class="[
          INSIGNIA[reserva.estado],
          'px-3 py-1.5 text-micro font-bold tracking-widest uppercase',
        ]"
        >{{ ETIQUETA_ESTADO[reserva.estado] }}</span
      >
    </div>

    <div class="flex flex-wrap gap-2">
      <span
        v-for="recurso in reserva.recursos"
        :key="recurso"
        class="border border-hairline bg-paper px-3 py-1.5 text-mini font-bold text-forest"
        >{{ recurso }}</span
      >
    </div>

    <p
      v-if="
        reserva.estado === 'activa' &&
        !reserva.conCheckIn &&
        reserva.limiteCheckIn
      "
      class="m-0 text-mini text-muted"
    >
      Tenés que hacer el check-in antes de las {{ reserva.limiteCheckIn }}.
    </p>
    <p
      v-if="reserva.estado === 'cancelada' && reserva.motivoCancelacion"
      class="m-0 text-mini text-muted"
    >
      Motivo: {{ reserva.motivoCancelacion }}
    </p>
    <p
      v-else-if="reserva.estado === 'activa' && reserva.conCheckIn"
      class="m-0 text-mini text-muted"
    >
      Ya hiciste el check-in, así que no se puede cancelar.
    </p>

    <div
      v-if="reserva.cancelable"
      class="flex justify-end border-t border-hairline pt-4"
    >
      <button
        v-if="!confirmando"
        :class="BOTON_SUAVE"
        :disabled="cancelando"
        type="button"
        @click="confirmando = true"
      >
        {{ cancelando ? "Cancelando..." : "Cancelar reserva" }}
      </button>
      <form
        v-else
        class="flex w-full flex-col gap-3"
        @submit.prevent="confirmar"
      >
        <label :class="ETIQUETA">
          ¿Por qué la cancelás? (opcional)
          <input
            v-model="motivo"
            :class="CAMPO"
            maxlength="120"
            placeholder="Se suspendió la cursada"
            type="text"
          />
        </label>
        <div class="flex items-center justify-between">
          <button :class="BOTON_SUAVE" type="button" @click="cerrar">
            Volver
          </button>
          <button :class="BOTON_PRIMARIO" :disabled="cancelando" type="submit">
            Confirmar cancelación
          </button>
        </div>
      </form>
    </div>
  </article>
</template>
