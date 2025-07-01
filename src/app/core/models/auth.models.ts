export interface LoginRequest {
  caso: string; // Required parameter with value 'Consulta'
  usuario: string;
  idUsuario?: number; // Optional
}

export interface LoginResponse {
  // New API format fields
  success: boolean;
  code: number;
  message: string;
  data?: {
    IdUsuario: string;
    Usuario: string;
    Nombre: string;
    IdCargo: string;
    Cargo: string;
    IdPerfil: string;
    Perfil: string;
    IdTipoAcceso: string;
    TipoAcceso: string;
    IdEmpresaContratista: string;
    EmpresaContratista: string;
    EMail: string;
    NroCelular: string;
    Clave: string;
    Nueva: string;
    [key: string]: any; // For other potential fields
  };
  
  // Keep legacy fields for backward compatibility
  glosa?: string;
  codigo?: number;
}

export interface PerfilRequest {
  caso: string; // Required parameter with value 'Consulta'
  idUsuario: number;
  usuario?: string; // Optional
}

export interface PerfilResponse {
  glosa: string;
  codigo: number;
  data?: Array<{
    IdUsuario: string;
    Usuario: string;
    Nombre: string;
    EMail: string;
    Perfil: string;
    Cargo: string;
    [key: string]: any; // For other potential fields
  }>;
}
