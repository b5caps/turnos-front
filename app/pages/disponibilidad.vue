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
  <main class="greb-shell">
    <span class="greb-orbit greb-orbit--top" aria-hidden="true"></span><span class="greb-orbit greb-orbit--bottom" aria-hidden="true"></span>
    <section class="auth-dialog" aria-labelledby="disponibilidad-titulo">
      <header class="dialog-header">
        <span class="brand-mark"><img src="/logo%20utn%20blanco.png" alt="Logo UTN"></span>
        <div><p class="eyebrow">Biblioteca universitaria</p><h1 id="disponibilidad-titulo">Disponibilidad</h1><p class="dialog-subtitle">Consultá qué lugares y notebooks hay disponibles</p></div>
        <NuxtLink class="disponibilidad__volver" to="/">Ingresar</NuxtLink>
      </header>

      <div class="disponibilidad">
        <SelectorFecha :deshabilitado="cargando" :es-hoy="esHoy" :fecha="fecha" @hoy="irAHoy" @mover="moverDias" @update:fecha="irAFecha" />

        <FiltroSalas v-if="abierta && salas.length" :salas="salas" :seleccionada="salaSeleccionada" @seleccionar="seleccionarSala" />

        <EstadoDisponibilidad :abierta="abierta" :cargando="cargando" :error-message="errorMessage" :sin-bloques="!bloques.length" @reintentar="cargar">
          <GrillaDisponibilidad :bloques="bloques" :estado-de="estadoDe" :recursos="recursosVisibles" />
          <ReferenciaEstados />
        </EstadoDisponibilidad>
      </div>

      <footer class="dialog-footer"><span>GREB · Biblioteca</span><span>Lunes a viernes, 10 a 22</span></footer>
    </section>
  </main>
</template>

<style scoped>
.disponibilidad { display: flex; flex-direction: column; gap: 20px; padding: 32px 38px 30px; }
.disponibilidad__volver { margin-left: auto; color: var(--forest); font-size: 12px; font-weight: 700; text-decoration: none; border-bottom: 1px solid var(--mint); }
.disponibilidad__volver:hover { border-bottom-color: var(--forest); }
@media (max-width: 720px) {
  .disponibilidad { padding: 22px 18px; gap: 16px; }
}
</style>
