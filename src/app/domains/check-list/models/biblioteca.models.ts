// Request model
export interface BibliotecaRequest {
  caso: string;
  iDBiblioteca?: number;
}

// Response model
export interface BibliotecaResponse {
  codigo: number;
  glosa: string;
  data: BibliotecaItem[];
}

// Biblioteca Item model
export interface BibliotecaItem {
  IdBiblioteca: string;
  Titulo: string;
  Nombre: string;
  IdTipo: string;
  Tipo: string;
  Agnio: string;
  Documento?: string;
}
