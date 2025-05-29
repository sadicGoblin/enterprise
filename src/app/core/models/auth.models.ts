export interface LoginRequest {
  caso: string; // Required parameter with value 'Consulta'
  usuario: string;
  idUsuario?: number; // Optional
}

export interface LoginResponse {
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
