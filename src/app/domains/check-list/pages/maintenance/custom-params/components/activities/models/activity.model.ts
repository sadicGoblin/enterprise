export interface ActivityItem {
    id: string;
    code: string;
    name: string;
    frequency: string;
    category: string;
    parameter: string;
    document: string;
    idAmbito: string;
    idFrequency: string;
    idCategory: string;
    idParameter: string;
    idDocument: string;
  }
  
  export interface ApiActivityResponse {
    success: boolean;
    data: any[];
    msg?: string;
    message?: string;
  }
  
  export interface NewActivityRequest {
    caso: string;
    idAmbito: string;
    codigo: string;
    nombre: string;
    idPeriocidad: string;
    idCategoriaActividad: string;
    idParametroAsociado: string;
    idBiblioteca: string;
  }
  
  export interface UpdateActivityRequest extends NewActivityRequest {
    idActividades: string;
  }