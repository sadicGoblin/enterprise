// Request model
export interface ActividadRequest {
  caso: string;
  idObra?: number;
  idActividad?: number;
}

// Response model - Siguiendo el patrón de otros modelos de respuesta
export interface ActividadResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T[];
  
  // Legacy fields
  codigo?: number;
  glosa?: string;
}

// Specific response type for inspecciones SSTMA
export interface InspeccionSSTMAResponse extends ActividadResponse<InspeccionSSTMA> {}

// Modelo para inspecciones SSTMA basado en la respuesta real del API
export interface InspeccionSSTMA {
  idInspeccionSSTMA: string;
  idObra: string;
  Obra: string;
  fecha: string;
  idEmpresa: string;
  empresa: string;
  areaTrabajo: string;
  accion: string;
  idPotencialGravedad: string;
  potencialGravedad: string;
  idAmbitoInvolucrado: string;
  ambitoInvolucrado: string;
  trabajoAsociado: string;
  idRiesgoAsociado: string;
  riesgoAsociado: string;
  medidaControl: string;
  idProfesionalResponsable: string;
  profesionalResponsable: string;
  comunicadoA: string;
  idUsuarioCreacion: string;
  usuarioCreacion: string;
  correoA: string;
}
