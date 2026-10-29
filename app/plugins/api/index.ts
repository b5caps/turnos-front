import { client } from "~/utils/openapi-gen/client.gen";
import * as api from "~/utils/openapi-gen";
import { obtenerToken } from "~/api/auth";

export default defineNuxtPlugin(() => {
  client.setConfig({
    baseUrl: useRuntimeConfig().public.apiBase,
  });

  client.interceptors.request.use((request) => {
    const token = obtenerToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  });

  return {
    provide: {
      api,
    },
  };
});
