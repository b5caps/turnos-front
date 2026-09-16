import { client } from "~/utils/openapi-gen/client.gen";
import * as api from "~/utils/openapi-gen";

export default defineNuxtPlugin((nuxtApp) => {
    client.setConfig({
        baseUrl: useRuntimeConfig().public.apiBase,
    });

    // Expose to useNuxtApp().$customFetch
    return {
        provide: {
            api: api,
        },
    };
});
