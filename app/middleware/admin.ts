import { rolDeLaSesion } from "~/api/admin";

export default defineNuxtRouteMiddleware(() => {
  // El rol vive en el token, que solo existe en el navegador.
  if (import.meta.server) return;
  if (rolDeLaSesion() !== "ADMIN") return navigateTo("/admin/login");
});
