import { client } from "~/utils/openapi-gen/client.gen";
import type { EspacioSala, TipoRecursoEspacio } from "~/types/espacios";

function mapearEspacio(e: any): EspacioSala {
  return {
    id: Number(e.id),
    identificador: e.nombre || e.identificador || `Sala #${e.id}`,
    capacidad: Number(e.capacidad) || 0,
    descripcion: e.descripcion ?? null,
    activo: e.activo !== false,
    tipoRecurso: (e.tipoRecurso as TipoRecursoEspacio) || "SALA",
  };
}

export async function listarEspacios(): Promise<EspacioSala[]> {
  try {
    const config = client.getConfig();
    if (!config.baseUrl) {
      const apiBase =
        useRuntimeConfig()?.public?.apiBase || "http://localhost:3000";
      client.setConfig({ baseUrl: apiBase });
    }

    const { data, error } = await client.get<{ data: any[] }>({
      url: "/api/espacios",
    });

    if (error || !data?.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map(mapearEspacio);
  } catch {
    return [];
  }
}

export async function listarEspaciosActivos(): Promise<EspacioSala[]> {
  const lista = await listarEspacios();
  return lista.filter((e) => e.activo !== false);
}
