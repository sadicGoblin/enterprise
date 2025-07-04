export interface UsuarioRequest {
  caso: string;
}

export interface UsuarioResponse {
  codigo?: number;
  glosa?: string;
  success?: boolean;    // New API format
  message?: string;     // New API format
  data: any[];          // Support both API formats
}

export interface UsuarioItem {
  // Legacy fields
  IdUsuario?: string;
  Usuario?: string;
  Nombre?: string;
  IdCargo?: string;
  Cargo?: string;
  IdPerfil?: string;
  Perfil?: string;
  IdTipoAcceso?: string;
  TipoAcceso?: string;
  IdEmpresaContratista?: string;
  EmpresaContratista?: string;
  EMail?: string;
  celular?: string;
  Clave?: string;
  Nueva?: string;
}
