/**
 * Modelo de datos para el módulo de accidentes
 * Conectado con API: POST /ws/AccidentesSvcImpl.php
 */

// =============================================
// RESPUESTA API - Estructura plana de vista_accidentes_completa
// =============================================

export interface AccidenteApiResponse {
  IdAccidente: string;
  NumeroAccidente: string;
  IdObra: string;
  IdEmpresa: string;
  IdTrabajador: string;
  IdTipoAccidente: string | null;
  DiasPerdidosEstimados: string | null;
  DiasPerdidosFinal: string | null;
  NumEnfermedadProfesional: string | null;
  NombreObra: string;
  CodigoObra: string | null;
  EstadoObra: string;
  DescripcionObra: string | null;
  NombreEmpresa: string;
  FechaAccidente: string | null;
  HoraAccidente: string | null;
  FechaControl: string | null;
  FechaAlta: string | null;
  Descripcion: string | null;
  DiaSemana: string | null;
  NombreTrabajador: string;
  RUTTrabajador: string | null;
  EdadAlAccidente: string | null;
  IdCargo: string | null;
  Cargo: string | null;
  IdRiesgoAsociado: string | null;
  RiesgoAsociado: string | null;
  IdLesion: string | null;
  TipoLesion: string | null;
  IdParteCuerpo: string | null;
  ParteCuerpo: string | null;
  CalificacionPS: CalificacionPotencialSeveridad | null;
  FuenteAgente: string | null;
  Accion: string | null;
  Condicion: string | null;
  IdMaquinaEquipo: string | null;
  MaquinaEquipo: string | null;
  IdSupervisor: string | null;
  Supervisor: string | null;
  IdPTerreno: string | null;
  PTerreno: string | null;
  IdAPR: string | null;
  APR: string | null;
  IdADO: string | null;
  ADO: string | null;
  IdCausaRaiz: string | null;
  CausaRaiz: string | null;
  CtrlE: string | null;
  CtrlS: string | null;
  CtrlI: string | null;
  CtrlA: string | null;
  CtrlEPP: string | null;
  Observaciones: string | null;
  TipoAccidente: string | null;
  CategoriaTipoAccidente: string | null;
  /** ENUM backend: `Anulado` (comparación en UI tolera variantes de mayúsculas). */
  Estado: string;
  FechaReporte: string;
  created_at: string;
  updated_at: string | null;
}

// =============================================
// RESPUESTA GENÉRICA DE LA API
// =============================================

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

// =============================================
// REQUEST PARA CREAR ACCIDENTE
// =============================================

export interface CrearAccidenteRequest {
  caso: 'Crea';
  IdObra: number;
  IdTrabajador: number;
  IdEmpresa?: number;
  FechaAccidente?: string;         // YYYY-MM-DD
  HoraAccidente?: string;          // HH:MM
  IdTipoAccidente?: number;
  Descripcion?: string;
  NumEnfermedadProfesional?: string;
  DiasPerdidosEstimados?: number;
  DiasPerdidosFinal?: number;
  FechaControl?: string;           // YYYY-MM-DD
  FechaAlta?: string;             // YYYY-MM-DD
  IdCargo?: number;
  IdSupervisor?: number;
  IdPTerreno?: number;
  IdAPR?: number;
  IdADO?: number;
  IdRiesgoAsociado?: number;
  IdLesion?: number;
  IdParteCuerpo?: number;
  CalificacionPS?: string;         // 'Leve' | 'Menor' | 'Importante' | 'Grave' | 'Fatal'
  FuenteAgente?: string;
  Accion?: string;
  Condicion?: string;
  IdMaquinaEquipo?: number;
  IdCausaRaiz?: number;
  CtrlE?: boolean;
  CtrlS?: boolean;
  CtrlI?: boolean;
  CtrlA?: boolean;
  CtrlEPP?: boolean;
  Observaciones?: string;
  created_by?: number;
}

// =============================================
// REQUEST PARA ACTUALIZAR ACCIDENTE
// =============================================

