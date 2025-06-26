export interface ControlApiRequest {
  caso: string;
  idObra: number;
  idUsuario: number;
  periodo: number;
}

export interface ControlApiResponse {
  IdControl: string;
  IdObra: string;
  Obra: string;
  IdUsuario: string;
  Usuario: string;
  Periodo: string;
  IdEtapaConst: string;
  EtapaConst: string;
  IdSubProceso: string;
  SubProceso: string;
  IdAmbito: string;
  Ambito: string;
  IdActividad: string;
  Actividad: string;
  IdPeriocidad: string;
  Periocidad: string;
  idCategoria: string;
  idParam: string;
  dias: string;
}
