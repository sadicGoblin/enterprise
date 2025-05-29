export interface UsuarioRequest {
  caso: string;
}

export interface UsuarioResponse {
  codigo: number;
  glosa: string;
  data: UsuarioItem[];
}

export interface UsuarioItem {
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
  celular: string;
  Clave: string;
  Nueva: string;
}