export interface ActualizarAccidenteRequest {
  caso: 'Actualiza';
  IdAccidente: number;
  IdObra?: number;
  IdEmpresa?: number;
  IdTrabajador?: number;
  FechaAccidente?: string;
  HoraAccidente?: string;
  IdTipoAccidente?: number;
  Descripcion?: string;
  NumEnfermedadProfesional?: string;
  DiasPerdidosEstimados?: number;
  DiasPerdidosFinal?: number;
  /** `null` limpia la fecha en BD; omitir la clave = no modificar (clientes viejos). */
  FechaControl?: string | null;
  FechaAlta?: string | null;
  Estado?: string;
  IdCargo?: number;
  IdSupervisor?: number;
  IdPTerreno?: number;
  IdAPR?: number;
  IdADO?: number;
  IdRiesgoAsociado?: number;
  IdLesion?: number;
  IdParteCuerpo?: number;
  CalificacionPS?: string;
  FuenteAgente?: string;
  Accion?: string;
  Condicion?: string;
  IdMaquinaEquipo?: number;
  IdCausaRaiz?: number;
  CtrlE?: boolean;
  CtrlS?: boolean;
  CtrlI?: boolean;
  CtrlA?: boolean;
  CtrlEPP?: boolean;
  Observaciones?: string;
}

// =============================================
// REQUEST PARA LISTAR ACCIDENTES
// =============================================

export interface ListarAccidentesRequest {
  caso: 'Consultas';
  IdObra?: number;
  IdEmpresa?: number;
  FechaDesde?: string;             // YYYY-MM-DD
  FechaHasta?: string;             // YYYY-MM-DD
  IdTipoAccidente?: number;
  Estado?: string;
  limit?: number;
  offset?: number;
}

// =============================================
// RESPUESTA DE DROPDOWNS (ConsultaDropdowns)
// =============================================

export interface DropdownOption {
  id: number;
  nombre: string;
}

export interface ObraDropdown {
  IdObra: string;
  Nombre: string;
  Codigo: string | null;
  Estado: string;
  Descripcion: string | null;
}

export interface EmpresaDropdown {
  IdEmpresa: string;
  Nombre: string;
  RUT: string | null;
}

export interface TrabajadorDropdown {
  IdTrabajador: string;
  Nombre: string;
  RUT: string | null;
}

export interface CatalogoDropdown {
  [key: string]: string | null;
}

export interface AccidenteDropdowns {
  obras: ObraDropdown[];
  empresas: EmpresaDropdown[];
  trabajadores: TrabajadorDropdown[];
  riesgosAsociados: CatalogoDropdown[];
  lesiones: CatalogoDropdown[];
  partesCuerpo: CatalogoDropdown[];
  cargos: CatalogoDropdown[];
  maquinasEquipos: CatalogoDropdown[];
  causasRaiz: CatalogoDropdown[];
  calificacionPS: string[];
  tiposAccidente: CatalogoDropdown[];
  estados: string[];
}

// =============================================
// RESPUESTA DE ESTADÍSTICAS
// =============================================

export interface EstadisticasApiResponse {
  por_riesgo: { Riesgo: string; Total: string; NivelPeligro: string }[];
  por_mes: { Mes: string; Total: string }[];
  por_gravedad: { Gravedad: string; Total: string }[];
  por_tipo: { TipoAccidente: string; Total: string }[];
  por_parte_cuerpo: { ParteCuerpo: string; Total: string }[];
  total_accidentes: string;
}

// =============================================
// RESPUESTA DE CREACIÓN
// =============================================

export interface CrearAccidenteResponse {
  IdAccidente: number;
  NumeroAccidente: string;
  success: boolean;
}

// =============================================
// ENUMERACIONES
// =============================================

export type CalificacionPotencialSeveridad = 'Leve' | 'Menor' | 'Importante' | 'Grave' | 'Fatal';

export type EstadoAccidente = 'Reportado' | 'En_Investigacion' | 'Cerrado' | 'Anulado';

// =============================================
// CONSTANTES PARA DROPDOWNS ESTÁTICOS
// =============================================

export const CALIFICACION_PS_OPTIONS: CalificacionPotencialSeveridad[] = [
  'Leve', 'Menor', 'Importante', 'Grave', 'Fatal'
];

export const ESTADO_ACCIDENTE_OPTIONS: EstadoAccidente[] = [
  'Reportado', 'En_Investigacion', 'Cerrado', 'Anulado'
];

/** Etiquetas de UI; `anulado` minúsculas solo por datos legados si existieran. */
export const ESTADO_LABELS: Record<string, string> = {
  'Reportado': 'Reportado',
  'En_Investigacion': 'En Investigación',
  'Cerrado': 'Cerrado',
  'Anulado': 'Anulado',
  'anulado': 'Anulado'
};

export function isAccidenteAnulado(estado: string | null | undefined): boolean {
  return typeof estado === 'string' && estado.trim().length > 0 && estado.trim().toLowerCase() === 'anulado';
}
