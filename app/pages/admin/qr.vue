<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import AdminHeader from "~/components/admin/AdminHeader.vue";
import { BOTON, BOTON_SUAVE, CAMPO, ETIQUETA } from "~/constants/estilos";
import { listarEspaciosActivos } from "~/services/espacios.service";
import {
  emitirQrEspacio,
  registrarCheckInManual,
  revocarQrEspacio,
  type QrEspacioEmitido,
} from "~/services/asistencia";
import type { EspacioSala } from "~/types/espacios";

definePageMeta({ middleware: "admin" });

const salas = ref<EspacioSala[]>([]);
const cargando = ref(true);
const aviso = ref("");
const errorGeneral = ref("");

// QRs emitidos durante la sesión actual (indexados por espacioId)
const qrsEmitidos = ref<Record<number, QrEspacioEmitido>>({});

// Modales de confirmación
const salaParaGenerar = ref<EspacioSala | null>(null);
const salaParaRevocar = ref<EspacioSala | null>(null);
const generando = ref(false);
const revocando = ref(false);

// Elemento seleccionado para impresión
const salaParaImpresion = ref<(EspacioSala & { qr: QrEspacioEmitido }) | null>(
  null,
);

// Sección de check-in manual
const reservaIdManual = ref("");
const cargandoManual = ref(false);
const exitoManual = ref("");
const errorManual = ref("");

async function cargarSalas() {
  cargando.value = true;
  errorGeneral.value = "";
  try {
    const todos = await listarEspaciosActivos();
    salas.value = todos.filter((e) => e.tipoRecurso === "SALA");
  } catch (err: any) {
    errorGeneral.value =
      err?.message || "No pudimos cargar el listado de salas.";
  } finally {
    cargando.value = false;
  }
}

async function confirmarGeneracion() {
  if (!salaParaGenerar.value) return;

  const id = Number(salaParaGenerar.value.id);
  generando.value = true;
  errorGeneral.value = "";
  try {
    const qr = await emitirQrEspacio(id);
    qrsEmitidos.value[id] = qr;
    aviso.value = `Se generó un nuevo código QR para ${salaParaGenerar.value.identificador}. Recordá imprimirlo o descargarlo antes de cerrar esta ventana.`;
    salaParaGenerar.value = null;
  } catch (err: any) {
    errorGeneral.value =
      err?.message || "No se pudo generar el código QR de la sala.";
  } finally {
    generando.value = false;
  }
}

async function confirmarRevocacion() {
  if (!salaParaRevocar.value) return;

  const id = Number(salaParaRevocar.value.id);
  revocando.value = true;
  errorGeneral.value = "";
  try {
    await revocarQrEspacio(id);
    delete qrsEmitidos.value[id];
    aviso.value = `El código QR de ${salaParaRevocar.value.identificador} fue revocado exitosamente. Los alumnos ya no podrán registrar asistencia con el QR anterior.`;
    salaParaRevocar.value = null;
  } catch (err: any) {
    errorGeneral.value =
      err?.message || "No se pudo revocar el código QR de la sala.";
  } finally {
    revocando.value = false;
  }
}

function imprimir(sala: EspacioSala, qr: QrEspacioEmitido) {
  salaParaImpresion.value = { ...sala, qr };
  nextTick(() => {
    window.print();
  });
}

