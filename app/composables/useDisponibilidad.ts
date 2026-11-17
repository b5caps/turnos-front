import { computed, ref } from "vue";
import {
  BLOQUE_MINUTOS,
  hoyIso,
  horaAMinutos,
  sumarDias,
} from "~/constants/horarios";
import { disponibilidadDelDia } from "~/api/disponibilidad";
import { bloqueosActivosParaFecha, type Bloqueo } from "~/services/bloqueos";
import { esFeriado, type Feriado } from "~/services/feriados";
import type {
  BloqueDisponibilidad,
  DisponibilidadDia,
  EstadoBloque,
  RecursoDisponibilidad,
} from "~/types/disponibilidad";

function aplicarBloqueosADia(
  diaDatos: DisponibilidadDia,
  bloqueos: Bloqueo[],
  fechaStr: string,
) {
  for (const blq of bloqueos) {
    const fIni = blq.fechaHoraInicio.slice(0, 10);
    const fFin = blq.fechaHoraFin
      ? blq.fechaHoraFin.slice(0, 10)
      : "9999-12-31";
    if (fechaStr < fIni || fechaStr > fFin) continue;

    const hIni = blq.fechaHoraInicio.slice(11, 16);
    const hFin = blq.fechaHoraFin ? blq.fechaHoraFin.slice(11, 16) : "23:59";
    const minIni = horaAMinutos(hIni);
    const minFin = horaAMinutos(hFin);

    for (const recurso of diaDatos.recursos) {
      if (recurso.tipo !== "SALA") continue;
      if (
        blq.recursoId !== undefined &&
        String(blq.recursoId) !== String(recurso.id)
      ) {
        continue;
      }

      for (const bloque of recurso.bloques) {
        const bMin = horaAMinutos(bloque.inicio);
        if (bMin >= minIni && bMin < minFin) {
          bloque.disponible = false;
          bloque.motivoNoDisponible = "bloqueado";
          bloque.motivoBloqueo = blq.motivo;
          bloque.cuposLibres = 0;
        }
      }
    }
  }
}

function consultarDisponibilidad(fecha: string): Promise<DisponibilidadDia> {
  return disponibilidadDelDia(fecha);
}

