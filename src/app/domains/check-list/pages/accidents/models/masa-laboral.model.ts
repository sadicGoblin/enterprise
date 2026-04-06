/**
 * Modelo de datos para el módulo de Masa Laboral
 * Conectado con API: POST /ws/MasaLaboralSvcImpl.php
 */

// =============================================
// RESPUESTA API - Registro de Masa Laboral
// =============================================

export interface MasaLaboralApiResponse {
  IdMasaLaboral: string;
  TipoEmpresa: string; // 'INARCO' o 'SUBCONTRATO'
  Periodo: string; // Formato: YYYY-MM
  CantidadTrabajadores: string;
  Observaciones: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// =============================================
// REQUEST - Crear Masa Laboral
// =============================================

export interface CrearMasaLaboralRequest {
  caso: 'Crea';
  TipoEmpresa: string; // 'INARCO' o 'SUBCONTRATO'
  Periodo: string; // Formato: YYYY-MM
  CantidadTrabajadores: number;
  Observaciones?: string;
  created_by?: number;
}

// =============================================
// REQUEST - Actualizar Masa Laboral
// =============================================

export interface ActualizarMasaLaboralRequest {
  caso: 'Actualiza';
  IdMasaLaboral: number;
  TipoEmpresa: string; // 'INARCO' o 'SUBCONTRATO'
  Periodo: string; // Formato: YYYY-MM
  CantidadTrabajadores: number;
  Observaciones?: string;
  updated_by?: number;
}

// =============================================
// REQUEST - Listar Masa Laboral
// =============================================

export interface ListarMasaLaboralRequest {
  caso: 'Consultas';
  TipoEmpresa?: string;
  Periodo?: string;
  Anio?: number;
}

// =============================================
// REQUEST - Eliminar Masa Laboral
// =============================================

export interface EliminarMasaLaboralRequest {
  caso: 'Elimina';
  IdMasaLaboral: number;
}

// =============================================
// MODELO DE VISTA - Para uso en componentes
// =============================================

export interface MasaLaboral {
  idMasaLaboral: number;
  tipoEmpresa: string; // 'INARCO' o 'SUBCONTRATO'
  periodo: string;
  anio: number;
  mes: number;
  cantidadTrabajadores: number;
  observaciones: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
}

// =============================================
// HELPERS
// =============================================

export class MasaLaboralMapper {
  /**
   * Convierte respuesta API a modelo de vista
   */
  static toViewModel(apiResponse: MasaLaboralApiResponse): MasaLaboral {
    const [anio, mes] = apiResponse.Periodo.split('-').map(Number);
    
    return {
      idMasaLaboral: parseInt(apiResponse.IdMasaLaboral, 10),
      tipoEmpresa: apiResponse.TipoEmpresa,
      periodo: apiResponse.Periodo,
      anio,
      mes,
      cantidadTrabajadores: parseInt(apiResponse.CantidadTrabajadores, 10),
      observaciones: apiResponse.Observaciones,
      createdAt: new Date(apiResponse.created_at),
      updatedAt: new Date(apiResponse.updated_at),
      createdBy: apiResponse.created_by ? parseInt(apiResponse.created_by, 10) : null,
      updatedBy: apiResponse.updated_by ? parseInt(apiResponse.updated_by, 10) : null
    };
  }

  /**
   * Convierte array de respuestas API a modelos de vista
   */
  static toViewModelArray(apiResponses: MasaLaboralApiResponse[]): MasaLaboral[] {
    return apiResponses.map(response => this.toViewModel(response));
  }

  /**
   * Formatea periodo para mostrar (ej: "2026-03" -> "Marzo 2026")
   */
  static formatPeriodo(periodo: string, locale: string = 'es-ES'): string {
    const [anio, mes] = periodo.split('-');
    const fecha = new Date(parseInt(anio), parseInt(mes) - 1, 1);
    return fecha.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }

  /**
   * Obtiene el periodo actual en formato YYYY-MM
   */
  static getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Genera lista de periodos para un año
   */
  static generatePeriodsForYear(year: number): string[] {
    return Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0');
      return `${year}-${month}`;
    });
  }
}