function descargarSvg(sala: EspacioSala, qr: QrEspacioEmitido) {
  const blob = new Blob([qr.qrSvg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `QR-${sala.identificador.replace(/\s+/g, "_")}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function ejecutarCheckInManual() {
  exitoManual.value = "";
  errorManual.value = "";
  const idNum = Number(reservaIdManual.value);
  if (!idNum || idNum <= 0) {
    errorManual.value = "Ingresá un número de reserva válido.";
    return;
  }

  cargandoManual.value = true;
  try {
    const data = await registrarCheckInManual(idNum);
    exitoManual.value = `¡Asistencia manual registrada con éxito para la reserva #${data.id}! (Origen: ADMIN)`;
    reservaIdManual.value = "";
  } catch (err: any) {
    errorManual.value =
      err?.message || "No se pudo registrar la asistencia manual.";
  } finally {
    cargandoManual.value = false;
  }
}

onMounted(cargarSalas);
</script>

<template>
  <main class="min-h-screen bg-paper font-sans text-ink">
    <AdminHeader pagina-actual="qr" />

    <div
      class="mx-auto w-[min(100%,1180px)] px-8 py-8 max-tablet:px-5 max-tablet:py-6"
    >
      <!-- Título de la página -->
      <div class="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 class="m-0 text-4xl font-bold tracking-tight">QR de salas</h1>
          <p class="mt-1 text-xs text-muted">
            Gestioná los códigos QR imprimibles para el check-in de llegada y
            salida de los alumnos en cada sala.
          </p>
        </div>
      </div>

      <!-- Alertas de éxito o error -->
      <div
        v-if="aviso"
        class="mb-6 flex items-center justify-between rounded-xl border border-forest/20 bg-mint px-5 py-3 text-xs font-semibold text-forest-deep"
      >
        <span>{{ aviso }}</span>
        <button
          type="button"
          class="cursor-pointer text-xs font-bold text-forest-deep underline hover:opacity-80"
          @click="aviso = ''"
        >
          Cerrar
        </button>
      </div>

      <div
        v-if="errorGeneral"
        class="mb-6 flex items-center justify-between rounded-xl border border-danger/30 bg-danger/10 px-5 py-3 text-xs font-semibold text-danger"
      >
        <span>{{ errorGeneral }}</span>
        <button
          type="button"
          class="cursor-pointer text-xs font-bold text-danger underline hover:opacity-80"
          @click="errorGeneral = ''"
        >
          Cerrar
        </button>
      </div>

      <!-- Estado cargando -->
      <p
        v-if="cargando"
        class="m-0 rounded-xl border border-line bg-white px-5 py-12 text-center text-tiny text-muted"
      >
        Cargando salas…
      </p>

      <div v-else class="space-y-6">
        <!-- Sin salas cargadas -->
        <div
          v-if="!salas.length"
          class="rounded-2xl border border-line bg-white p-12 text-center"
        >
          <p class="m-0 text-base font-semibold text-ink">
            No hay salas cargadas
          </p>
          <p class="mt-1 text-xs text-muted">
            No se encontraron salas activas registradas en el sistema.
          </p>
        </div>

        <!-- Listado de salas y sus QRs -->
        <div v-else class="grid grid-cols-2 gap-6 max-tablet:grid-cols-1">
          <section
            v-for="sala in salas"
            :key="sala.id"
            class="flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-card"
          >
            <div>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h2 class="text-xl font-bold text-ink">
                    {{ sala.identificador }}
                  </h2>
                  <p class="text-tiny text-muted">
                    Capacidad: {{ sala.capacidad }} personas
                    <span v-if="sala.descripcion">
                      · {{ sala.descripcion }}
                    </span>
                  </p>
                </div>
                <span
                  class="rounded-full bg-hairline px-3 py-1 text-micro font-bold uppercase tracking-wider text-muted"
                >
                  Sala
                </span>
              </div>

              <div class="my-5 border-t border-line"></div>

              <!-- Sección Código QR -->
              <div>
                <h3
                  class="text-xs font-bold uppercase tracking-wider text-muted"
                >
                  Código QR
                </h3>

                <!-- Si ya se generó en esta sesión -->
                <div
                  v-if="qrsEmitidos[Number(sala.id)]"
                  class="mt-3 flex flex-col items-center gap-4 rounded-xl border border-forest/20 bg-mint/20 p-5 text-center"
                >
                  <!-- Visualización del SVG -->
                  <div
                    class="size-48 rounded-lg bg-white p-2 shadow-xs"
                    v-html="qrsEmitidos[Number(sala.id)].qrSvg"
                  ></div>

                  <div class="text-xs text-muted">
                    <p class="m-0 font-medium text-forest-deep">
                      QR activo emitido para esta sala
                    </p>
                    <p class="m-0 mt-0.5 text-micro text-faint">
                      URL: {{ qrsEmitidos[Number(sala.id)].url }}
                    </p>
                  </div>

                  <!-- Botones de acción del QR generado -->
                  <div class="mt-2 flex flex-wrap justify-center gap-2">
                    <button
                      :class="[BOTON, 'bg-notebook-ink py-2 text-white']"
                      type="button"
                      @click="imprimir(sala, qrsEmitidos[Number(sala.id)])"
                    >
                      <svg
                        class="size-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                      >
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path
                          d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
                        />
                        <rect height="8" width="12" x="6" y="14" />
                      </svg>
                      <span>Imprimir</span>
                    </button>

                    <button
                      :class="[BOTON_SUAVE, 'py-2']"
                      type="button"
                      @click="descargarSvg(sala, qrsEmitidos[Number(sala.id)])"
                    >
                      <svg
                        class="size-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                        />
                      </svg>
                      <span>Descargar SVG</span>
                    </button>
                  </div>
                </div>

                <!-- Si no se ha emitido en esta sesión -->
                <div
                  v-else
                  class="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-hairline/40 p-6 text-center"
                >
                  <svg
                    class="size-10 text-faint"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    viewBox="0 0 24 24"
                  >
                    <rect height="5" rx="1" width="5" x="3" y="3" />
                    <rect height="5" rx="1" width="5" x="16" y="3" />
                    <rect height="5" rx="1" width="5" x="3" y="16" />
                    <path
                      d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M12 12v9M16 12h5"
                    />
                  </svg>
                  <p class="mt-2 text-xs font-semibold text-ink">
                    QR no generado en esta sesión
                  </p>
                  <p class="mt-1 text-micro text-muted max-w-xs">
                    Por motivos de seguridad, el código QR se genera y devuelve
                    una sola vez. Al generar uno nuevo, el QR anterior quedará
                    revocado.
                  </p>
                </div>
              </div>
            </div>

            <!-- Botones inferiores de la tarjeta de sala -->
            <div
              class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"
            >
              <button
                :class="[BOTON, 'bg-notebook-ink text-white']"
                type="button"
                @click="salaParaGenerar = sala"
              >
                {{
                  qrsEmitidos[Number(sala.id)] ? "Reemplazar QR" : "Generar QR"
                }}
              </button>

              <button
                class="cursor-pointer text-xs font-semibold text-danger hover:underline"
                type="button"
                @click="salaParaRevocar = sala"
              >
                Revocar QR
              </button>
            </div>
          </section>
        </div>

        <!-- SECCIÓN: Check-in manual de un alumno (PARTE 2 - Requisito 7) -->
        <section
          class="rounded-2xl border border-line bg-white p-6 shadow-card"
        >
          <div class="mb-4">
            <h2 class="text-xl font-bold text-ink">
              Check-in manual de asistencia
            </h2>
            <p class="text-xs text-muted">
              Permite registrar la llegada de un alumno de forma manual cuando
              no disponga de cámara o teléfono móvil. Requiere que la reserva
              esté confirmada y dentro del horario y plazo de tolerancia.
            </p>
          </div>

          <div
            v-if="exitoManual"
            class="mb-4 rounded-xl border border-forest/20 bg-mint px-4 py-3 text-xs font-semibold text-forest-deep"
          >
            {{ exitoManual }}
          </div>

          <div
            v-if="errorManual"
            class="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs font-semibold text-danger"
          >
            {{ errorManual }}
          </div>

          <form
            class="flex flex-wrap items-end gap-3"
            @submit.prevent="ejecutarCheckInManual"
          >
            <label :class="[ETIQUETA, 'w-64 max-tablet:w-full']">
              Número de reserva (ID)
              <input
                v-model="reservaIdManual"
                :class="CAMPO"
                inputmode="numeric"
                min="1"
                placeholder="Ej. 101"
                required
                type="number"
              />
            </label>

            <button
              :class="[BOTON, 'bg-notebook-ink text-white']"
              :disabled="cargandoManual"
              type="submit"
            >
              {{ cargandoManual ? "Registrando…" : "Registrar llegada manual" }}
            </button>
          </form>
        </section>
      </div>
    </div>

    <!-- MODAL: Confirmar Generación / Reemplazo de QR (PARTE 2 - Requisito 3) -->
    <div
      v-if="salaParaGenerar"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl"
      >
        <div class="mb-3 flex items-center gap-3 text-coral">
          <svg
            class="size-6 shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 class="text-lg font-bold text-ink">
            Generar código QR para {{ salaParaGenerar.identificador }}
          </h3>
        </div>

        <p class="text-xs leading-relaxed text-muted">
          <strong class="text-danger font-semibold">Aviso importante:</strong>
          El QR anterior de esta sala dejará de funcionar. Imprimí el nuevo.
        </p>
        <p class="mt-2 text-micro text-faint">
          El token se devuelve una sola vez por seguridad. Si cerrás la pantalla
          sin imprimir o descargar el código, deberás generar otro nuevo.
        </p>

        <div class="mt-6 flex justify-end gap-3">
          <button
            :class="BOTON_SUAVE"
            :disabled="generando"
            type="button"
            @click="salaParaGenerar = null"
          >
            Cancelar
          </button>
          <button
            :class="[BOTON, 'bg-notebook-ink text-white']"
            :disabled="generando"
            type="button"
            @click="confirmarGeneracion"
          >
            {{ generando ? "Generando…" : "Continuar y generar QR" }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Confirmar Revocación de QR (PARTE 2 - Requisito 6) -->
    <div
      v-if="salaParaRevocar"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl"
      >
        <h3 class="text-lg font-bold text-ink">
          ¿Revocar código QR de {{ salaParaRevocar.identificador }}?
        </h3>
        <p class="mt-2 text-xs leading-relaxed text-muted">
          Los alumnos ya no podrán escanear el QR actual para registrar llegada
          o salida en esta sala. Tendrás que generar e imprimir un nuevo código
          para habilitar el check-in.
        </p>

        <div class="mt-6 flex justify-end gap-3">
          <button
            :class="BOTON_SUAVE"
            :disabled="revocando"
            type="button"
            @click="salaParaRevocar = null"
          >
            Cancelar
          </button>
          <button
            :class="[BOTON, 'bg-estado-cancelado text-white']"
            :disabled="revocando"
            type="button"
            @click="confirmarRevocacion"
          >
            {{ revocando ? "Revocando…" : "Sí, revocar QR" }}
          </button>
        </div>
      </div>
    </div>

    <!-- VISTA EXCLUSIVA DE IMPRESIÓN (PARTE 2 - Requisito 5) -->
    <!-- Muestra únicamente el QR, el nombre de la sala y la leyenda solicitada -->
    <div
      v-if="salaParaImpresion"
      id="printable-qr-sign"
      class="hidden print:flex fixed inset-0 z-[9999] bg-white flex-col items-center justify-center p-12 text-center"
    >
      <div class="max-w-md flex flex-col items-center">
        <!-- Encabezado sutil institucional -->
        <p
          class="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-6"
        >
          BIBLIOTECA UTN SAN FRANCISCO
        </p>

        <!-- Código QR grande -->
        <div
          class="w-80 h-80 flex items-center justify-center p-2 border-2 border-black rounded-2xl"
          v-html="salaParaImpresion.qr.qrSvg"
        ></div>

        <!-- Nombre de la sala -->
        <h1 class="text-4xl font-extrabold tracking-tight text-black mt-8 mb-4">
          {{ salaParaImpresion.identificador }}
        </h1>

        <!-- Leyenda requerida -->
        <p class="text-xl font-medium text-gray-800 tracking-wide max-w-xs">
          Escaneá para registrar tu llegada o salida
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
@media print {
  /* Ocultar toda la interfaz visual de la aplicación durante la impresión */
  :deep(header),
  :deep(.mx-auto),
  :deep(footer) {
    display: none !important;
  }

  /* Asegurar que el contenedor imprimible sea visible en toda la hoja */
  #printable-qr-sign {
    display: flex !important;
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: #ffffff !important;
    z-index: 99999 !important;
  }
}
</style>
