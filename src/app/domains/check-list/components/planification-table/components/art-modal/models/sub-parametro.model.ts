export interface SubParametroRequest {
  caso: string;
  idEnt: number;
}

export interface SubParametroItem {
  IdDet: string;
  IdSubParam: string;
  Nombre: string;
}

export interface SubParametroResponse {
  code: number;
  data: SubParametroItem[];
}
