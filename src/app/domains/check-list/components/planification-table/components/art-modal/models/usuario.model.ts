export interface UsuarioRequest {
  caso: string;
  idUsuario: number;
  usuario: string | null;
}

export interface Usuario {
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

export interface UsuarioResponse {
  success: boolean;
  code: number;
  message: string;
  data: Usuario[];
}
