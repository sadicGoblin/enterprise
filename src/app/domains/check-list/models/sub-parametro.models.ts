export interface SubParametroRequest {
  caso: string;
  idEnt: number;
}

export interface SubParametroResponse {
  // Support both old and new API formats
  codigo?: number;
  glosa?: string;
  // New API format
  success?: boolean;
  message?: string;
  data: SubParametroItem[];
}

export interface SubParametroItem {
  IdDet: string;
  IdSubParam: string;
  Nombre: string;
}
