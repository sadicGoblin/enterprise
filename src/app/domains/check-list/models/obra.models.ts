// Request model
export interface ObraRequest {
  caso: string;
  idObra: number;
  idUsuario?: number;
}

// Response model
export interface ObraResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T[];
  
  // Legacy fields
  codigo?: number;
  glosa?: string;
}

// Specific response types
export interface ObrasFullResponse extends ObraResponse<Obra> {}
export interface ObrasSimpleResponse extends ObraResponse<ObraSimple> {}

// Obra (Work) model - Full version
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

// Simple version of Obra for drop-downs
export interface ObraSimple {
  IdObra: string;
  Obra: string;
}
