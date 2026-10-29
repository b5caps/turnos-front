import { ref } from "vue";
import { cancelarReserva, misReservas } from "~/api/reservas";
import type { EstadoFiltro, ReservaPropia } from "~/types/reservas";

export function useMisReservas() {
  const { usuario } = useGrebAuth();
  const reservas = ref<ReservaPropia[]>([]);
  const filtro = ref<EstadoFiltro>("todas");
  const cargando = ref(false);
  const errorMessage = ref("");
  const aviso = ref("");
  const cancelando = ref<number | null>(null);

  async function cargar() {
    if (!usuario.value) {
      reservas.value = [];
      errorMessage.value = "";
      return;
    }

    cargando.value = true;
    errorMessage.value = "";
    try {
      reservas.value = await misReservas(usuario.value.id, filtro.value);
    } catch (fallo) {
      reservas.value = [];
      errorMessage.value =
        fallo instanceof Error
          ? fallo.message
          : "No pudimos cargar tus reservas.";
    } finally {
      cargando.value = false;
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
  };
}
