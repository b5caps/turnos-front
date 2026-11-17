import { rolDeLaSesion } from "~/api/admin";

export default defineNuxtRouteMiddleware(() => {
  if (rolDeLaSesion() !== "ADMIN") return navigateTo("/admin/login");
});
