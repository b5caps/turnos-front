import { rolDeLaSesion } from "~/api/admin";

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;
  if (rolDeLaSesion() !== "ADMIN") return navigateTo("/admin/login");
});
