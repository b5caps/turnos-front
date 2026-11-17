import {
  computed,
  getCurrentInstance,
  onMounted,
  onScopeDispose,
  onUnmounted,
  ref,
  type Ref,
} from "vue";
import { limpiarToken, limpiarUsuarioRol } from "~/api/auth";

export interface PollingOptions {
  intervaloMs: number;
  pausarSiOculta?: boolean;
  inmediato?: boolean;
  activo?: Ref<boolean> | (() => boolean);
  accionEnCurso?: Ref<boolean> | (() => boolean);
  onError?: (error: unknown) => void;
}

export function usePolling(
  fn: () => Promise<void> | void,
  options: PollingOptions,
) {
  const pausarSiOculta = options.pausarSiOculta ?? true;
  const ultimaActualizacion = ref<Date | null>(null);
  let timer: ReturnType<typeof setInterval> | null = null;
  let ejecutando = false;

  const horaFormateada = computed(() => {
    if (!ultimaActualizacion.value) return "";
    const d = ultimaActualizacion.value;
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  });

  async function ejecutar() {
    if (ejecutando) return;

    // Pausar si la pestaña está oculta
    if (pausarSiOculta && typeof document !== "undefined" && document.hidden) {
      return;
    }

    // Verificar si está activo condicionalmente
    const estaActivo =
      typeof options.activo === "function"
        ? options.activo()
        : (options.activo?.value ?? true);
    if (!estaActivo) return;

    // Requisito 5: mientras haya una acción en curso, no disparar refresco
    const hayAccionEnCurso =
      typeof options.accionEnCurso === "function"
        ? options.accionEnCurso()
        : (options.accionEnCurso?.value ?? false);
    if (hayAccionEnCurso) return;

    ejecutando = true;
    try {
      await fn();
      ultimaActualizacion.value = new Date();
    } catch (error) {
      // Ante 401, detener polling y redirigir al login (F3)
      const err = error as {
        status?: number;
        statusCode?: number;
        response?: { status?: number };
      };
      const status = err?.status ?? err?.statusCode ?? err?.response?.status;
      if (status === 401) {
        detener();
        limpiarToken();
        limpiarUsuarioRol();
        if (import.meta.client) {
          const ruta = window.location.pathname;
          if (ruta.startsWith("/admin")) {
            navigateTo("/admin/login?error=sesion_vencida");
          } else {
            navigateTo("/?error=sesion_vencida");
          }
        }
        return;
      }

      if (options.onError) {
        options.onError(error);
      }
    } finally {
      ejecutando = false;
    }
  }

  function onVisibilityChange() {
    if (!pausarSiOculta || typeof document === "undefined") return;
    if (!document.hidden) {
      // Reanudar y refrescar de inmediato al volver a la pestaña
      ejecutar();
    }
  }

  function onWindowFocus() {
    ejecutar();
  }

  function iniciar() {
    detener();
    if (import.meta.client) {
      timer = setInterval(ejecutar, options.intervaloMs);
      if (pausarSiOculta) {
        document.addEventListener("visibilitychange", onVisibilityChange);
      }
      window.addEventListener("focus", onWindowFocus);
      if (options.inmediato) {
        ejecutar();
      }
    }
  }

  function detener() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (import.meta.client) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onWindowFocus);
    }
  }

  async function refrescar() {
    await ejecutar();
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      iniciar();
    });
    onScopeDispose(() => {
      detener();
    });
    onUnmounted(() => {
      detener();
    });
  }

  return {
    ultimaActualizacion,
    horaFormateada,
    iniciar,
    detener,
    refrescar,
  };
}
