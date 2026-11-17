<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { BOTON, BOTON_SUAVE, CAMPO, ETIQUETA } from "~/constants/estilos";
import { useGrebAuth } from "~/composables/useGrebAuth";
import {
  consultarCheckIn,
  finalizarReserva,
  registrarCheckIn,
  type Asistencia,
} from "~/services/asistencia";
import { listarEspaciosActivos } from "~/services/espacios.service";
import { misReservas } from "~/api/reservas";
import type { EspacioSala } from "~/types/espacios";
import type { ReservaPropia } from "~/types/reservas";

const { isAuthenticated, usuario, login, logout, isSubmitting } = useGrebAuth();

// Extracción del token QR desde el fragmento (#tokenQr=...)
const tokenQr = ref<string | null>(null);
const tokenInvalido = ref(false);

// Estados de pantalla
const consultando = ref(true);
const registrandoSalida = ref(false);
const errorMensaje = ref("");
const errorRed = ref(false);
const exitoSalida = ref(false);
const exitoLlegada = ref(false);

// Datos cargados
const asistenciaActual = ref<Asistencia | null>(null);
const salaActual = ref<EspacioSala | null>(null);
const reservaDetalle = ref<ReservaPropia | null>(null);
const sinReservas = ref(false);

// Credenciales para login en la misma pantalla si no hay sesión
const credencialLegajo = ref("");
const credencialPassword = ref("");
const errorLogin = ref("");
const cargandoLogin = ref(false);

function extraerTokenDeHash(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const token = params.get("tokenQr") || hash;
  if (/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return token;
  }
  return null;
}

function formatearHora(isoString: string | null): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  } catch {
    return "";
  }
}

async function ejecutarLogin() {
  errorLogin.value = "";
  if (!credencialLegajo.value.trim() || !credencialPassword.value) {
    errorLogin.value = "Ingresá tu legajo/email y contraseña.";
    return;
  }

  cargandoLogin.value = true;
  try {
    await login(credencialLegajo.value.trim(), credencialPassword.value);
    if (isAuthenticated.value) {
      await procesarAsistencia();
    }
  } catch (err: any) {
    errorLogin.value = err?.message || "Credenciales inválidas.";
  } finally {
    cargandoLogin.value = false;
  }
}

async function procesarAsistencia() {
  if (!tokenQr.value) return;

  consultando.value = true;
  errorMensaje.value = "";
  errorRed.value = false;
  sinReservas.value = false;
  exitoSalida.value = false;
  exitoLlegada.value = false;

  try {
    // 1. Consultar reservas elegibles para este QR
    const data = await consultarCheckIn(tokenQr.value);

    // 2. Obtener datos de la sala
    try {
      const salas = await listarEspaciosActivos();
      salaActual.value =
        salas.find((s) => Number(s.id) === Number(data.recursoId)) || null;
    } catch {
      // Ignorar fallo al cargar metadatos de salas
    }

    // 3. Evaluar reservas devueltas
    if (!data.reservas || data.reservas.length === 0) {
      sinReservas.value = true;
      consultando.value = false;
      return;
    }

    const reserva = data.reservas[0];
    asistenciaActual.value = reserva;

    // Intentar buscar el horario de inicio y fin desde misReservas del alumno
    if (usuario.value) {
      try {
        const propias = await misReservas(usuario.value.id);
        const encontrada = propias.find((r) => r.id === reserva.id);
        if (encontrada) {
          reservaDetalle.value = encontrada;
        }
      } catch {
        // Ignorar
      }
    }

    // Si la reserva fue dada de baja por ausencia
    if (reserva.estado === "LIBERADA_POR_AUSENCIA") {
      consultando.value = false;
      return;
    }

    // Si el turno ya finalizó
    if (reserva.estado === "FINALIZADA") {
      consultando.value = false;
      return;
    }

    // PARTE 1 - Requisito 3: Si hay una reserva en curso sin llegada, registrar check-in automáticamente
    if (!reserva.fechaHoraCheckIn) {
      try {
        const resultadoCheckIn = await registrarCheckIn(
          reserva.id,
          tokenQr.value,
        );
        asistenciaActual.value = resultadoCheckIn;
        exitoLlegada.value = true;
      } catch (errCheckIn: any) {
        errorMensaje.value =
          errCheckIn?.message ||
          "No pudimos registrar tu llegada. Verificá si el turno ya comenzó o si venció el plazo.";
      }
    }
  } catch (err: any) {
    const status = err?.status;
    if (status === 401) {
      // F3: Sesión vencida
      errorLogin.value =
        "Tu sesión ha vencido. Por favor, volvé a iniciar sesión.";
    } else if (
      err?.message?.includes("fetch") ||
      err?.name === "FetchError" ||
      !status
    ) {
      // F2: Error de red
      errorRed.value = true;
      errorMensaje.value =
        "No pudimos conectar con el servidor. Probá de nuevo.";
    } else {
      errorMensaje.value =
        err?.message || "Ocurrió un error al procesar el código QR.";
    }
  } finally {
    consultando.value = false;
  }
}

