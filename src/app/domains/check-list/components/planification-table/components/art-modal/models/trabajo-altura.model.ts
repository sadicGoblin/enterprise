export interface TrabajoAlturaRequest {
  caso: string;
  idTrabajoAltura: number;
  idControl: number;
  dia: number;
  idArea: number;
  fecha: string;
  idRealizadoPor: number;
  idRealizadoPorCargo: number;
  RealizadoPorfecha: string;
  idRevisadoPor: number;
  idRevisadoPorCargo: number;
  RevisadoPorFecha: string;
  observaciones: string | null;
  idSubParametro: number;
  idInspeccionadoPor: number;
}

export interface ElementoInspeccion {
  idElementoInspeccionar: string;
  idTrabajoAlturaDetalle: string;
  idTrabajoAltura: string;
  IdSubParam: string;
  elementoInspeccionar: string;
  si: string;
  no: string;
  na: string;
  idResponsable: string;
  fecha: string;
}

export interface TrabajoAlturaResponse {
  code: number;
  data: ElementoInspeccion[];
}
