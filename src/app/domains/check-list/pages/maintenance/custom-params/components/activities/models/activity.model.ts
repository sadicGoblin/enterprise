export interface ActivityItem {
    id: string;
    code: string;
    name: string;
    // Propiedades originales para la tabla
    codigo?: string;
    nombre?: string;
    frequency: string;
    category: string;
    parameter: string;
    document: string;
    idAmbito: string;
    idFrequency: string;
    idCategory: string;
    idParameter: string;
    idDocument: string;
    // Nuevos campos que vienen directamente del backend
    periocidad?: string;
    CategoriaActividad?: string;
    parametroAsociado?: string;
    documentoAsociado?: string;
    idBiblioteca?: string; // Campo real para documentos desde el backend
    // Propiedades de nombres resueltos para mostrar en la tabla (compatibilidad)
    frequencyName?: string;
    categoryName?: string;
    parameterName?: string;
    documentName?: string;
    scopeName?: string;
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