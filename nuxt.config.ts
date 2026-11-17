// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devServer: {
    port: 5000,
  },
  runtimeConfig: {
    public: {
      apiBase: import.meta.env.NUXT_PUBLIC_API_BASE,
      usarApiBloqueos: import.meta.env.NUXT_PUBLIC_USAR_API_BLOQUEOS ?? "true",
      usarApiFeriados: import.meta.env.NUXT_PUBLIC_USAR_API_FERIADOS ?? "true",
      usarApiAsistencia:
        import.meta.env.NUXT_PUBLIC_USAR_API_ASISTENCIA ?? "true",
      usarMockAuth: import.meta.env.NUXT_PUBLIC_USAR_MOCK_AUTH ?? "false",
    },
  },
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      title: "GREB",
      link: [
        { rel: "icon", type: "image/png", href: "/logo%20utn%20blanco.png" },
      ],
    },
  },
});