export function useDisponibilidad() {
  const bloques = computed(() => dia.value?.bloques ?? []);
  const fecha = ref(hoyIso());
  const salaSeleccionada = ref<number | null>(null);
  const dia = ref<DisponibilidadDia | null>(null);
  const cargando = ref(false);
  const errorMessage = ref("");

  const abierta = computed(() => Boolean(dia.value?.abierta));
  const esHoy = computed(() => fecha.value === hoyIso());
  const salas = computed(
    () =>
      dia.value?.recursos.filter((recurso) => recurso.tipo === "SALA") ?? [],
  );
  const notebooks = computed(
    () =>
      dia.value?.recursos.find((recurso) => recurso.tipo === "NOTEBOOK") ??
      null,
  );

  const minutosAhora = computed(() => {
    if (!esHoy.value) return -1;
    const ahora = new Date();
    return ahora.getHours() * 60 + ahora.getMinutes();
  });

  const desdeVisible = computed(() => {
    if (!esHoy.value) return 0;
    const indice = bloques.value.findIndex(
      (inicio) => horaAMinutos(inicio) + BLOQUE_MINUTOS > minutosAhora.value,
    );
    return indice < 0 ? bloques.value.length : indice;
  });

  const bloquesVisibles = computed(() =>
    bloques.value.slice(desdeVisible.value),
  );

  const recursosVisibles = computed<RecursoDisponibilidad[]>(() => {
    const elegidas =
      salaSeleccionada.value === null
        ? salas.value
        : salas.value.filter((sala) => sala.id === salaSeleccionada.value);
    const lista = notebooks.value ? [...elegidas, notebooks.value] : elegidas;
    return lista.map((recurso) => ({
      ...recurso,
      bloques: recurso.bloques.slice(desdeVisible.value),
    }));
  });

  const feriadoActual = ref<Feriado | null>(null);
  const motivoCierreDia = ref<string | null>(null);

  async function cargar(silencioso = false) {
    if (!silencioso) {
      cargando.value = true;
      errorMessage.value = "";
      motivoCierreDia.value = null;
    }
    try {
      const [datos, bloqueos, feriado] = await Promise.all([
        consultarDisponibilidad(fecha.value),
        bloqueosActivosParaFecha(fecha.value),
        esFeriado(fecha.value),
      ]);

      feriadoActual.value = feriado;

      if (datos) {
        if (feriado) {
          // El feriado inhabilita reservas para todo el día
          datos.abierta = false;
          motivoCierreDia.value = feriado.nombre;
        }
        if (bloqueos.length > 0) {
          aplicarBloqueosADia(datos, bloqueos, fecha.value);

          // Verificar si hay un bloqueo que cierre el día completo
          const bloqueoDiaCompleto = bloqueos.find((b) => {
            const hIni = b.fechaHoraInicio.slice(11, 16);
            const hFin = b.fechaHoraFin
              ? b.fechaHoraFin.slice(11, 16)
              : "23:59";
            return (
              hIni <= "10:00" &&
              (hFin >= "22:00" || !b.fechaHoraFin || hFin === "23:59")
            );
          });
          if (bloqueoDiaCompleto && !motivoCierreDia.value) {
            motivoCierreDia.value = bloqueoDiaCompleto.motivo;
          }

          // Asignar motivo a cualquier bloque bloqueado que no lo tenga aún
          for (const recurso of datos.recursos) {
            for (const b of recurso.bloques) {
              if (b.motivoNoDisponible === "bloqueado" && !b.motivoBloqueo) {
                const bMin = horaAMinutos(b.inicio);
                const blq = bloqueos.find((bl) => {
                  if (
                    bl.recursoId !== undefined &&
                    bl.recursoId !== null &&
                    String(bl.recursoId) !== String(recurso.id)
                  ) {
                    return false;
                  }
                  const minIni = horaAMinutos(bl.fechaHoraInicio.slice(11, 16));
                  const minFin = bl.fechaHoraFin
                    ? horaAMinutos(bl.fechaHoraFin.slice(11, 16))
                    : 24 * 60;
                  return bMin >= minIni && bMin < minFin;
                });
                b.motivoBloqueo = blq?.motivo || "Bloqueo por biblioteca";
              }
            }
          }
        }
      }
      dia.value = datos;
      if (silencioso) {
        errorMessage.value = "";
      }
    } catch (fallo) {
      if (!silencioso) {
        dia.value = null;
        errorMessage.value =
          "No pudimos cargar la disponibilidad. Volvé a intentarlo.";
      } else {
        const err = fallo as {
          status?: number;
          statusCode?: number;
          response?: { status?: number };
        };
        const status = err?.status ?? err?.statusCode ?? err?.response?.status;
        if (status === 401) throw fallo;
      }
    } finally {
      if (!silencioso) {
        cargando.value = false;
      }
    }
  }

  function irAFecha(nuevaFecha: string) {
    if (!nuevaFecha) return;
    const destino = nuevaFecha < hoyIso() ? hoyIso() : nuevaFecha;
    if (destino === fecha.value) return;
    fecha.value = destino;
    cargar();
  }

  function moverDias(dias: number) {
    const objetivo = sumarDias(fecha.value, dias);
    if (dias < 0 && objetivo < hoyIso()) {
      irAFecha(hoyIso());
      return;
    }
    irAFecha(objetivo);
  }

  function irAHoy() {
    irAFecha(hoyIso());
  }

  function seleccionarSala(id: number | null) {
    salaSeleccionada.value = salaSeleccionada.value === id ? null : id;
  }

  function estadoDe(bloque: BloqueDisponibilidad): EstadoBloque {
    if (horaAMinutos(bloque.inicio) + BLOQUE_MINUTOS <= minutosAhora.value)
      return "pasado";
    if (bloque.disponible) return "disponible";
    return bloque.motivoNoDisponible ?? "sin_cupos";
  }

  function duracionesPosibles(recursoId: number, inicio: string) {
    const recurso = dia.value?.recursos.find((item) => item.id === recursoId);
    const desde = bloques.value.indexOf(inicio);
    if (!recurso || desde < 0) return [];

    const duraciones: number[] = [];
    for (let i = desde; i < recurso.bloques.length; i++) {
      const bloque = recurso.bloques[i];
      if (!bloque || estadoDe(bloque) !== "disponible") break;
      duraciones.push((i - desde + 1) * BLOQUE_MINUTOS);
    }
    return duraciones;
  }

  function notebooksEnVentana(inicio: string, duracion: number) {
    const desde = bloques.value.indexOf(inicio);
    if (!notebooks.value || desde < 0 || duracion <= 0) return 0;

    let menor = notebooks.value.capacidad;
    for (let i = desde; i < desde + duracion / BLOQUE_MINUTOS; i++) {
      const bloque = notebooks.value.bloques[i];
      if (!bloque || estadoDe(bloque) !== "disponible") return 0;
      menor = Math.min(menor, bloque.cuposLibres);
    }
    return menor;
  }

  return {
    bloques: bloquesVisibles,
    fecha,
    cargando,
    errorMessage,
    abierta,
    esHoy,
    feriadoActual,
    motivoCierreDia,
    salas,
    salaSeleccionada,
    recursosVisibles,
    cargar,
    irAFecha,
    moverDias,
    irAHoy,
    seleccionarSala,
    estadoDe,
    duracionesPosibles,
    notebooksEnVentana,
  };
}
