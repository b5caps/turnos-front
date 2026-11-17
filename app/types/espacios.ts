export type TipoRecursoEspacio = "SALA" | "NOTEBOOK";

export interface EspacioSala {
  id: string | number;
  identificador: string;
  capacidad: number;
  descripcion: string | null;
  activo: boolean;
  tipoRecurso: TipoRecursoEspacio;
}