async function accionRegistrarSalida() {
  if (!asistenciaActual.value) return;

  registrandoSalida.value = true;
  errorMensaje.value = "";
  try {
    await finalizarReserva(asistenciaActual.value.id);
    exitoSalida.value = true;
    asistenciaActual.value = {
      ...asistenciaActual.value,
      estado: "FINALIZADA",
    };
  } catch (err: any) {
    errorMensaje.value = err?.message || "No se pudo registrar la salida.";
  } finally {
    registrandoSalida.value = false;
  }
}

const horaInicioTurno = computed(() => {
  if (reservaDetalle.value?.inicio) return reservaDetalle.value.inicio;
  if (asistenciaActual.value?.fechaHoraCheckIn) {
    return formatearHora(asistenciaActual.value.fechaHoraCheckIn);
  }
  return "";
});

onMounted(async () => {
  const token = extraerTokenDeHash();
  if (!token) {
    tokenInvalido.value = true;
    consultando.value = false;
    return;
  }
  tokenQr.value = token;

  if (isAuthenticated.value) {
    await procesarAsistencia();
  } else {
    consultando.value = false;
  }
});
</script>

<template>
  <main
    class="relative flex min-h-screen flex-col items-center justify-between bg-paper font-sans text-ink"
  >
    <!-- Header -->
    <header
      class="sticky top-0 z-50 flex w-full items-center justify-between border-b border-line bg-white px-8 py-3.5 max-tablet:px-5"
    >
      <div class="flex items-center gap-6">
        <img
          src="/Logo_GREB.jpg"
          alt="UTN GREB"
          class="h-8 w-auto object-contain"
        />
        <span
          class="rounded-full bg-notebook px-2.5 py-1 text-tiny font-bold tracking-wider text-notebook-ink uppercase"
        >
          Check-in de sala
        </span>
      </div>

      <div v-if="isAuthenticated" class="flex items-center gap-4">
        <NuxtLink
          to="/mis-reservas"
          class="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink no-underline"
        >
          <svg
            class="size-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
            />
            <path d="M6 2v20" />
          </svg>
          <span>Mis reservas</span>
        </NuxtLink>

        <span class="h-4 w-px bg-line" aria-hidden="true"></span>

        <button
          type="button"
          class="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent text-xs font-semibold text-muted transition-colors hover:text-ink disabled:opacity-50"
          :disabled="isSubmitting"
          @click="logout"
        >
          <span>Cerrar sesión</span>
        </button>
      </div>
    </header>

    <!-- Contenido central para alguien parado en la puerta -->
    <div class="my-auto w-full max-w-lg px-4 py-8 max-tablet:py-5">
      <!-- 1. Token inválido o faltante -->
      <section
        v-if="tokenInvalido"
        class="rounded-2xl border border-line bg-white p-7 text-center shadow-card"
      >
        <div
          class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger"
        >
          <svg
            class="size-8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-ink">
          Código QR no reconocido
        </h1>
        <p class="mt-2 text-xs leading-relaxed text-muted">
          El enlace escaneado no contiene un código QR válido o está dañado.
          Asegurate de escanear el código QR oficial exhibido en la entrada de
          la sala.
        </p>
        <div class="mt-6 flex justify-center">
          <NuxtLink :class="BOTON_SUAVE" to="/"> Ir al inicio </NuxtLink>
        </div>
      </section>

      <!-- 2. Usuario NO autenticado: formulario de acceso directo conservando el token en URL -->
      <section
        v-else-if="!isAuthenticated"
        class="rounded-2xl border border-line bg-white p-7 shadow-card"
      >
        <div class="mb-5 text-center">
          <div
            class="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-notebook/30 text-notebook-ink"
          >
            <svg
              class="size-6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <rect height="5" rx="1" width="5" x="3" y="3" />
              <rect height="5" rx="1" width="5" x="16" y="3" />
              <rect height="5" rx="1" width="5" x="3" y="16" />
              <path
                d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M12 12v9M16 12h5"
              />
            </svg>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-ink">
            Escaneaste el QR de la sala
          </h1>
          <p class="mt-1 text-xs text-muted">
            Iniciá sesión para registrar tu asistencia automáticamente.
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="ejecutarLogin">
          <div
            v-if="errorLogin"
            class="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger"
          >
            {{ errorLogin }}
          </div>

          <label :class="ETIQUETA">
            Legajo o correo institucional
            <input
              v-model="credencialLegajo"
              autocomplete="username"
              :class="CAMPO"
              placeholder="Ej. 16868 o nombre@facultad.utn.edu.ar"
              required
              type="text"
            />
          </label>

          <label :class="ETIQUETA">
            Contraseña
            <input
              v-model="credencialPassword"
              autocomplete="current-password"
              :class="CAMPO"
              placeholder="••••••••"
              required
              type="password"
            />
          </label>

          <button
            :class="[BOTON, 'w-full bg-notebook-ink py-3 text-white']"
            :disabled="cargandoLogin"
            type="submit"
          >
            {{
              cargandoLogin ? "Verificando…" : "Ingresar y registrar asistencia"
            }}
          </button>
        </form>
      </section>

      <!-- 3. Consultando / Verificando -->
      <section
        v-else-if="consultando"
        class="rounded-2xl border border-line bg-white p-10 text-center shadow-card"
      >
        <div
          class="mx-auto mb-4 size-10 animate-spin rounded-full border-3 border-line border-t-notebook-ink"
        ></div>
        <h2 class="text-xl font-bold tracking-tight text-ink">
          Verificando tu reserva…
        </h2>
        <p class="mt-1 text-xs text-muted">
          Estamos consultando los datos de la sala.
        </p>
      </section>

      <!-- 4. Error de red (F2) -->
      <section
        v-else-if="errorRed"
        class="rounded-2xl border border-line bg-white p-7 text-center shadow-card"
      >
        <div
          class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger"
        >
          <svg
            class="size-8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-ink">
          Problemas de conexión
        </h2>
        <p class="mt-2 text-xs leading-relaxed text-muted">
          No pudimos conectar con el servidor. Probá de nuevo.
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <button
            :class="[BOTON, 'bg-notebook-ink text-white']"
            type="button"
            @click="procesarAsistencia"
          >
            Reintentar
          </button>
        </div>
      </section>

      <!-- 5. Sin reservas elegibles para esta sala en este momento -->
      <section
        v-else-if="sinReservas"
        class="rounded-2xl border border-line bg-white p-7 text-center shadow-card"
      >
        <div
          class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-hairline text-muted"
        >
          <svg
            class="size-8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-ink">
          No tenés reservas para esta sala en este momento
        </h2>
        <p class="mt-2 text-xs leading-relaxed text-muted">
          <span v-if="salaActual?.identificador" class="font-semibold text-ink">
            {{ salaActual.identificador }}:
          </span>
          Solo podés registrar tu llegada cuando tengas una reserva confirmada
          cuyo horario ya haya iniciado y esté dentro del plazo de tolerancia.
        </p>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <NuxtLink
            to="/mis-reservas"
            :class="[BOTON, 'bg-notebook-ink text-white no-underline']"
          >
            Ver mis reservas
          </NuxtLink>
          <NuxtLink to="/" :class="BOTON_SUAVE"> Reservar un espacio </NuxtLink>
        </div>
      </section>

      <!-- 6. Error general del backend (plazo vencido, etc.) -->
      <section
        v-else-if="errorMensaje && !asistenciaActual"
        class="rounded-2xl border border-line bg-white p-7 text-center shadow-card"
      >
        <div
          class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger"
        >
          <svg
            class="size-8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-ink">
          No se pudo registrar la asistencia
        </h2>
        <p class="mt-2 text-xs leading-relaxed text-danger font-medium">
          {{ errorMensaje }}
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <NuxtLink :class="BOTON_SUAVE" to="/mis-reservas">
            Ver mis reservas
          </NuxtLink>
          <button
            :class="[BOTON, 'bg-notebook-ink text-white']"
            type="button"
            @click="procesarAsistencia"
          >
            Reintentar
          </button>
        </div>
      </section>

      <!-- 7. Caso: Reserva dada de baja por ausencia (LIBERADA_POR_AUSENCIA) -->
      <section
        v-else-if="asistenciaActual?.estado === 'LIBERADA_POR_AUSENCIA'"
        class="rounded-2xl border border-line bg-white p-7 text-center shadow-card"
      >
        <div
          class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger"
        >
          <svg
            class="size-8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" x2="9" y1="9" y2="15" />
            <line x1="9" x2="15" y1="9" y2="15" />
          </svg>
        </div>
        <div class="mb-2">
          <span
            class="inline-block rounded-full bg-danger/15 px-3 py-1 text-tiny font-bold text-danger uppercase tracking-wider"
          >
            Liberada por ausencia
          </span>
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-ink">
          Turno dado de baja
        </h2>
        <p class="mt-2 text-xs leading-relaxed text-muted">
          El plazo límite para registrar la llegada venció y tu turno se dio de
          baja automáticamente. Si necesitás un espacio, por favor solicitá un
          nuevo turno.
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <NuxtLink
            to="/"
            :class="[BOTON, 'bg-notebook-ink text-white no-underline']"
          >
            Solicitar nuevo turno
          </NuxtLink>
        </div>
      </section>

      <!-- 8. Caso: Salida registrada exitosamente -->
      <section
        v-else-if="exitoSalida"
        class="rounded-2xl border border-line bg-white p-7 text-center shadow-card"
      >
        <div
          class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-mint text-forest-deep"
        >
          <svg
            class="size-8"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m5 13 4 4L19 7"
            />
          </svg>
        </div>
        <div class="mb-2">
          <span
            class="inline-block rounded-full bg-hairline px-3 py-1 text-tiny font-bold text-muted uppercase tracking-wider"
          >
            Finalizado
          </span>
        </div>
        <h2 class="text-3xl font-extrabold tracking-tight text-ink">
          ¡Salida registrada!
        </h2>
        <p class="mt-2 text-xs leading-relaxed text-muted">
          El lugar quedó liberado para otros alumnos. ¡Muchas gracias por tu
          visita a la biblioteca!
        </p>
        <div class="mt-6 flex justify-center">
          <NuxtLink
            to="/"
            :class="[BOTON, 'bg-notebook-ink text-white no-underline']"
          >
            Volver al inicio
          </NuxtLink>
        </div>
      </section>

      <!-- 9. Caso: Turno ya finalizado previamente -->
      <section
        v-else-if="asistenciaActual?.estado === 'FINALIZADA'"
        class="rounded-2xl border border-line bg-white p-7 text-center shadow-card"
      >
        <div
          class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-hairline text-muted"
        >
          <svg
            class="size-8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
        </div>
        <div class="mb-2">
          <span
            class="inline-block rounded-full bg-hairline px-3 py-1 text-tiny font-bold text-muted uppercase tracking-wider"
          >
            Finalizado
          </span>
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-ink">
          Turno finalizado
        </h2>
        <p class="mt-2 text-xs leading-relaxed text-muted">
          Tu asistencia y tu salida ya fueron registradas previamente para este
          turno.
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <NuxtLink to="/mis-reservas" :class="BOTON_SUAVE">
            Ver mis reservas
          </NuxtLink>
        </div>
      </section>

      <!-- 10. Caso: Llegada recién registrada automáticamente o confirmada -->
      <section
        v-else-if="
          exitoLlegada || (!asistenciaActual?.fechaHoraCheckIn && !errorMensaje)
        "
        class="rounded-2xl border border-line bg-white p-7 text-center shadow-card"
      >
        <div
          class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-mint text-forest-deep"
        >
          <svg
            class="size-9"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m5 13 4 4L19 7"
            />
          </svg>
        </div>
        <div class="mb-2">
          <span
            class="inline-block rounded-full bg-mint px-3 py-1 text-tiny font-bold text-forest-deep uppercase tracking-wider"
          >
            En curso
          </span>
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight text-ink">
          ¡Llegada registrada!
        </h1>
        <p class="mt-2 text-xs text-muted">
          Tu presencia fue confirmada en el sistema.
        </p>

        <!-- Tarjeta de detalle -->
        <div
          class="mt-6 rounded-xl border border-line bg-hairline/60 p-4 text-left text-xs"
        >
          <div
            class="flex items-center justify-between py-1 border-b border-line/60"
          >
            <span class="text-muted">Espacio</span>
            <span class="font-bold text-ink">
              {{ salaActual?.identificador || "Sala de estudio" }}
            </span>
          </div>
          <div
            v-if="horaInicioTurno"
            class="flex items-center justify-between py-1 border-b border-line/60"
          >
            <span class="text-muted">Inicio del turno</span>
            <span class="font-bold text-ink">{{ horaInicioTurno }} hs</span>
          </div>
          <div
            v-if="asistenciaActual?.id"
            class="flex items-center justify-between py-1"
          >
            <span class="text-muted">Reserva</span>
            <span class="font-semibold text-muted"
              >#{{ asistenciaActual.id }}</span
            >
          </div>
        </div>

        <p class="mt-5 text-micro text-muted">
          Al retirarte de la sala, podés volver a escanear este mismo código QR
          para registrar tu salida.
        </p>

        <div class="mt-6 flex justify-center gap-3">
          <NuxtLink
            to="/mis-reservas"
            :class="[BOTON, 'bg-notebook-ink text-white no-underline']"
          >
            Ver mis reservas
          </NuxtLink>
        </div>
      </section>

      <!-- 11. Caso: Llegada ya registrada previamente, ofreciendo registrar salida -->
      <section
        v-else-if="asistenciaActual?.fechaHoraCheckIn"
        class="rounded-2xl border border-line bg-white p-7 text-center shadow-card"
      >
        <div
          class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-notebook/30 text-notebook-ink"
        >
          <svg
            class="size-7"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </div>
        <div class="mb-2">
          <span
            class="inline-block rounded-full bg-mint px-3 py-1 text-tiny font-bold text-forest-deep uppercase tracking-wider"
          >
            En curso
          </span>
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-ink">
          ¿Querés registrar tu salida?
        </h2>
        <p class="mt-1 text-xs text-muted">
          Tu llegada fue registrada
          <span v-if="asistenciaActual.fechaHoraCheckIn">
            a las {{ formatearHora(asistenciaActual.fechaHoraCheckIn) }} hs.
          </span>
        </p>

        <div
          v-if="errorMensaje"
          class="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger"
        >
          {{ errorMensaje }}
        </div>

        <div class="mt-6 flex flex-col gap-3">
          <!-- Acción directa de salida sin doble confirmación para rapidez en la puerta -->
          <button
            :class="[
              BOTON,
              'w-full bg-estado-cancelado py-3 text-white disabled:opacity-50',
            ]"
            :disabled="registrandoSalida"
            type="button"
            @click="accionRegistrarSalida"
          >
            {{
              registrandoSalida
                ? "Registrando salida…"
                : "Registrar salida ahora"
            }}
          </button>

          <NuxtLink :class="BOTON_SUAVE" to="/mis-reservas">
            Continuar en la sala (Ver mis reservas)
          </NuxtLink>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <footer class="mb-6 space-y-0.5 text-center text-xs text-muted">
      <p class="font-semibold text-ink">
        Gestor de Reservas y Espacios de Biblioteca
      </p>
      <p class="text-mini text-faint">
        Universidad Tecnológica Nacional • Facultad Regional San Francisco
      </p>
    </footer>
  </main>
</template>
