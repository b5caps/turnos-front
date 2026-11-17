import { computed, ref, watch } from "vue";
import { cancelarTurnos, metricasDelDia, todosLosTurnos } from "~/api/admin";
import { POLLING_INTERVALOS } from "~/constants/polling";
import { usePolling } from "~/composables/usePolling";
import type { FiltroTurno, MetricasDia, Turno } from "~/types/admin";

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
  const seleccionados = ref<number[]>([]);
  const cancelando = ref(false);
  const aviso = ref("");

  const metricas = ref<MetricasDia | null>(null);

  const encontrados = computed(() => {
    const porEstado =
      filtro.value === "todos"
        ? turnos.value
        : filtro.value === "cancelado"
          ? turnos.value.filter(
              (turno) =>
                turno.estado === "cancelado" ||
                turno.estado === "liberada_por_ausencia",
            )
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

  const elegidos = computed(() =>
    turnos.value.filter((turno) => seleccionados.value.includes(turno.id)),
  );

  const cancelablesVisibles = computed(() =>
    visibles.value.filter((turno) => turno.cancelable),
  );

  const paginaElegida = computed(
    () =>
      cancelablesVisibles.value.length > 0 &&
      cancelablesVisibles.value.every((turno) =>
        seleccionados.value.includes(turno.id),
      ),
  );

  function alternar(id: number) {
    seleccionados.value = seleccionados.value.includes(id)
      ? seleccionados.value.filter((elegido) => elegido !== id)
      : [...seleccionados.value, id];
  }

  function limpiarSeleccion() {
    seleccionados.value = [];
  }

  function alternarPagina() {
    const idsVisibles = cancelablesVisibles.value.map((turno) => turno.id);
    seleccionados.value = paginaElegida.value
      ? seleccionados.value.filter((id) => !idsVisibles.includes(id))
      : [...new Set([...seleccionados.value, ...idsVisibles])];
  }

  async function cancelarSeleccionados(motivo: string) {
    if (!seleccionados.value.length) return;

    cancelando.value = true;
    errorMessage.value = "";
    aviso.value = "";
    try {
      const resultados = await cancelarTurnos(seleccionados.value, motivo);
      const fallados = resultados.filter((resultado) => !resultado.ok);
      const logrados = resultados.length - fallados.length;

      seleccionados.value = [];
      await cargar();

      if (logrados)
        aviso.value = `${logrados} ${logrados === 1 ? "turno cancelado" : "turnos cancelados"} con éxito.`;
      if (fallados.length)
        errorMessage.value = fallados
          .map((resultado) => `#${resultado.id}: ${resultado.error}`)
          .join(" · ");
    } finally {
      cancelando.value = false;
    }
  }

  watch(totalPaginas, (total) => {
    if (pagina.value > total) pagina.value = total;
  });

  watch([filtro, busqueda], () => {
    pagina.value = 1;
    seleccionados.value = [];
  });

  async function cargar(silencioso = false) {
    if (!silencioso) {
      cargando.value = true;
      errorMessage.value = "";
    }
    try {
      const [lista, resumen] = await Promise.all([
        todosLosTurnos(),
        metricasDelDia().catch(() => null),
      ]);

      // Requisito 3: Preservar seleccionados o deseleccionar si cambiaron de estado / ya no son cancelables
      if (seleccionados.value.length > 0) {
        let huboDeseleccion = false;
        const nuevosSeleccionados: number[] = [];

        for (const id of seleccionados.value) {
          const turnoNuevo = lista.find((t) => t.id === id);
          const turnoViejo = turnos.value.find((t) => t.id === id);

          if (
            !turnoNuevo ||
            !turnoNuevo.cancelable ||
            (turnoViejo && turnoViejo.estado !== turnoNuevo.estado)
          ) {
            huboDeseleccion = true;
          } else {
            nuevosSeleccionados.push(id);
          }
        }

        if (huboDeseleccion) {
          seleccionados.value = nuevosSeleccionados;
          aviso.value =
            "Algunas reservas seleccionadas cambiaron de estado y fueron deseleccionadas.";
        }
      }

      turnos.value = lista;
      if (resumen) {
        metricas.value = resumen;
      }
      if (silencioso) {
        errorMessage.value = "";
      }
    } catch (fallo) {
      if (!silencioso) {
        turnos.value = [];
        errorMessage.value =
          fallo instanceof Error
            ? fallo.message
            : "No pudimos cargar los turnos.";
      } else {
        const err = fallo as {
          status?: number;
          statusCode?: number;
          response?: { status?: number };
        };
        const status = err?.status ?? err?.statusCode ?? err?.response?.status;
        if (status === 401) throw fallo;
        // F2: Mantener datos anteriores y mostrar aviso discreto sin borrar pantalla
        aviso.value = "No pudimos conectar con el servidor. Probá de nuevo.";
      }
    } finally {
      if (!silencioso) {
        cargando.value = false;
      }
    }
  }

  // Polling para panel de turnos y KPI (30 segundos)
  const polling = usePolling(() => cargar(true), {
    intervaloMs: POLLING_INTERVALOS.ADMIN_TURNOS,
    pausarSiOculta: true,
    accionEnCurso: () => cancelando.value,
  });

  function filtrarPor(nuevo: FiltroTurno) {
    filtro.value = nuevo;
  }

  function irAPagina(numero: number) {
    pagina.value = Math.min(Math.max(1, numero), totalPaginas.value);
  }

  return {
    visibles,
    seleccionados,
    elegidos,
    cancelablesVisibles,
    paginaElegida,
    cancelando,
    aviso,
    alternar,
    alternarPagina,
    limpiarSeleccion,
    cancelarSeleccionados,
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
    horaFormateada: polling.horaFormateada,
    refrescar: polling.refrescar,
  };
}
