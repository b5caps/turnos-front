<script setup lang="ts">
import { onMounted } from 'vue'
import EstadoDisponibilidad from '~/components/disponibilidad/EstadoDisponibilidad.vue'
import FiltroSalas from '~/components/disponibilidad/FiltroSalas.vue'
import GrillaDisponibilidad from '~/components/disponibilidad/GrillaDisponibilidad.vue'
import ReferenciaEstados from '~/components/disponibilidad/ReferenciaEstados.vue'
import SelectorFecha from '~/components/disponibilidad/SelectorFecha.vue'

const { bloques, fecha, cargando, errorMessage, abierta, esHoy, salas, salaSeleccionada, recursosVisibles, cargar, irAFecha, moverDias, irAHoy, seleccionarSala, estadoDe } = useDisponibilidad()

onMounted(cargar)
</script>

<template>
  <main class="relative grid min-h-screen place-items-center overflow-hidden bg-shell px-6 py-10 font-sans text-ink [background-image:radial-gradient(circle_at_9%_12%,rgb(255_255_255/0.75),transparent_30%),linear-gradient(135deg,#e2eee3,#cce0d6)] max-tablet:place-items-start max-tablet:p-3.5">
    <span aria-hidden="true" class="pointer-events-none absolute -top-[335px] -right-[120px] size-[530px] rounded-full border border-forest/15"></span>
    <span aria-hidden="true" class="pointer-events-none absolute -bottom-[520px] -left-[260px] size-[680px] rounded-full border border-forest/15"></span>

    <section aria-labelledby="disponibilidad-titulo" class="relative z-1 w-[min(100%,1050px)] animate-rise border border-white/70 bg-paper shadow-dialog max-tablet:my-2.5">
      <header class="flex min-h-26 items-center gap-4 border-b border-line px-10 py-5 max-tablet:p-5">
        <span class="grid size-14 place-items-center overflow-hidden rounded-[13px_13px_13px_3px] bg-forest">
          <img alt="Logo UTN" class="size-12 object-contain" src="/logo%20utn%20blanco.png">
        </span>
        <div>
          <p class="mb-1 text-micro font-bold tracking-widest text-coral uppercase">Biblioteca universitaria</p>
          <h1 id="disponibilidad-titulo" class="font-serif text-2xl font-bold tracking-wide">Disponibilidad</h1>
          <p class="mt-0.5 text-xs text-muted max-tablet:max-w-58 max-tablet:leading-snug">Consultá qué lugares y notebooks hay disponibles</p>
        </div>
        <NuxtLink class="ml-auto border-b border-mint text-xs font-bold text-forest no-underline hover:border-forest" to="/">Ingresar</NuxtLink>
      </header>

      <div class="flex flex-col gap-5 px-10 pt-8 pb-8 max-tablet:gap-4 max-tablet:px-4.5 max-tablet:py-5">
        <SelectorFecha :deshabilitado="cargando" :es-hoy="esHoy" :fecha="fecha" @hoy="irAHoy" @mover="moverDias" @update:fecha="irAFecha" />

        <FiltroSalas v-if="abierta && salas.length" :salas="salas" :seleccionada="salaSeleccionada" @seleccionar="seleccionarSala" />

        <EstadoDisponibilidad :abierta="abierta" :cargando="cargando" :error-message="errorMessage" :sin-bloques="!bloques.length" @reintentar="cargar">
          <GrillaDisponibilidad :bloques="bloques" :estado-de="estadoDe" :recursos="recursosVisibles" />
          <ReferenciaEstados />
        </EstadoDisponibilidad>
      </div>

      <footer class="flex justify-between border-t border-line px-10 py-4 text-micro text-footer max-tablet:px-5 max-tablet:py-3.5">
        <span>GREB · Biblioteca</span><span>Lunes a viernes, 10 a 22</span>
      </footer>
    </section>
  </main>
</template>
