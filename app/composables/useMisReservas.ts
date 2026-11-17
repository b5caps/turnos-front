import { ref } from "vue";
import { cancelarReserva, misReservas } from "~/api/reservas";
import { POLLING_INTERVALOS } from "~/constants/polling";
import { usePolling } from "~/composables/usePolling";
import type { EstadoFiltro, ReservaPropia } from "~/types/reservas";

export function useMisReservas() {
  const { usuario } = useGrebAuth();
  const reservas = ref<ReservaPropia[]>([]);
  const filtro = ref<EstadoFiltro>("todas");
  const cargando = ref(false);
  const errorMessage = ref("");
  const aviso = ref("");
  const cancelando = ref<number | null>(null);

  async function cargar(silencioso = false) {
    if (!usuario.value) {
      reservas.value = [];
      errorMessage.value = "";
      return;
    }

    if (!silencioso) {
      cargando.value = true;
      errorMessage.value = "";
    }
    try {
      reservas.value = await misReservas(usuario.value.id, filtro.value);
      if (silencioso) {
        errorMessage.value = "";
      }
    } catch (fallo) {
      if (!silencioso) {
        errorMessage.value =
          fallo instanceof Error
            ? fallo.message
            : "No pudimos conectar con el servidor. Probá de nuevo.";
      } else {
        const err = fallo as {
          status?: number;
          statusCode?: number;
          response?: { status?: number };
        };
        const status = err?.status ?? err?.statusCode ?? err?.response?.status;
        if (status === 401) throw fallo;
        // F2: Mantener datos anteriores y no borrar el listado
      }
    } finally {
      if (!silencioso) {
        cargando.value = false;
      }
    }
  }

  function filtrarPor(nuevo: EstadoFiltro) {
    if (nuevo === filtro.value) return;
    filtro.value = nuevo;
    aviso.value = "";
    cargar();
  }

  async function cancelar(id: number, motivo: string) {
    cancelando.value = id;
    errorMessage.value = "";
    aviso.value = "";
    try {
      await cancelarReserva(id, motivo);
      aviso.value = `Cancelamos la reserva #${id}.`;
      await cargar();
    } catch (fallo) {
      errorMessage.value =
        fallo instanceof Error
          ? fallo.message
          : "No pudimos cancelar la reserva.";
    } finally {
      cancelando.value = null;
    }
  }

  // Polling para mis reservas (60 segundos)
  const polling = usePolling(() => cargar(true), {
    intervaloMs: POLLING_INTERVALOS.MIS_RESERVAS,
    pausarSiOculta: true,
    activo: () => Boolean(usuario.value),
    accionEnCurso: () => cancelando.value !== null,
  });

  return {
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
    horaFormateada: polling.horaFormateada,
    refrescar: polling.refrescar,
  };
}
