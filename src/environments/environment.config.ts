/**
 * Environment configuration interface
 * This defines the shape of all environment configuration objects
 */
export interface EnvironmentConfig {
  production: boolean;
  apiBaseUrl: string;
  apis: {
    usuario: string;
    perfil: string;
    // Add more API endpoints as needed
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
}
