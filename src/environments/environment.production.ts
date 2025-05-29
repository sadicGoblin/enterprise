import { EnvironmentConfig } from './environment.config';

/**
 * Production environment configuration
 */
export const environment: EnvironmentConfig = {
  production: true,
  apiBaseUrl: 'http://raam-hosting.cl/apissoma', // Update this with your production API URL
  apis: {
    usuario: '/ws/UsuarioSvcImpl.php',
    perfil: '/ws/PerfilSvcImpl.php',
    // Add more API endpoints as needed
  }
};
