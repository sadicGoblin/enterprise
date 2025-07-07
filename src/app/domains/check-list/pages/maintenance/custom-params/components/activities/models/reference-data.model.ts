export interface FrequencyOption {
    id: string;
    IdDet?: string;
    IdSubParam?: string;
    Nombre: string;
    nombre?: string;
    [key: string]: any;
  }
  
  export interface CategoryOption {
    id: string;
    IdDet?: string;
    IdSubParam?: string;
    Nombre: string;
    nombre?: string;
    [key: string]: any;
  }
  
  export interface ParameterOption {
    id: string;
    IdDet?: string;
    IdParametro?: string;
    idParametro?: string;
    idDetalle?: string;
    Nombre: string;
    nombre?: string;
    [key: string]: any;
  }
  
  export interface DocumentOption {
    id: string;
    IdDocumento?: string;
    idDocumento?: string;
    idBiblioteca?: string;
    Nombre: string;
    nombreArchivo?: string;
    [key: string]: any;
  }
  
  export interface ReferenceData {
    frequencyOptions: FrequencyOption[];
    categoryOptions: CategoryOption[];
    parameterOptions: ParameterOption[];
    documentOptions: DocumentOption[];
  }