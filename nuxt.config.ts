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
        },
    },
    devtools: { enabled: true },
    css: ["~/assets/css/main.css"],
    vite: {
        plugins: [tailwindcss()],
    },
});
