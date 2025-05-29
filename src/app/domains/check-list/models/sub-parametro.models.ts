export interface SubParametroRequest {
  caso: string;
  idEnt: number;
}

export interface SubParametroResponse {
  codigo: number;
  glosa: string;
  data: SubParametroItem[];
}

export interface SubParametroItem {
  IdDet: string;
  IdSubParam: string;
  Nombre: string;
}
