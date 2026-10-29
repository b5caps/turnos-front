<script setup lang="ts">
import { computed, ref } from "vue";
import { formatearFechaLarga } from "~/constants/horarios";
import { BOTON_SUAVE, CAMPO, ETIQUETA } from "~/constants/estilos";
import type { ReservaPropia } from "~/types/reservas";

const props = defineProps<{ reserva: ReservaPropia; cancelando: boolean }>();
const emit = defineEmits<{ cancelar: [id: number, motivo: string] }>();

const confirmando = ref(false);
const motivo = ref("");

const espacio = computed(
  () =>
    props.reserva.recursos.find((r) => !r.toLowerCase().includes("notebook")) ??
    props.reserva.recursos[0] ??
    "Espacio",
);

const notebook = computed(() => {
  const nb = props.reserva.recursos.find((r) =>
    r.toLowerCase().includes("notebook"),
  );
  if (!nb) return null;
  const match = nb.match(/\d+/);
  return match ? match[0] : nb;
});

function formatearFechaConHora(fechaStr: string, hora: string) {
  const f = formatearFechaLarga(fechaStr);
  const capitalizada = f ? f.charAt(0).toUpperCase() + f.slice(1) : "";
  const anio = fechaStr.slice(0, 4);
  return `${capitalizada}, ${anio} ${hora}`;
}

const inicioFormateado = computed(() =>
  formatearFechaConHora(props.reserva.fecha, props.reserva.inicio),
);

const finFormateado = computed(() =>
  formatearFechaConHora(props.reserva.fecha, props.reserva.fin),
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
  <article
    class="flex flex-col gap-3 rounded-xl border border-line bg-white p-5 shadow-xs"
  >
    <div
      class="flex items-center justify-between gap-4 max-tablet:flex-col max-tablet:items-start"
    >
      <div class="flex flex-col gap-1">
        <h3 class="font-sans text-base font-bold text-notebook-ink">
          {{ espacio }}
        </h3>
        <div
          v-if="notebook"
          class="flex items-center gap-1.5 text-xs text-muted"
        >
          <svg
            class="size-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <rect height="12" rx="1" width="18" x="3" y="4" />
            <path d="M2 20h20" />
          </svg>
          <span>Notebook institucional número: {{ notebook }}</span>
        </div>
        <div v-else-if="reserva.recursos.length > 1" class="text-xs text-muted">
          {{ reserva.recursos.slice(1).join(", ") }}
        </div>
      </div>

      <div
        class="flex items-center gap-6 max-tablet:w-full max-tablet:justify-between"
      >
        <div class="text-right text-xs max-tablet:text-left">
          <div>
            <span class="text-muted">Comienzo </span>
            <strong class="font-bold text-ink">{{ inicioFormateado }}</strong>
          </div>
          <div>
            <span class="text-muted">Termina </span>
            <strong class="font-bold text-ink">{{ finFormateado }}</strong>
          </div>
        </div>

        <button
          v-if="reserva.cancelable && !confirmando"
          type="button"
          class="cursor-pointer rounded-md bg-danger px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-65"
          :disabled="cancelando"
          @click="confirmando = true"
        >
          {{ cancelando ? "Cancelando..." : "Cancelar reserva" }}
        </button>

        <span
          v-else-if="reserva.estado === 'cancelada'"
          class="rounded bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger"
        >
          Cancelada
        </span>

        <span
          v-else-if="reserva.estado === 'finalizada'"
          class="rounded bg-line px-2.5 py-1 text-xs font-semibold text-muted"
        >
          Finalizada
        </span>
      </div>
    </div>

    <p
      v-if="reserva.estado === 'cancelada' && reserva.motivoCancelacion"
      class="m-0 text-mini text-muted"
    >
      Motivo de cancelación: {{ reserva.motivoCancelacion }}
    </p>

    <form
      v-if="confirmando"
      class="mt-2 flex w-full flex-col gap-3 border-t border-line pt-3"
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
        <button
          type="submit"
          class="cursor-pointer rounded-md bg-danger px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-65"
          :disabled="cancelando"
        >
          Confirmar cancelación
        </button>
      </div>
    </form>
  </article>
</template>
