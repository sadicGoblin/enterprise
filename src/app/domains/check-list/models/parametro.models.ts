export interface ParametroRequest {
  caso: string;
  idCab: number;
}

export interface ParametroResponse {
  success?: boolean;
  code?: number;
  message?: string;
  data: ParametroItem[];
}

export interface ParametroItem {
  IdDet: string;
  IdCab: string;
  Nombre: string;
  Alias: string;
  Codigo: string;
  IdPeriocidad: string;
  Periocidad: string;
  idCategoria: string;
  idParam: string;
}
