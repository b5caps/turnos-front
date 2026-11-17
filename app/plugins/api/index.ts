import { client } from "~/utils/openapi-gen/client.gen";
import * as api from "~/utils/openapi-gen";
import { limpiarToken, limpiarUsuarioRol, obtenerToken } from "~/api/auth";

export default defineNuxtPlugin(() => {
  client.setConfig({
    baseUrl: useRuntimeConfig().public.apiBase,
  });

  client.interceptors.request.use((request) => {
    const token = obtenerToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  });

  client.interceptors.error.use((error, response, request) => {
    if (response?.status === 401) {
      const url = request?.url || "";
      if (
        !url.includes("/api/auth/login") &&
        !url.includes("/api/auth/registro")
      ) {
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
      }
    }
    return error;
  });

  return {
    provide: {
      api,
    },
  };
});
