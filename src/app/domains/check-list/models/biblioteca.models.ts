// Request model
export interface BibliotecaRequest {
  caso: string;
  iDBiblioteca?: number;
  idBiblioteca?: number; // Alternative field name for some API cases
  titulo?: string | null;
  idTipo?: number;
  tipo?: string | null;
  agnio?: number;
  Nombre?: string | null;
  documento?: string | null;
}

// Response model
export interface BibliotecaResponse {
  // New API format fields
  success?: boolean;
  code?: number;
  message?: string;
  
  // Legacy API format fields
  codigo?: number;
  glosa?: string;
  
  // Data is present in both formats
  data: BibliotecaItem[];
}

// Biblioteca Item model
export interface BibliotecaItem {
  IdBiblioteca: string;
  Titulo: string;
  Nombre: string;
  IdTipo: string;
  Tipo: string;
  Agnio: string;
  Documento?: string;
  
  // Additional properties for document viewing
  IdDocumento?: number;
  NombreDocumento?: string;
  ArchivoBase64?: string;
  NombreArchivo?: string;
}
