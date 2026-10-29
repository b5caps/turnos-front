import { computed, ref, watch } from "vue";
import { todosLosTurnos } from "~/api/admin";
import type { FiltroTurno, MetricasTurnos, Turno } from "~/types/admin";

const POR_PAGINA = 10;

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function useTurnosAdmin() {
  const turnos = ref<Turno[]>([]);
  const filtro = ref<FiltroTurno>("todos");
  const busqueda = ref("");
  const pagina = ref(1);
  const cargando = ref(false);
  const errorMessage = ref("");

  const metricas = computed<MetricasTurnos>(() => ({
    pendientes: turnos.value.filter((t) => t.estado === "pendiente").length,
    activos: turnos.value.filter((t) => t.estado === "activo").length,
    cancelados: turnos.value.filter((t) => t.estado === "cancelado").length,
    notebooks: turnos.value.filter((t) => t.conNotebook).length,
  }));

  const encontrados = computed(() => {
    const porEstado =
      filtro.value === "todos"
        ? turnos.value
        : turnos.value.filter((turno) => turno.estado === filtro.value);

    const texto = normalizar(busqueda.value.trim());
    if (!texto) return porEstado;

    return porEstado.filter(
      (turno) =>
        normalizar(turno.alumno).includes(texto) ||
        normalizar(turno.email).includes(texto),
    );
  });

  const totalPaginas = computed(() =>
    Math.max(1, Math.ceil(encontrados.value.length / POR_PAGINA)),
  );

  const visibles = computed(() => {
    const desde = (pagina.value - 1) * POR_PAGINA;
    return encontrados.value.slice(desde, desde + POR_PAGINA);
  });

  // Al cambiar el filtro o la búsqueda, la página actual puede dejar de existir.
  watch([filtro, busqueda], () => {
    pagina.value = 1;
  });

  async function cargar() {
    cargando.value = true;
    errorMessage.value = "";
    try {
      turnos.value = await todosLosTurnos();
      pagina.value = 1;
    } catch (fallo) {
      turnos.value = [];
      errorMessage.value =
        fallo instanceof Error
          ? fallo.message
          : "No pudimos cargar los turnos.";
    } finally {
      cargando.value = false;
    }
  }

  function filtrarPor(nuevo: FiltroTurno) {
    filtro.value = nuevo;
  }

  function irAPagina(numero: number) {
    pagina.value = Math.min(Math.max(1, numero), totalPaginas.value);
  }

  return {
    visibles,
    encontrados,
    metricas,
    filtro,
    busqueda,
    pagina,
    totalPaginas,
    porPagina: POR_PAGINA,
    cargando,
    errorMessage,
    cargar,
    filtrarPor,
    irAPagina,
  };
}
