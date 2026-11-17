import { computed, ref } from "vue";
import {
  bloquearTodasLasSalas,
  contarReservasEnRango,
  crearBloqueo,
  eliminarBloqueo,
  listarBloqueos,
  listarEspaciosActivos,
  type Bloqueo,
  type CrearBloqueoInput,
} from "~/services/bloqueos";
import { hoyIso, sumarDias } from "~/constants/horarios";
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
      const fIni = b.fechaHoraInicio.slice(0, 10);
      const fFin = b.fechaHoraFin ? b.fechaHoraFin.slice(0, 10) : "9999-12-31";
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
    espacioId: number | null,
    input: CrearBloqueoInput,
  ): Promise<boolean> {
    guardando.value = true;
    errorMessage.value = "";
    try {
      if (espacioId === null) {
        // Bloquear todas las salas activas
        const res = await bloquearTodasLasSalas(input);
        if (res.fallidos.length === 0) {
          mostrarAviso(
            `Se bloquearon exitosamente las ${res.exitosos.length} salas activas.`,
          );
          await cargar();
          return true;
        }

        if (res.exitosos.length > 0) {
          errorMessage.value = `Se bloquearon: ${res.exitosos
            .map((e) => e.salaNombre)
            .join(", ")}. Fallaron: ${res.fallidos
            .map((f) => `${f.salaNombre} (${f.error})`)
            .join("; ")}`;
          await cargar();
          return false;
        }

        errorMessage.value = `No se pudo bloquear ninguna sala: ${res.fallidos
          .map((f) => `${f.salaNombre} (${f.error})`)
          .join("; ")}`;
        return false;
      }

      // Bloquear una sala específica
      await crearBloqueo(espacioId, input);
      mostrarAviso("Bloqueo registrado exitosamente.");
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

  async function eliminar(recursoId: number, bloqueoId: number) {
    guardando.value = true;
    errorMessage.value = "";
    try {
      await eliminarBloqueo(recursoId, bloqueoId);
      bloqueos.value = bloqueos.value.filter(
        (b) => !(b.id === bloqueoId && b.recursoId === recursoId),
      );
      mostrarAviso("Bloqueo eliminado correctamente.");
    } catch (err: any) {
      errorMessage.value = err?.message || "No se pudo eliminar el bloqueo.";
    } finally {
      guardando.value = false;
    }
  }

  function obtenerNombreSala(recursoId: number): string {
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
