import { computed, ref } from "vue";
import {
  contarReservasEnRango,
  crearBloqueo,
  eliminarBloqueo,
  listarBloqueos,
  listarEspaciosActivos,
  type Bloqueo,
  type CrearBloqueoInput,
} from "~/services/bloqueos";
import { hoyIso, partesDeIso, sumarDias } from "~/constants/horarios";
import type { EspacioSala } from "~/types/espacios";

export function useBloqueosAdmin() {
  const bloqueos = ref<Bloqueo[]>([]);
  const salas = ref<EspacioSala[]>([]);
  const cargando = ref(false);
  const guardando = ref(false);
  const errorMessage = ref("");
  const aviso = ref("");

  // Día seleccionado del panel
  const fechaSeleccionada = ref<string>(hoyIso());
  const esHoy = computed(() => fechaSeleccionada.value === hoyIso());

  let timerAviso: ReturnType<typeof setTimeout> | null = null;

  function mostrarAviso(mensaje: string) {
    aviso.value = mensaje;
    if (timerAviso) clearTimeout(timerAviso);
    timerAviso = setTimeout(() => {
      aviso.value = "";
    }, 4500);
  }

  function irAFecha(nuevaFecha: string) {
    if (!nuevaFecha) return;
    fechaSeleccionada.value = nuevaFecha;
  }

  function moverDias(dias: number) {
    fechaSeleccionada.value = sumarDias(fechaSeleccionada.value, dias);
  }

  function irAHoy() {
    fechaSeleccionada.value = hoyIso();
  }

  // Bloqueos que aplican al día seleccionado
  const bloqueosDelDia = computed(() => {
    const fSel = fechaSeleccionada.value;
    return bloqueos.value.filter((b) => {
      const fIni = partesDeIso(b.fechaHoraInicio).fecha;
      const fFin = b.fechaHoraFin
        ? partesDeIso(b.fechaHoraFin).fecha
        : "9999-12-31";
      return fSel >= fIni && fSel <= fFin;
    });
  });

  async function cargar() {
    cargando.value = true;
    errorMessage.value = "";
    try {
      const [listaBloqueos, listaSalas] = await Promise.all([
        listarBloqueos(),
        listarEspaciosActivos(),
      ]);
      bloqueos.value = listaBloqueos;
      salas.value = listaSalas;
    } catch (err: any) {
      errorMessage.value =
        err?.message ||
        "No pudimos cargar los bloqueos ni los espacios disponibles.";
    } finally {
      cargando.value = false;
    }
  }

  async function crear(
    recursoId: number | null,
    input: CrearBloqueoInput,
  ): Promise<boolean> {
    guardando.value = true;
    errorMessage.value = "";
    try {
      const resultado = await crearBloqueo(recursoId, input);
      const alcance =
        recursoId === null ? "todas las salas" : obtenerNombreSala(recursoId);
      const canceladas = resultado.reservasCanceladas;
      const detalle = canceladas
        ? ` Se cancelaron ${canceladas} ${canceladas === 1 ? "reserva" : "reservas"}.`
        : "";
      mostrarAviso(`Bloqueo registrado para ${alcance}.${detalle}`);
      await cargar();
      return true;
    } catch (err: any) {
      errorMessage.value =
        err?.message || "Ocurrió un error al guardar el bloqueo.";
      return false;
    } finally {
      guardando.value = false;
    }
  }

  async function eliminar(bloqueoId: number) {
    guardando.value = true;
    errorMessage.value = "";
    try {
      await eliminarBloqueo(bloqueoId);
      bloqueos.value = bloqueos.value.filter((b) => b.id !== bloqueoId);
      mostrarAviso("Bloqueo eliminado correctamente.");
    } catch (err: any) {
      errorMessage.value = err?.message || "No se pudo eliminar el bloqueo.";
    } finally {
      guardando.value = false;
    }
  }

  function obtenerNombreSala(recursoId: number | null): string {
    if (recursoId === null) return "Todas las salas";
    const encontrada = salas.value.find((s) => s.id === recursoId);
    return encontrada ? encontrada.identificador : `Sala #${recursoId}`;
  }

  async function verificarReservasAfectadas(
    horaInicio: string,
    horaFin: string,
    recursoId: number | null,
  ): Promise<number> {
    const salaNombre =
      recursoId === null ? undefined : obtenerNombreSala(recursoId);
    return contarReservasEnRango(
      fechaSeleccionada.value,
      horaInicio,
      horaFin,
      recursoId,
      salaNombre,
    );
  }

  return {
    bloqueos,
    bloqueosDelDia,
    salas,
    cargando,
    guardando,
    errorMessage,
    aviso,
    fechaSeleccionada,
    esHoy,
    irAFecha,
    moverDias,
    irAHoy,
    cargar,
    crear,
    eliminar,
    obtenerNombreSala,
    verificarReservasAfectadas,
  };
}
