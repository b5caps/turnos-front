<script setup lang="ts">
import { onMounted } from "vue";
import FiltroEstados from "~/components/reservas/FiltroEstados.vue";
import TarjetaReserva from "~/components/reservas/TarjetaReserva.vue";
import { AVISO, BOTON_SUAVE } from "~/constants/estilos";
import { ETIQUETA_HORARIO } from "~/constants/horarios";

const {
  usuario,
  reservas,
  filtro,
  cargando,
  errorMessage,
  aviso,
  cancelando,
  cargar,
  filtrarPor,
  cancelar,
} = useMisReservas();

const { isSubmitting, logout } = useGrebAuth();

onMounted(cargar);
</script>

<template>
  <main
    class="relative grid min-h-screen place-items-center overflow-hidden bg-shell px-6 py-10 font-sans text-ink [background-image:radial-gradient(circle_at_9%_12%,rgb(255_255_255/0.75),transparent_30%),linear-gradient(135deg,#e2eee3,#cce0d6)] max-tablet:place-items-start max-tablet:p-3.5"
  >
    <span
      aria-hidden="true"
      class="pointer-events-none absolute -top-[335px] -right-[120px] size-[530px] rounded-full border border-forest/15"
    ></span>
    <span
      aria-hidden="true"
      class="pointer-events-none absolute -bottom-[520px] -left-[260px] size-[680px] rounded-full border border-forest/15"
    ></span>

    <section
      aria-labelledby="mis-reservas-titulo"
      class="relative z-1 w-[min(100%,1050px)] animate-rise border border-white/70 bg-paper shadow-dialog max-tablet:my-2.5"
    >
      <header
        class="flex min-h-26 items-center gap-4 border-b border-line px-10 py-5 max-tablet:p-5"
      >
        <span
          class="grid size-14 place-items-center overflow-hidden rounded-[13px_13px_13px_3px] bg-forest"
        >
          <img
            alt="Logo UTN"
            class="size-12 object-contain"
            src="/logo%20utn%20blanco.png"
          />
        </span>
        <div>
          <p
            class="mb-1 text-micro font-bold tracking-widest text-coral uppercase"
          >
            Biblioteca universitaria
          </p>
          <h1
            id="mis-reservas-titulo"
            class="font-serif text-2xl font-bold tracking-wide"
          >
            Mis reservas
          </h1>
          <p
            class="mt-0.5 text-xs text-muted max-tablet:max-w-58 max-tablet:leading-snug"
          >
            Revisá tus reservas y cancelá las que no vayas a usar
          </p>
        </div>
        <div class="ml-auto flex items-center gap-5 max-tablet:gap-3">
          <NuxtLink
            class="border-b border-mint text-xs font-bold text-forest no-underline hover:border-forest"
            to="/disponibilidad"
            >Disponibilidad</NuxtLink
          >
          <button
            v-if="usuario"
            class="cursor-pointer border-b border-mint text-xs font-bold text-forest hover:border-forest disabled:cursor-wait disabled:opacity-65"
            :disabled="isSubmitting"
            type="button"
            @click="logout"
          >
            {{ isSubmitting ? "Cerrando sesión..." : "Cerrar sesión" }}
          </button>
        </div>
      </header>

      <div
        class="flex flex-col gap-5 px-10 pt-8 pb-8 max-tablet:gap-4 max-tablet:px-4.5 max-tablet:py-5"
      >
        <div
          v-if="!usuario"
          :class="[AVISO, 'flex flex-col items-center gap-3']"
        >
          <p class="m-0">Iniciá sesión para ver tus reservas.</p>
          <NuxtLink
            class="text-xs font-bold text-forest no-underline hover:underline"
            to="/"
            >Ingresar</NuxtLink
          >
        </div>

        <template v-else>
          <FiltroEstados
            :deshabilitado="cargando"
            :seleccionado="filtro"
            @seleccionar="filtrarPor"
          />

          <p v-if="aviso" class="m-0 bg-success p-3.5 text-xs text-forest">
            {{ aviso }}
          </p>

          <p v-if="cargando" :class="AVISO">Cargando tus reservas…</p>
          <div
            v-else-if="errorMessage"
            :class="[AVISO, 'flex flex-col items-center gap-2.5 text-danger']"
          >
            <p class="m-0">{{ errorMessage }}</p>
            <button :class="BOTON_SUAVE" type="button" @click="cargar">
              Reintentar
            </button>
          </div>
          <div
            v-else-if="!reservas.length"
            :class="[AVISO, 'flex flex-col items-center gap-3']"
          >
            <p class="m-0">Todavía no tenés reservas con este filtro.</p>
            <NuxtLink
              class="text-xs font-bold text-forest no-underline hover:underline"
              to="/"
              >Reservar un espacio</NuxtLink
            >
          </div>
          <div v-else class="flex flex-col gap-3.5">
            <TarjetaReserva
              v-for="reserva in reservas"
              :key="reserva.id"
              :cancelando="cancelando === reserva.id"
              :reserva="reserva"
              @cancelar="cancelar"
            />
          </div>
        </template>
      </div>

      <footer
        class="flex justify-between border-t border-line px-10 py-4 text-micro text-footer max-tablet:px-5 max-tablet:py-3.5"
      >
        <span>GREB · Biblioteca</span><span>{{ ETIQUETA_HORARIO }}</span>
      </footer>
    </section>
  </main>
</template>
