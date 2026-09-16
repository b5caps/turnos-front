import { client } from "~/utils/openapi-gen/client.gen";

client.setConfig({
    baseUrl: $config,
});

export * as api from "~/utils/openapi-gen";
export type * as schema from "~/utils/openapi-gen/types.gen";
