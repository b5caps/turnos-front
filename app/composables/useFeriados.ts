import { ref } from "vue";
import {
  agregarFeriado,
  editarFeriado,
  eliminarFeriado,
  obtenerFeriados,
  type Feriado,
} from "~/services/feriados";

export function useFeriados() {
  const feriados = ref<Feriado[]>([]);
  const cargando = ref(false);
  const guardando = ref(false);
  const fuente = ref<"API" | "CACHE" | "MOCK">("API");
  const avisoFallback = ref("");
  const errorMessage = ref("");
  const aviso = ref("");

  let timerAviso: ReturnType<typeof setTimeout> | null = null;

  function mostrarAviso(mensaje: string) {
    aviso.value = mensaje;
    if (timerAviso) clearTimeout(timerAviso);
    timerAviso = setTimeout(() => {
      aviso.value = "";
    }, 4500);
  }

  async function cargar() {
    cargando.value = true;
    errorMessage.value = "";
    try {
      const res = await obtenerFeriados();
      feriados.value = res.feriados;
      fuente.value = res.fuente;
      avisoFallback.value = res.avisoFallback || "";
    } catch {
      errorMessage.value = "No se pudieron cargar los feriados.";
    } finally {
      cargando.value = false;
    }
  }

  async function crear(fecha: string, nombre: string) {
    guardando.value = true;
    errorMessage.value = "";
    try {
      await agregarFeriado(fecha, nombre);
      await cargar();
      mostrarAviso("Feriado agregado con éxito (origen: MANUAL).");
      return true;
    } catch (err: any) {
      errorMessage.value = err?.message || "Error al agregar el feriado.";
      return false;
    } finally {
      guardando.value = false;
    }
  }

  async function actualizar(
    fechaOriginal: string,
    nuevaFecha: string,
    nuevoNombre: string,
  ) {
    guardando.value = true;
    errorMessage.value = "";
    try {
      await editarFeriado(fechaOriginal, nuevaFecha, nuevoNombre);
      await cargar();
      mostrarAviso("Feriado actualizado con éxito (origen: MANUAL).");
      return true;
    } catch (err: any) {
      errorMessage.value = err?.message || "Error al actualizar el feriado.";
      return false;
    } finally {
      guardando.value = false;
    }
  }

  async function eliminar(fecha: string) {
    guardando.value = true;
    errorMessage.value = "";
    try {
      await eliminarFeriado(fecha);
      await cargar();
      mostrarAviso("Feriado eliminado.");
      return true;
    } catch (err: any) {
      errorMessage.value = err?.message || "Error al eliminar el feriado.";
      return false;
    } finally {
      guardando.value = false;
    }
  }

  return {
    feriados,
    cargando,
    guardando,
    fuente,
    avisoFallback,
    errorMessage,
    aviso,
    cargar,
    crear,
    actualizar,
    eliminar,
  };
}
