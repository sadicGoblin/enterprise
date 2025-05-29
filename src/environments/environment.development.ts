import { EnvironmentConfig } from './environment.config';

/**
 * Development environment configuration
 */
export const environment: EnvironmentConfig = {
  production: false,
  apiBaseUrl: 'http://raam-hosting.cl/apissoma',
  apis: {
    usuario: '/ws/UsuarioSvcImpl.php',
    perfil: '/ws/PerfilSvcImpl.php',
    // Add more API endpoints as needed
  }
};
