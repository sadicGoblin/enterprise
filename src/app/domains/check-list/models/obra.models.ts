// Request model
export interface ObraRequest {
  caso: string;
  idObra: number;
}

// Response model
export interface ObraResponse {
  codigo: number;
  glosa: string;
  data: Obra[];
}

// Obra (Work) model
export interface Obra {
  IdObra: string;
  Obra: string;
  Codigo: string;
  Direccion: string;
  IdComuna: string;
  Comuna: string;
  FechaInicio: string;
  FechaTermino: string;
  Observaciones: string;
}
